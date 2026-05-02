/**
 * Lend tab — WHO → WHAT → WHEN → SMS → Done.
 *
 * The UI collects the five submit inputs (selectedContact, itemTitle,
 * category, returnBy, tone) and hands them off to `submitLend()`, which
 * writes the loan to Supabase BEFORE opening the SMS composer. See
 * LENDLEE-017 for the submit contract.
 *
 * The preview modal's Send button is the single trigger for the full
 * submit — there is no separate "Lend it" button that fires the DB call
 * on its own. That ordering is what lets us keep the AC invariant of
 * "record exists even if the user cancels the SMS".
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import * as Contacts from 'expo-contacts';
import Colors from '@/constants/colors';
import ContactPicker from '@/components/lend/ContactPicker';
import ItemInput from '@/components/lend/ItemInput';
import TimeframeSelector from '@/components/lend/TimeframeSelector';
import SmsPreviewModal from '@/components/lend/SmsPreviewModal';
import {
  getContactsPermissionStatus,
  requestContactsPermission,
  type ContactsPermissionStatus,
} from '@/lib/permissions/contacts';
import {
  submitLend,
  type SubmitLendResult,
} from '@/lib/lend/submitLend';
import type { LendCategory } from '@/lib/categorize/autoCategory';
import type { SmsTone, SmsRenderTone } from '@/lib/sms/templates';
import type { Contact as LendContact } from '@/lib/types/contact';
import { useAuth } from '@/providers/AuthProvider';
import {
  getLenderExperience,
  setSkipPreviewSetting,
  type LenderExperience,
} from '@/lib/sms/lenderExperience';
import {
  requestNotificationPermission,
  scheduleReminder,
} from '@/lib/notifications/scheduleReminder';

// Type alias for the in-app Contact shape consumed by ContactPicker.
import type { Contact as AppContact } from '@/types';

/**
 * SmsPreviewModal speaks SmsRenderTone (casual/friendly/formal) — the
 * lender-perspective tone set used by `renderSmsTemplate`. submitLend
 * still speaks the older SmsTone (friendly/casual/direct) for the DB
 * column. Map the one outlier here so the rest of the flow stays put.
 */
function toSubmitTone(t: SmsRenderTone): SmsTone {
  return t === 'formal' ? 'direct' : t;
}

function toLendContact(c: AppContact): LendContact | null {
  if (!c.phone) return null;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    source: 'device',
  };
}

