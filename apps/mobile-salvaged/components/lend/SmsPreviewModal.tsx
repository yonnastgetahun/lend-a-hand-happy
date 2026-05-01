/**
 * SMS preview modal — the lend flow's magic moment (LENDLEE-013).
 *
 * Renders a chat-bubble preview of the outgoing SMS with a segmented
 * control (casual / friendly / formal) that swaps the wording live.
 * The bubble text comes from `renderSmsTemplate` so the preview the
 * user sees is byte-for-byte what they'll send.
 *
 * Tone state is owned here, not by the parent. It loads from
 * AsyncStorage (`lendlee.lastTone`) on mount and defaults to 'friendly'
 * for a first lend. The persist write happens on Send, not on every
 * tap — exploring tones doesn't pollute the saved preference. This is
 * the gotcha called out in the task's debug notes.
 *
 * The optional `submitting` prop is accepted (and disables both
 * actions + shows a spinner on Send) so the parent can run its
 * DB-then-SMS submit sequence without racing a double-tap. It's not
 * part of the strict AC, but the lend tab needs it.
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
  renderSmsTemplate,
  SMS_RENDER_TONES,
  type SmsRenderTone,
} from '@/lib/sms/templates';
import { setSkipPreviewSetting } from '@/lib/sms/lenderExperience';

export const LAST_TONE_KEY = 'lendlee.lastTone';
export const DEFAULT_TONE: SmsRenderTone = 'friendly';

export type SmsPreviewModalProps = {
  visible: boolean;
  onClose: () => void;
  /**
   * Fired when the user taps Send. Receives the final rendered SMS body
   * and the tone that produced it, so the caller can persist whichever
   * pieces it needs without re-rendering the template itself.
   */
  onSend: (finalMessage: string, tone: SmsRenderTone) => void;
  borrower: string;
  item: string;
  returnBy: Date | null;
  lenderName: string;
  /**
   * True while the parent runs its post-send work. Disables the buttons
   * and shows a spinner on Send. Optional — the AC version of the modal
   * doesn't require it.
   */
  submitting?: boolean;
  /** True when the user has completed >= 3 lends. Shows the skip checkbox. */
  isVeteran?: boolean;
  /** Current skip-preview preference (round-trips as checkbox default). */
  initialSkipPreview?: boolean;
};

// LayoutAnimation is opt-in on Android. Enabling it once at module load
// keeps the tone-swap transition smooth on both platforms; on iOS this
// is a no-op.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function isSmsRenderTone(value: unknown): value is SmsRenderTone {
  return (
    typeof value === 'string' &&
    (SMS_RENDER_TONES as readonly string[]).includes(value)
  );
}

export default function SmsPreviewModal({
  visible,
  onClose,
  onSend,
  borrower,
  item,
  returnBy,
  lenderName,
  submitting = false,
  isVeteran = false,
  initialSkipPreview = false,
}: SmsPreviewModalProps) {
  const [tone, setTone] = useState<SmsRenderTone>(DEFAULT_TONE);
  const [skipNext, setSkipNext] = useState(initialSkipPreview);

  // Load the last-used tone once on mount. We don't re-read it when the
  // modal toggles `visible` because each lend should pick up where the
  // last one left off, not where the in-memory state was reset.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LAST_TONE_KEY);
        if (cancelled) return;
        if (isSmsRenderTone(stored)) setTone(stored);
      } catch {
        // AsyncStorage failures are non-fatal — `friendly` is a safe
        // default and matches the first-lend behaviour anyway.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finalMessage = useMemo(
    () =>
      renderSmsTemplate({
        tone,
        borrowerName: borrower || 'them',
        lenderName: lenderName || 'your friend',
        itemTitle: item || 'the item',
        returnBy,
      }),
    [tone, borrower, lenderName, item, returnBy],
  );

  const handleToneChange = (next: SmsRenderTone) => {
    if (next === tone || submitting) return;
    // A quick layout fade so the bubble's height change as the wording
    // grows/shrinks doesn't feel like a hard cut.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTone(next);
  };

  const handleCancel = () => {
    if (submitting) return;
    onClose();
  };

  const handleSend = async () => {
    if (submitting) return;
    // Persist on Send (not on render or tone-tap) so trying out a tone
    // and then bailing doesn't change the saved preference.
    try {
      await AsyncStorage.setItem(LAST_TONE_KEY, tone);
    } catch {
      // Non-fatal — the next first-lend will fall back to 'friendly'.
    }
    // Persist skip-preview preference on Send (not on checkbox toggle).
    if (isVeteran) {
      await setSkipPreviewSetting(skipNext);
    }
    onSend(finalMessage, tone);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID="sms-preview-modal"
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Preview message</Text>
          <Text style={styles.subtitle}>
            Pick a tone — we'll hand it off to your Messages app.
          </Text>

          <View style={styles.segmented} testID="sms-preview-tones">
            {SMS_RENDER_TONES.map((t, i) => {
              const selected = t === tone;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.segment,
                    selected && styles.segmentSelected,
                    i === 0 && styles.segmentFirst,
                    i === SMS_RENDER_TONES.length - 1 && styles.segmentLast,
                  ]}
                  onPress={() => handleToneChange(t)}
                  activeOpacity={0.7}
                  disabled={submitting}
                  testID={`sms-preview-tone-${t}`}
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

          {isVeteran && (
            <TouchableOpacity
              style={styles.skipRow}
              onPress={() => setSkipNext((v) => !v)}
              activeOpacity={0.7}
              disabled={submitting}
              testID="skip-preview-toggle"
            >
              <View
                style={[
                  styles.checkbox,
                  skipNext && styles.checkboxChecked,
                ]}
                testID="skip-preview-checkbox"
              >
                {skipNext && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.skipLabel}>Skip preview next time</Text>
            </TouchableOpacity>
          )}

          <View style={styles.bubbleArea}>
            <View style={styles.bubble} testID="sms-preview-bubble">
              <Text style={styles.bubbleText}>{finalMessage}</Text>
            </View>
            {/* iMessage-style tail tucked under the bubble's bottom-right. */}
            <View style={styles.bubbleTail} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={submitting}
              activeOpacity={0.7}
              testID="sms-preview-cancel"
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
              testID="sms-preview-send"
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

// iMessage's outgoing-bubble green. Hard-coded rather than added to the
// shared palette because it's a deliberate skeuomorphic cue here, not a
// brand color we'd want to reuse anywhere else.
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
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.mutedForeground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: IMESSAGE_GREEN,
    borderColor: IMESSAGE_GREEN,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: -1,
  },
  skipLabel: {
    fontSize: 13,
    color: Colors.mutedForeground,
    fontWeight: '500',
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
  // The tail is a 14x14 square rotated 45deg, tucked behind the bubble's
  // bottom-right so it reads as a speech-bubble pointer.
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
