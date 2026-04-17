import { Text, View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useItemStore } from "@/store/items";
import { Colors } from "@/lib/theme";
import type { Item } from "@/store/items";

export default function LoansScreen() {
  const { items, returnItem } = useItemStore();

  const lentItems = items.filter((item) => item.status === "lent");
  const returnedItems = items.filter((item) => item.status === "returned");

  const renderLentItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.borrowerText}>Lent to {item.borrowerName}</Text>
        {item.dueDate && (
          <Text style={styles.dueText}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => returnItem(item.id)}
      >
        <Text style={styles.returnButtonText}>Mark Returned</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReturnedItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.borrowerText}>Returned by {item.borrowerName}</Text>
        {item.returnedDate && (
          <Text style={styles.dueText}>
            Returned: {new Date(item.returnedDate).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.returnedBadge}>
        <Text style={styles.returnedText}>✓</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Loans</Text>
      </View>

      <FlatList
        data={[...lentItems, ...returnedItems]}
        renderItem={({ item, index }) =>
          item.status === "lent"
            ? renderLentItem({ item })
            : renderReturnedItem({ item })
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          lentItems.length > 0 ? (
            <Text style={styles.sectionHeader}>Active Loans</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.emptyText}>
              Items you've lent or borrowed will appear here.
            </Text>
          </View>
        }
      />
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.earth,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors["earth-light"],
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: Colors.cream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.earth,
  },
  borrowerText: {
    fontSize: 14,
    color: Colors.accent,
    marginTop: 4,
  },
  dueText: {
    fontSize: 12,
    color: Colors["earth-light"],
    marginTop: 4,
  },
  returnButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  returnButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  returnedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  returnedText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    padding: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.earth,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors["earth-light"],
    textAlign: "center",
  },
});
