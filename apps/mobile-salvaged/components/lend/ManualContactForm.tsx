import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';
import { Contact } from '@/lib/types/contact';
import { generateUuid } from '@/lib/uuid';

export type ManualContactFormProps = {
  onSubmit: (contact: Contact) => void;
  onCancel: () => void;
  /**
   * Override the UUID generator. Tests inject a deterministic generator;
   * production uses the default (expo-crypto / crypto.randomUUID).
   */
  generateId?: () => string;
};

// Loose E.164-ish check: accepts an optional leading +, then 10+ chars made
// of digits/spaces/dashes/parens. Strict E.164 would require the country
// code, but at v1 we accept any 10+ digit phone the user can type comfortably.
const PHONE_REGEX = /^\+?[\d\s\-()]{10,}$/;

function countDigits(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    if (ch >= 48 && ch <= 57) n++;
  }
  return n;
}

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!PHONE_REGEX.test(trimmed)) return false;
  // Regex permits 10+ chars but not all of them have to be digits — require
  // at least 10 actual digits so "(((((((((-" doesn't pass.
  return countDigits(trimmed) >= 10;
}

export function isValidName(name: string): boolean {
  return name.trim().length > 0;
}

/**
 * buildManualContact constructs a Contact object from raw form fields.
 * Returns null when fields are invalid so the caller can decide how to
 * surface errors. Exported for unit testing without a renderer.
 */
export function buildManualContact(
  name: string,
  phone: string,
  generateId: () => string = generateUuid
): Contact | null {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  if (!isValidName(trimmedName)) return null;
  if (!isValidPhone(trimmedPhone)) return null;
  return {
    id: generateId(),
    name: trimmedName,
    phone: trimmedPhone,
    source: 'manual',
  };
}

export default function ManualContactForm({
  onSubmit,
  onCancel,
  generateId,
}: ManualContactFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // Errors only show after the user has interacted with a field — we don't
  // want to yell about empty inputs the moment the form opens.
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const nameValid = useMemo(() => isValidName(name), [name]);
  const phoneValid = useMemo(() => isValidPhone(phone), [phone]);
  const canSubmit = nameValid && phoneValid;

  const nameError = nameTouched && !nameValid ? 'Name is required' : null;
  const phoneError =
    phoneTouched && !phoneValid
      ? phone.trim().length === 0
        ? 'Phone number is required'
        : 'Enter a valid phone number (10+ digits)'
      : null;

  const handleSubmit = useCallback(() => {
    const contact = buildManualContact(name, phone, generateId);
    if (!contact) {
      // Surface errors if user somehow taps a disabled-looking button.
      setNameTouched(true);
      setPhoneTouched(true);
      return;
    }
    onSubmit(contact);
  }, [name, phone, generateId, onSubmit]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Add new contact</Text>
        <Text style={styles.subtitle}>Just for this lend — not saved to your phone</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            value={name}
            onChangeText={setName}
            onBlur={() => setNameTouched(true)}
            placeholder="First & last name"
            placeholderTextColor={Colors.mutedForeground}
            autoCapitalize="words"
            autoFocus
            testID="manual-contact-name-input"
          />
          {nameError && (
            <Text style={styles.errorText} testID="manual-contact-name-error">
              {nameError}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, phoneError && styles.inputError]}
            value={phone}
            onChangeText={setPhone}
            onBlur={() => setPhoneTouched(true)}
            placeholder="(555) 123-4567"
            placeholderTextColor={Colors.mutedForeground}
            keyboardType="phone-pad"
            testID="manual-contact-phone-input"
          />
          {phoneError && (
            <Text style={styles.errorText} testID="manual-contact-phone-error">
              {phoneError}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          testID="manual-contact-cancel"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          testID="manual-contact-submit"
        >
          <Text style={styles.submitButtonText}>Use this contact</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    padding: 24,
    paddingTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.foreground,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  body: {
    padding: 24,
    gap: 20,
    flex: 1,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.foreground,
  },
  inputError: {
    borderColor: Colors.destructive,
  },
  errorText: {
    fontSize: 13,
    color: Colors.destructive,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.cardMuted,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
