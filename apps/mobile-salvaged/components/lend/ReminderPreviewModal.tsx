/**
 * Reminder SMS preview modal — follow-up reminder for items already lent.
 *
 * Same UX pattern as SmsPreviewModal but uses the reminder templates
 * (chill / friendly / warm) instead of the initial lend templates.
 * The user picks a tone, previews the message in an iMessage-green
 * chat bubble, and taps Send to open the native SMS composer.
 *
 * Last-used reminder tone is persisted to AsyncStorage on Send so the
 * next reminder defaults to the same tone. Exploring tones without
 * sending does not persist.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import {
  renderReminderSms,
  REMINDER_TONES,
  type ReminderTone,
} from '@/lib/sms/reminderTemplates';

export const LAST_REMINDER_TONE_KEY = 'lendlee.lastReminderTone';
export const DEFAULT_REMINDER_TONE: ReminderTone = 'friendly';

export type ReminderPreviewModalProps = {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string, tone: ReminderTone) => void;
  borrowerName: string;
  borrowerPhone: string;
  itemTitle: string;
  submitting?: boolean;
};

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function isReminderTone(value: unknown): value is ReminderTone {
  return (
    typeof value === 'string' &&
    (REMINDER_TONES as readonly string[]).includes(value)
  );
}

export default function ReminderPreviewModal({
  visible,
  onClose,
  onSend,
  borrowerName,
  borrowerPhone,
  itemTitle,
  submitting = false,
}: ReminderPreviewModalProps) {
  const [tone, setTone] = useState<ReminderTone>(DEFAULT_REMINDER_TONE);

  // Load last-used reminder tone on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LAST_REMINDER_TONE_KEY);
        if (cancelled) return;
        if (isReminderTone(stored)) setTone(stored);
      } catch {
        // Non-fatal — 'friendly' is a safe default.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finalMessage = useMemo(
    () =>
      renderReminderSms(
        {
          borrowerName: borrowerName || 'them',
          itemTitle: itemTitle || 'the item',
        },
        tone,
      ),
    [tone, borrowerName, itemTitle],
  );

  const handleToneChange = (next: ReminderTone) => {
    if (next === tone || submitting) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTone(next);
  };

  const handleCancel = () => {
    if (submitting) return;
    onClose();
  };

  const handleSend = async () => {
    if (submitting) return;
    // Persist tone on Send, not on every tap.
    try {
      await AsyncStorage.setItem(LAST_REMINDER_TONE_KEY, tone);
    } catch {
      // Non-fatal.
    }
    onSend(finalMessage, tone);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID="reminder-preview-modal"
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Send reminder</Text>
          <Text style={styles.subtitle}>
            Pick a tone — we'll hand it off to your Messages app.
          </Text>

          <View style={styles.segmented} testID="reminder-preview-tones">
            {REMINDER_TONES.map((t, i) => {
              const selected = t === tone;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.segment,
                    selected && styles.segmentSelected,
                    i === 0 && styles.segmentFirst,
                    i === REMINDER_TONES.length - 1 && styles.segmentLast,
                  ]}
                  onPress={() => handleToneChange(t)}
                  activeOpacity={0.7}
                  disabled={submitting}
                  testID={`reminder-preview-tone-${t}`}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      selected && styles.segmentLabelSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.bubbleArea}>
            <View style={styles.bubble} testID="reminder-preview-bubble">
              <Text style={styles.bubbleText}>{finalMessage}</Text>
            </View>
            <View style={styles.bubbleTail} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={submitting}
              activeOpacity={0.7}
              testID="reminder-preview-cancel"
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                submitting && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={submitting}
              activeOpacity={0.8}
              testID="reminder-preview-send"
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.sendLabel}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const IMESSAGE_GREEN = '#34C759';
const IMESSAGE_GREEN_DARK = '#2BA84A';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: -8,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.cardMuted,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentFirst: {},
  segmentLast: {},
  segmentSelected: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.mutedForeground,
    textTransform: 'capitalize',
  },
  segmentLabelSelected: {
    color: Colors.foreground,
    fontWeight: '600',
  },
  bubbleArea: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginTop: 4,
    marginRight: 6,
  },
  bubble: {
    backgroundColor: IMESSAGE_GREEN,
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  bubbleText: {
    color: Colors.white,
    fontSize: 15.5,
    lineHeight: 21,
  },
  bubbleTail: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: IMESSAGE_GREEN,
    bottom: -3,
    right: -2,
    transform: [{ rotate: '45deg' }],
    borderBottomRightRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.cardMuted,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.foreground,
  },
  sendButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: IMESSAGE_GREEN,
    shadowColor: IMESSAGE_GREEN_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
