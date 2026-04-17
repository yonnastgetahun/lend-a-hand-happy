import { Text, View, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useItemStore } from "@/store/items";
import { Colors } from "@/lib/theme";
import type { Contact } from "@/store/items";

const mockContacts: Contact[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@example.com" },
  { id: "2", name: "Marcus Johnson", email: "marcus@example.com" },
  { id: "3", name: "Emma Davis", email: "emma@example.com" },
  { id: "4", name: "Alex Rivera", email: "alex@example.com" },
  { id: "5", name: "Jordan Kim", email: "jordan@example.com" },
  { id: "6", name: "Taylor Smith", email: "taylor@example.com" },
];

export default function SelectContactScreen() {
  const router = useRouter();
  const { items } = useItemStore();
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const lastItem = items[items.length - 1];

  const filteredContacts = mockContacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedContact && lastItem) {
      router.push({
        pathname: "/set-reminder",
        params: { itemId: lastItem.id, contactId: selectedContact.id, contactName: selectedContact.name },
      });
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[
        styles.contactCard,
        selectedContact?.id === item.id && styles.contactCardSelected,
      ]}
      onPress={() => setSelectedContact(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
      </View>
      {selectedContact?.id === item.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Contact</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={Colors["muted-foreground"]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedContact && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedContact}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors["warm-white"],
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.earth,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.earth,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  contactCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + "30",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.earth,
  },
  contactEmail: {
    fontSize: 14,
    color: Colors["earth-light"],
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
