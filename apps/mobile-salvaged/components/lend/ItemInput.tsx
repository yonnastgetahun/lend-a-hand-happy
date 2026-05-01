import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import Colors from '@/constants/colors';
import {
  detectCategory,
  categoryLabels,
  categoryEmojis,
  LEND_CATEGORIES,
  type LendCategory,
} from '@/lib/categorize/autoCategory';

export type ItemInputChange = {
  title: string;
  category: LendCategory;
};

export type ItemInputProps = {
  initialTitle?: string;
  initialCategory?: LendCategory;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (change: ItemInputChange) => void;
};

/**
 * WHAT step of the lend flow. The user types a title; we auto-detect the
 * category and surface it as a chip below the input. The chip is tappable
 * to open a manual override picker.
 *
 * Detection runs in `useMemo` keyed on `title` so we don't recompute on
 * every unrelated re-render.
 */
export default function ItemInput({
  initialTitle = '',
  initialCategory,
  placeholder = 'What are you lending?',
  autoFocus = false,
  onChange,
}: ItemInputProps) {
  const [title, setTitle] = useState<string>(initialTitle);
  // Null means "use auto-detection"; once the user picks manually we
  // remember their choice until they pick again.
  const [override, setOverride] = useState<LendCategory | null>(
    initialCategory ?? null,
  );
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);

  const detected = useMemo(() => detectCategory(title), [title]);
  const category: LendCategory = override ?? detected;

  const emit = useCallback(
    (nextTitle: string, nextCategory: LendCategory) => {
      onChange({ title: nextTitle, category: nextCategory });
    },
    [onChange],
  );

  const handleChangeText = useCallback(
    (next: string) => {
      setTitle(next);
      const nextCategory = override ?? detectCategory(next);
      emit(next, nextCategory);
    },
    [override, emit],
  );

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const handlePick = useCallback(
    (next: LendCategory) => {
      setOverride(next);
      setPickerOpen(false);
      emit(title, next);
    },
    [title, emit],
  );

  return (
    <View style={styles.container}>
      <TextInput
        testID="item-input-title"
        value={title}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.mutedForeground}
        autoFocus={autoFocus}
        style={styles.input}
        returnKeyType="done"
      />

      <TouchableOpacity
        testID="item-input-chip"
        accessibilityRole="button"
        accessibilityLabel={`Category: ${categoryLabels[category]}. Tap to change.`}
        onPress={openPicker}
        style={styles.chip}
        activeOpacity={0.7}
      >
        <Text style={styles.chipEmoji}>{categoryEmojis[category]}</Text>
        <Text style={styles.chipLabel}>{categoryLabels[category]}</Text>
        <Text style={styles.chipCaret}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <TouchableOpacity
          testID="item-input-picker-backdrop"
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closePicker}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose category</Text>
            <FlatList
              data={LEND_CATEGORIES as LendCategory[]}
              keyExtractor={(c) => c}
              renderItem={({ item }) => {
                const isSelected = item === category;
                return (
                  <TouchableOpacity
                    testID={`item-input-option-${item}`}
                    onPress={() => handlePick(item)}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionEmoji}>
                      {categoryEmojis[item]}
                    </Text>
                    <Text style={styles.optionLabel}>
                      {categoryLabels[item]}
                    </Text>
                    {isSelected ? (
                      <Text style={styles.optionCheck}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    fontSize: 18,
    color: Colors.foreground,
    backgroundColor: Colors.warmWhite,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 14,
    color: Colors.foreground,
    fontWeight: '500',
  },
  chipCaret: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    maxHeight: '60%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: Colors.warmWhite,
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.foreground,
  },
  optionCheck: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});
