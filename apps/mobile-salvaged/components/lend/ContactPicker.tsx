import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronRight, UserPlus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Contact } from '@/types';
import { getInitials } from '@/utils/categories';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import ContactSearchBar from './ContactSearchBar';
import ManualContactForm from './ManualContactForm';

export type ContactPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type ContactPickerProps = {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  permissionStatus?: ContactPermissionStatus;
  emptyStateLabel?: string;
  /**
   * Debounce delay (ms) applied before the filter re-runs on a new query.
   * Exposed as a prop so tests can set it to 0 and skip waiting.
   */
  searchDebounceMs?: number;
};

export default function ContactPicker({
  contacts,
  onSelect,
  permissionStatus = 'granted',
  emptyStateLabel,
  searchDebounceMs = 150,
}: ContactPickerProps) {
  const [query, setQuery] = useState<string>('');
  // Local state so the add-contact modal never leaks into global state.
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);

  // Debounce the filter — not the input value — so fast typing never drops
  // frames. Clearing the query is exempt: an empty query shows the full
  // list instantly without waiting out the debounce window.
  const debouncedQuery = useDebouncedValue(query, searchDebounceMs);
  const activeQuery = query === '' ? '' : debouncedQuery;

  const filteredContacts = useMemo(() => {
    const q = activeQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, activeQuery]);

  const hasQuery = query.trim().length > 0;

  const handleManualSubmit = useCallback(
    (contact: Contact) => {
      // Select the new contact AND close the modal. The new contact is not
      // persisted anywhere — it lives only in the current lend flow.
      onSelect(contact);
      setAddModalVisible(false);
    },
    [onSelect]
  );

  const handleManualCancel = useCallback(() => {
    setAddModalVisible(false);
  }, []);

  const openAddModal = useCallback(() => setAddModalVisible(true), []);

  const renderContact = useCallback(
    ({ item }: { item: Contact }) => (
      <TouchableOpacity
        style={styles.contactRow}
        onPress={() => onSelect(item)}
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
    ),
    [onSelect]
  );

  const keyExtractor = useCallback((item: Contact) => item.id, []);

  const showSearch = permissionStatus === 'granted' && contacts.length > 0;

  const addNewContactRow = (
    <TouchableOpacity
      style={styles.addRow}
      onPress={openAddModal}
      activeOpacity={0.7}
      testID="add-new-contact-row"
    >
      <View style={styles.addAvatar}>
        <UserPlus size={20} color={Colors.primary} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.addLabel}>Add new contact</Text>
        <Text style={styles.addSublabel}>Type a name and phone number</Text>
      </View>
      <ChevronRight size={18} color={Colors.primary} />
    </TouchableOpacity>
  );

  // Search bar + add-row share the header slot so both render above the
  // list. The search bar is stickied (index 0 below) while the add-row
  // scrolls with the content.
  const listHeader = (
    <View style={styles.headerContainer}>
      {showSearch && (
        <View style={styles.stickySearchWrapper}>
          <ContactSearchBar value={query} onChangeText={setQuery} />
        </View>
      )}
      {addNewContactRow}
    </View>
  );

  const noMatchesRow = (
    <TouchableOpacity
      style={styles.addRow}
      onPress={openAddModal}
      activeOpacity={0.7}
      testID="contact-picker-no-match"
    >
      <View style={styles.addAvatar}>
        <UserPlus size={20} color={Colors.primary} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.addLabel}>No contacts match</Text>
        <Text style={styles.addSublabel}>Add new contact?</Text>
      </View>
      <ChevronRight size={18} color={Colors.primary} />
    </TouchableOpacity>
  );

  const listEmpty = hasQuery ? (
    noMatchesRow
  ) : (
    <View style={styles.emptyState} testID="contact-picker-empty">
      <Text style={styles.emptyText}>
        {emptyStateLabel ??
          (permissionStatus === 'denied'
            ? 'Contacts access is off. Tap above to add one manually.'
            : permissionStatus === 'undetermined'
            ? 'No contacts loaded yet. Tap above to add one manually.'
            : 'No contacts found')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        keyboardShouldPersistTaps="handled"
        testID="contact-picker-list"
      />

      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={handleManualCancel}
        testID="add-contact-modal"
      >
        <ManualContactForm onSubmit={handleManualSubmit} onCancel={handleManualCancel} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  headerContainer: {
    backgroundColor: Colors.cream,
  },
  stickySearchWrapper: {
    backgroundColor: Colors.cream,
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  addAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  addSublabel: {
    fontSize: 13,
    color: Colors.mutedForeground,
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
    fontWeight: '700',
    color: Colors.earth,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
