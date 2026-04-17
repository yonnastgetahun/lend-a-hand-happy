import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Calendar, SkipForward } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLendlee } from '@/providers/LendleeProvider';
import { formatDate } from '@/utils/categories';

const REMINDER_OPTIONS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
];

export default function SetReminderScreen() {
  const { itemId, contactId } = useLocalSearchParams<{ itemId: string; contactId: string }>();
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { lendItem, getItemById, getContactById } = useLendlee();
  const router = useRouter();

  const item = itemId ? getItemById(itemId) : undefined;
  const contact = contactId ? getContactById(contactId) : undefined;

  const returnDate = selectedDays
    ? new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000)
    : null;

  const handleLend = useCallback(async (skipReminder: boolean) => {
    if (!itemId || !contactId) return;
    setIsSubmitting(true);
    try {
      const returnBy = !skipReminder && selectedDays
        ? new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      await lendItem({ itemId, contactId, returnBy });
      router.dismissAll();
    } catch (err) {
      console.log('Failed to lend item:', err);
      Alert.alert('Error', 'Failed to lend item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [itemId, contactId, selectedDays, lendItem, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Set Reminder',
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.earth,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Lending{' '}
            <Text style={styles.summaryBold}>{item?.title ?? 'item'}</Text>
            {' '}to{' '}
            <Text style={styles.summaryBold}>{contact?.name ?? 'contact'}</Text>
          </Text>
        </View>

        <Text style={styles.sectionLabel}>When should they return it?</Text>

        <View style={styles.optionsGrid}>
          {REMINDER_OPTIONS.map((opt) => {
            const isSelected = selectedDays === opt.days;
            return (
              <TouchableOpacity
                key={opt.days}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelectedDays(opt.days)}
                activeOpacity={0.7}
              >
                <Calendar size={20} color={isSelected ? Colors.cream : Colors.primary} />
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {returnDate && (
          <Text style={styles.datePreview}>
            Return by {formatDate(returnDate.toISOString())}
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.lendButton,
              !selectedDays && styles.lendButtonDisabled,
            ]}
            onPress={() => void handleLend(false)}
            disabled={!selectedDays || isSubmitting}
            activeOpacity={0.8}
            testID="lend-with-reminder-button"
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <Text style={styles.lendButtonText}>Lend with Reminder</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => void handleLend(true)}
            disabled={isSubmitting}
            activeOpacity={0.7}
            testID="skip-reminder-button"
          >
            <SkipForward size={18} color={Colors.mutedForeground} />
            <Text style={styles.skipButtonText}>Skip, lend without reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  summary: {
    backgroundColor: Colors.warmWhite,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryText: {
    fontSize: 16,
    color: Colors.muted,
    lineHeight: 24,
    textAlign: 'center',
  },
  summaryBold: {
    fontWeight: '700' as const,
    color: Colors.earth,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.earthLight,
    marginBottom: 14,
    paddingLeft: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  option: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.earth,
  },
  optionLabelSelected: {
    color: Colors.cream,
  },
  datePreview: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    marginTop: 'auto' as const,
    gap: 12,
    paddingBottom: 20,
  },
  lendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  lendButtonDisabled: {
    opacity: 0.5,
  },
  lendButtonText: {
    color: Colors.cream,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  skipButtonText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    fontWeight: '500' as const,
  },
});
