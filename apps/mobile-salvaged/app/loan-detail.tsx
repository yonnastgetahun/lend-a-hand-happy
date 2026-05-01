/**
 * Placeholder loan detail screen (LENDLEE-019).
 *
 * Tapping a card on the home "Lent" section routes here. The full
 * detail/management UI is wired up in a later task; for now this
 * screen just acknowledges the loan id so the navigation can be
 * exercised end-to-end.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Loan' }} />
      <Text style={styles.title}>Loan detail</Text>
      <Text style={styles.subtitle}>id: {id ?? 'unknown'}</Text>
      <Text style={styles.body}>
        Detail view coming soon. You can still mark this loan as returned
        from the History tab.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    padding: 24,
    gap: 12,
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
});
