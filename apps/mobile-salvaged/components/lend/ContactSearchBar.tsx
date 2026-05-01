import React, { useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

export type ContactSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Controlled search input for the ContactPicker's contacts list.
 *
 * The input is fully controlled — callers own the `value` and apply any
 * debouncing on the derived filter, not on the raw keystroke stream, so
 * typing never feels laggy.
 */
export default function ContactSearchBar({
  value,
  onChangeText,
  placeholder = 'Search contacts...',
  autoFocus = false,
}: ContactSearchBarProps) {
  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const hasValue = value.length > 0;

  return (
    <View style={styles.container} testID="contact-search-bar">
      <Search size={18} color={Colors.mutedForeground} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.mutedForeground}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        autoFocus={autoFocus}
        testID="contact-search-input"
      />
      {hasValue && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Clear search"
          testID="contact-search-clear"
        >
          <X size={18} color={Colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.foreground,
  },
});
