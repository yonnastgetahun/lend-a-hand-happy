/**
 * Loan detail screen (LENDLEE-019).
 *
 * Shows loan details (borrower, item, status) and provides a
 * "Send Reminder" button that opens ReminderPreviewModal. On send,
 * it calls sendSms to open the native SMS composer with the rendered
 * reminder message, then shows a success toast.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { sendSms } from '@/lib/sms/sendSms';
import type { ReminderTone } from '@/lib/sms/reminderTemplates';
import ReminderPreviewModal from '@/components/lend/ReminderPreviewModal';
import { SuccessToast } from '@/components/SuccessToast';

type LoanDetail = {
  id: string;
  borrower_name: string | null;
  borrower_phone: string | null;
  status: 'active' | 'returned' | 'overdue';
  lent_at: string;
  return_by: string | null;
  returned_at: string | null;
  notes: string | null;
  items: {
    id: string;
    title: string;
    category: string;
  } | null;
};

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reminderVisible, setReminderVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('No loan ID provided.');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('loans')
        .select('id, borrower_name, borrower_phone, status, lent_at, return_by, returned_at, notes, items(id, title, category)')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (fetchError || !data) {
        setError(fetchError?.message ?? 'Loan not found.');
        setLoading(false);
        return;
      }

      setLoan(data as unknown as LoanDetail);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSendReminder = useCallback(
    async (message: string, _tone: ReminderTone) => {
      if (!loan?.borrower_phone) return;

      setSending(true);
      try {
        const result = await sendSms({
          phone: loan.borrower_phone,
          message,
        });

        if (result.status === 'sent') {
          setToastMessage('Reminder sent!');
        } else if (result.status === 'copied') {
          setToastMessage('Message copied to clipboard.');
        } else {
          setToastMessage('Reminder ready.');
        }
        setToastVisible(true);
      } finally {
        setSending(false);
        setReminderVisible(false);
      }
    },
    [loan],
  );

  const hideToast = useCallback(() => setToastVisible(false), []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Loan' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !loan) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Loan' }} />
        <Text style={styles.title}>Loan detail</Text>
        <Text style={styles.subtitle}>id: {id ?? 'unknown'}</Text>
        <Text style={styles.body}>{error ?? 'Loan not found.'}</Text>
      </View>
    );
  }

  const borrowerName = loan.borrower_name ?? 'Someone';
  const itemTitle = loan.items?.title ?? 'an item';
  const lentDate = new Date(loan.lent_at).toLocaleDateString();
  const returnByDate = loan.return_by
    ? new Date(loan.return_by).toLocaleDateString()
    : null;
  const isActive = loan.status === 'active';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: itemTitle }}
      />
      <SuccessToast
        visible={toastVisible}
        message={toastMessage}
        onHide={hideToast}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>{itemTitle}</Text>

        <View style={styles.card}>
          <DetailRow label="Borrower" value={borrowerName} />
          {loan.borrower_phone && (
            <DetailRow label="Phone" value={loan.borrower_phone} />
          )}
          <DetailRow label="Status" value={loan.status} />
          <DetailRow label="Lent on" value={lentDate} />
          {returnByDate && (
            <DetailRow label="Return by" value={returnByDate} />
          )}
          {loan.returned_at && (
            <DetailRow
              label="Returned"
              value={new Date(loan.returned_at).toLocaleDateString()}
            />
          )}
          {loan.notes && <DetailRow label="Notes" value={loan.notes} />}
        </View>

        {isActive && loan.borrower_phone && (
          <TouchableOpacity
            style={styles.reminderButton}
            onPress={() => setReminderVisible(true)}
            activeOpacity={0.8}
            testID="send-reminder-button"
          >
            <Text style={styles.reminderButtonLabel}>Send Reminder</Text>
          </TouchableOpacity>
        )}

        {isActive && !loan.borrower_phone && (
          <Text style={styles.noPhoneNote}>
            No phone number on file — add one to send a reminder.
          </Text>
        )}
      </ScrollView>

      <ReminderPreviewModal
        visible={reminderVisible}
        onClose={() => setReminderVisible(false)}
        onSend={handleSendReminder}
        borrowerName={borrowerName}
        borrowerPhone={loan.borrower_phone ?? ''}
        itemTitle={itemTitle}
        submitting={sending}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  body: {
    fontSize: 15,
    color: Colors.foreground,
    marginTop: 12,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.mutedForeground,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.foreground,
    flex: 2,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  reminderButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderButtonLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  noPhoneNote: {
    fontSize: 13,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
