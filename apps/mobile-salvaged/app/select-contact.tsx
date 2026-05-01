import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useLendlee } from '@/providers/LendleeProvider';
import { Contact } from '@/types';
import ContactPicker from '@/components/lend/ContactPicker';

export default function SelectContactScreen() {
  const { itemId, mode } = useLocalSearchParams<{ itemId: string; mode: 'lend' | 'give' }>();
  const { contacts, giveItem } = useLendlee();
  const router = useRouter();

  const isGiveMode = mode === 'give';

  const handleSelect = useCallback(
    async (contact: Contact) => {
      if (isGiveMode) {
        try {
          await giveItem({ itemId, contactId: contact.id });
          router.dismissAll();
        } catch (err) {
          console.log('Failed to give item:', err);
        }
      } else {
        router.push({
          pathname: '/set-reminder',
          params: { itemId, contactId: contact.id, contactName: contact.name },
        });
      }
    },
    [router, itemId, isGiveMode, giveItem]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isGiveMode ? 'Who are you giving to?' : 'Who are you lending to?',
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.earth,
          headerShadowVisible: false,
        }}
      />

      {isGiveMode && (
        <View style={styles.giveBanner}>
          <Text style={styles.giveBannerText}>🎁 Give Mode</Text>
          <Text style={styles.giveBannerSubtext}>
            This item will be marked as permanently given away
          </Text>
        </View>
      )}

      <ContactPicker contacts={contacts} onSelect={handleSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  giveBanner: {
    backgroundColor: Colors.accentLight + '30',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    alignItems: 'center',
  },
  giveBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 4,
  },
  giveBannerSubtext: {
    fontSize: 13,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
});
