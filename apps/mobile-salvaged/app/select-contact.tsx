import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Search, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLendlee } from '@/providers/LendleeProvider';
import { Contact } from '@/types';
import { getInitials } from '@/utils/categories';

export default function SelectContactScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const [search, setSearch] = useState<string>('');
  const { contacts } = useLendlee();
  const router = useRouter();

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, search]);

  const handleSelect = useCallback((contact: Contact) => {
    router.push({
      pathname: '/set-reminder',
      params: { itemId, contactId: contact.id },
    });
  }, [router, itemId]);

  const renderItem = useCallback(({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactRow}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
      testID={`contact-${item.id}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
      </View>
      <ChevronRight size={18} color={Colors.mutedForeground} />
    </TouchableOpacity>
  ), [handleSelect]);

  const keyExtractor = useCallback((item: Contact) => item.id, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Who are you lending to?',
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.earth,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.mutedForeground}
          testID="contact-search-input"
        />
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  searchContainer: {
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
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.foreground,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 68,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.earth,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.foreground,
  },
  contactPhone: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.mutedForeground,
  },
});
