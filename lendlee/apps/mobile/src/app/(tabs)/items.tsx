import { Text, View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useItemStore } from "@/store/items";
import { Colors } from "@/lib/theme";
import type { Item } from "@/store/items";

export default function ItemsScreen() {
  const router = useRouter();
  const { items } = useItemStore();

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      {item.photo && (
        <View style={styles.itemPhoto}>
          <Text style={styles.photoPlaceholder}>📷</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        {item.status === "lent" && item.borrowerName && (
          <Text style={styles.borrowerText}>Lent to {item.borrowerName}</Text>
        )}
      </View>
      <View
        style={[
          styles.statusBadge,
          item.status === "lent" && styles.statusLent,
          item.status === "available" && styles.statusAvailable,
          item.status === "returned" && styles.statusReturned,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            item.status === "lent" && styles.statusTextLent,
            item.status === "available" && styles.statusTextAvailable,
            item.status === "returned" && styles.statusTextReturned,
          ]}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Items</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add-item")}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>
            Items you add will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors["warm-white"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.earth,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: Colors.cream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  itemPhoto: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  photoPlaceholder: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.earth,
  },
  itemCategory: {
    fontSize: 12,
    color: Colors["earth-light"],
    marginTop: 2,
  },
  borrowerText: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusLent: {
    backgroundColor: Colors.accent + "30",
  },
  statusAvailable: {
    backgroundColor: Colors.primary + "20",
  },
  statusReturned: {
    backgroundColor: Colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusTextLent: {
    color: Colors.accent,
  },
  statusTextAvailable: {
    color: Colors.primary,
  },
  statusTextReturned: {
    color: Colors["earth-light"],
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
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