export default function LendScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [permissionStatus, setPermissionStatus] =
    useState<ContactsPermissionStatus>('undetermined');
  const [deviceContacts, setDeviceContacts] = useState<AppContact[]>([]);

  const [selectedContact, setSelectedContact] = useState<LendContact | null>(null);
  const [itemTitle, setItemTitle] = useState<string>('');
  const [category, setCategory] = useState<LendCategory>('other');
  const [returnBy, setReturnBy] = useState<Date | null>(null);

  // Tone is owned by SmsPreviewModal (it persists last-used to AsyncStorage).
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Veteran lender experience — loaded on mount, gates skip-preview.
  const [lenderExp, setLenderExp] = useState<LenderExperience | null>(null);

  // Load lender experience (veteran status, skip-preview, last tone) on
  // mount. Called inside useEffect so it doesn't block initial render.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getLenderExperience(user.id).then((exp) => {
      if (!cancelled) setLenderExp(exp);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch permission + device contacts on mount. Explicitly NOT gated on
  // a button tap here because this screen IS the lend action; the user
  // has already opted in by navigating to it.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const current = await getContactsPermissionStatus();
      let status = current.status;
      if (status === 'undetermined' && current.canAskAgain) {
        const next = await requestContactsPermission();
        status = next.status;
      }
      if (cancelled) return;
      setPermissionStatus(status);

      if (status === 'granted') {
        try {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          });
          if (cancelled) return;
          const mapped: AppContact[] = (data ?? [])
            .filter((c) => c.name && c.phoneNumbers?.[0]?.number)
            .map((c) => ({
              id: c.id ?? `${c.name}-${c.phoneNumbers?.[0]?.number}`,
              name: c.name ?? '',
              phone: c.phoneNumbers?.[0]?.number ?? '',
            }));
          setDeviceContacts(mapped);
        } catch {
          // Contact fetch failures are non-fatal — the user can still
          // use the manual add-contact row.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleContactSelect = useCallback((c: AppContact) => {
    const lendContact = toLendContact(c);
    if (!lendContact) {
      Alert.alert(
        'No phone number',
        'This contact has no phone number on file. Pick another or add one manually.',
      );
      return;
    }
    setSelectedContact(lendContact);
  }, []);

  const handleItemChange = useCallback(
    ({ title, category: nextCategory }: { title: string; category: LendCategory }) => {
      setItemTitle(title);
      setCategory(nextCategory);
    },
    [],
  );

  const handleSubmitOrPreview = useCallback(async () => {
    if (!selectedContact) return;
    if (!itemTitle.trim()) {
      Alert.alert('Name the item', 'Tell us what you are lending.');
      return;
    }

    // Veteran skip-preview path: if the composite says skip AND we have a
    // last-used tone, bypass the modal entirely — submit + send directly.
    if (lenderExp?.skipPreview && lenderExp.lastUsedTone) {
      if (submitting) return;
      setSubmitting(true);
      try {
        const result = await submitLend({
          selectedContact,
          itemTitle,
          category,
          returnBy,
          tone: toSubmitTone(lenderExp.lastUsedTone as SmsRenderTone),
          lenderName:
            (user?.user_metadata?.name as string | undefined) ??
            user?.email?.split('@')[0] ??
            '',
        });
        handleResult(result);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setPreviewOpen(true);
  }, [selectedContact, itemTitle, lenderExp, submitting, category, returnBy, user, handleResult]);

  const closePreview = useCallback(() => {
    if (submitting) return;
    setPreviewOpen(false);
  }, [submitting]);

  const resetForm = useCallback(() => {
    setSelectedContact(null);
    setItemTitle('');
    setCategory('other');
    setReturnBy(null);
    // Tone state lives in the modal; AsyncStorage is the source of truth
    // for the next lend's default, so nothing to reset here.
  }, []);

  /**
   * After a successful lend, schedule a local reminder notification
   * 1 day before the return date (if one was set). Permission is
   * requested on the first call; subsequent calls are no-ops if
   * already granted.
   */
  const maybeScheduleReminder = useCallback(
    async (loan: { id: string; borrower_name?: string | null }) => {
      if (!returnBy) return;
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleReminder(
        loan.id,
        loan.borrower_name ?? selectedContact?.name ?? 'Someone',
        itemTitle,
        returnBy,
      );
    },
    [returnBy, selectedContact, itemTitle],
  );

  const handleResult = useCallback(
    (result: SubmitLendResult) => {
      switch (result.kind) {
        case 'validation-error':
          Alert.alert('Missing info', result.message);
          return;
        case 'db-error':
          // Keep form state so the user can retry without re-entering.
          Alert.alert(
            "Couldn't save",
            result.error.message || 'Please try again.',
          );
          return;
        case 'sms-cancelled':
          // Neutral toast: the loan row exists, we just didn't message.
          maybeScheduleReminder(result.loan);
          Alert.alert('Saved', 'Saved — SMS not sent.');
          setPreviewOpen(false);
          resetForm();
          router.back();
          return;
        case 'sms-copied':
          maybeScheduleReminder(result.loan);
          Alert.alert(
            'Message copied',
            'Your Messages app was unavailable, so we copied the text. Paste it into any messaging app to send.',
          );
          setPreviewOpen(false);
          resetForm();
          router.back();
          return;
        case 'sms-sent':
          maybeScheduleReminder(result.loan);
          Alert.alert('Sent', `Lent to ${result.loan.borrower_name ?? 'them'}.`);
          setPreviewOpen(false);
          resetForm();
          router.back();
          return;
        case 'sms-unknown':
        default:
          // Android sometimes can't report the outcome. Treat as
          // best-effort success: row exists, message was handed to the
          // composer, we just don't know if the user hit Send.
          maybeScheduleReminder(result.loan);
          Alert.alert('Saved', 'Loan saved. Check your Messages app to confirm the text.');
          setPreviewOpen(false);
          resetForm();
          router.back();
          return;
      }
    },
    [resetForm, router, maybeScheduleReminder],
  );

  const handleSend = useCallback(
    async (_finalMessage: string, sendTone: SmsRenderTone) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const result = await submitLend({
          selectedContact,
          itemTitle,
          category,
          returnBy,
          tone: toSubmitTone(sendTone),
          lenderName:
            (user?.user_metadata?.name as string | undefined) ??
            user?.email?.split('@')[0] ??
            '',
        });
        handleResult(result);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, selectedContact, itemTitle, category, returnBy, user, handleResult],
  );

  const canPreview = Boolean(selectedContact) && itemTitle.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Lend something',
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.earth,
          headerShadowVisible: false,
        }}
      />

      {!selectedContact ? (
        <View style={styles.contactSection}>
          <Text style={styles.sectionHeader}>Who are you lending to?</Text>
          <ContactPicker
            contacts={deviceContacts}
            onSelect={handleContactSelect}
            permissionStatus={permissionStatus}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contactRow}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Lending to</Text>
              <Text style={styles.contactName}>{selectedContact.name}</Text>
              <Text style={styles.contactPhone}>{selectedContact.phone}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedContact(null)}
              style={styles.changeButton}
              testID="change-contact-button"
            >
              <Text style={styles.changeButtonLabel}>Change</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>What?</Text>
          <ItemInput
            initialTitle={itemTitle}
            initialCategory={category}
            onChange={handleItemChange}
            autoFocus={Platform.OS !== 'web'}
          />

          <Text style={styles.sectionLabel}>When?</Text>
          <TimeframeSelector onChange={setReturnBy} />

          <TouchableOpacity
            style={[styles.submitButton, !canPreview && styles.submitButtonDisabled]}
            onPress={handleSubmitOrPreview}
            disabled={!canPreview || submitting}
            activeOpacity={0.85}
            testID="lend-preview-button"
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonLabel}>Preview message</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      <SmsPreviewModal
        visible={previewOpen}
        onClose={closePreview}
        onSend={handleSend}
        borrower={selectedContact?.name ?? ''}
        lenderName={
          (user?.user_metadata?.name as string | undefined) ??
          user?.email?.split('@')[0] ??
          ''
        }
        item={itemTitle}
        returnBy={returnBy}
        submitting={submitting}
        isVeteran={lenderExp?.isVeteran ?? false}
        initialSkipPreview={lenderExp?.skipPreview ?? false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  contactSection: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.foreground,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.cardMuted,
  },
  changeButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.earthLight,
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 4,
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonLabel: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
