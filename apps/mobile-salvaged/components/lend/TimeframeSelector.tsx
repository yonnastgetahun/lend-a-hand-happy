import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Colors from '@/constants/colors';
import {
  TIMEFRAME_PRESETS,
  TIMEFRAME_LABELS,
  DEFAULT_TIMEFRAME_PRESET,
  addDays,
  formatReturnDate,
  getReturnByForPreset,
  type TimeframePreset,
} from '@/lib/date/timeframe';

export type TimeframeSelectorProps = {
  /**
   * Called whenever the user picks a preset (or the resolved date for
   * `Custom`). The selector also fires this on mount with the default
   * preset's date so the parent never has an undefined `returnBy`.
   */
  onChange: (returnBy: Date | null) => void;
  initialPreset?: TimeframePreset;
};

/**
 * WHEN step of the lend flow.
 *
 * Five horizontal chips: 1 week / 2 weeks / 1 month / Custom / No return date.
 * The selected chip is styled differently and a label below shows the
 * resolved return date in human-readable form. "Custom" opens the platform's
 * native date picker (imperative API on Android, modal-rendered component on
 * iOS) and "No return date" emits `null`.
 */
export default function TimeframeSelector({
  onChange,
  initialPreset = DEFAULT_TIMEFRAME_PRESET,
}: TimeframeSelectorProps) {
  const [selected, setSelected] = useState<TimeframePreset>(initialPreset);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [iosPickerOpen, setIosPickerOpen] = useState<boolean>(false);

  // Fire onChange immediately on mount so the parent has a value without
  // requiring the user to tap anything. Intentionally runs once: the
  // initialPreset is treated as a one-shot default, not a controlled prop.
  useEffect(() => {
    if (initialPreset === 'custom') {
      // No date yet, so emit null until the user picks one.
      onChange(null);
    } else {
      onChange(getReturnByForPreset(initialPreset));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAndroidPick = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set' && date) {
        setCustomDate(date);
        setSelected('custom');
        onChange(date);
      }
    },
    [onChange],
  );

  const openCustomPicker = useCallback(() => {
    const initialDate = customDate ?? addDays(new Date(), 14);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: 'date',
        minimumDate: new Date(),
        onChange: handleAndroidPick,
      });
    } else {
      setIosPickerOpen(true);
    }
  }, [customDate, handleAndroidPick]);

  const handleSelect = useCallback(
    (preset: TimeframePreset) => {
      if (preset === 'custom') {
        setSelected('custom');
        openCustomPicker();
        return;
      }
      setSelected(preset);
      onChange(getReturnByForPreset(preset));
    },
    [openCustomPicker, onChange],
  );

  const handleIosPick = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (!date) return;
      setCustomDate(date);
      onChange(date);
    },
    [onChange],
  );

  const closeIosPicker = useCallback(() => {
    setIosPickerOpen(false);
  }, []);

  const resolvedReturnBy: Date | null =
    selected === 'custom'
      ? customDate
      : selected === 'none'
        ? null
        : getReturnByForPreset(selected);

  const hint =
    selected === 'none'
      ? 'No return date'
      : resolvedReturnBy
        ? `Return by ${formatReturnDate(resolvedReturnBy)}`
        : 'Pick a date';

  return (
    <View style={styles.container} testID="timeframe-selector">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TIMEFRAME_PRESETS.map((preset) => {
          const isSelected = selected === preset;
          return (
            <TouchableOpacity
              key={preset}
              testID={`timeframe-chip-${preset}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={TIMEFRAME_LABELS[preset]}
              onPress={() => handleSelect(preset)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipLabel,
                  isSelected && styles.chipLabelSelected,
                ]}
              >
                {TIMEFRAME_LABELS[preset]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.hint} testID="timeframe-hint">
        {hint}
      </Text>

      {Platform.OS === 'ios' && iosPickerOpen ? (
        <Modal
          transparent
          animationType="slide"
          visible={iosPickerOpen}
          onRequestClose={closeIosPicker}
        >
          <View style={styles.iosBackdrop}>
            <View style={styles.iosSheet}>
              <DateTimePicker
                value={customDate ?? addDays(new Date(), 14)}
                mode="date"
                display="inline"
                minimumDate={new Date()}
                onChange={handleIosPick}
                testID="timeframe-ios-picker"
              />
              <TouchableOpacity
                onPress={closeIosPicker}
                style={styles.iosDoneButton}
                testID="timeframe-ios-done"
              >
                <Text style={styles.iosDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },
  chipLabelSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.mutedForeground,
    paddingHorizontal: 4,
  },
  iosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  iosSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
  },
  iosDoneButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  iosDoneText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
