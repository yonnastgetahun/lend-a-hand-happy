import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { useItemStore } from "@/store/items";
import { Colors } from "@/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items } = useItemStore();

  const lentItems = items.filter((item) => item.status === "lent");
  const availableItems = items.filter((item) => item.status === "available");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || "Friend"}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.signOut}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Your Lending Circle</Text>
        <Text style={styles.welcomeText}>
          Track what you share. Remember what matters.
        </Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add-item")}>
        <Text style={styles.addButtonText}>+ Add an Item</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{availableItems.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lentItems.length}</Text>
            <Text style={styles.statLabel}>Lent Out</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No items yet. Add your first item to start lending!
            </Text>
          </View>
        ) : (
          items.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "lent" && styles.statusLent,
                  item.status === "available" && styles.statusAvailable,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === "lent" && styles.statusTextLent,
                    item.status === "available" && styles.statusTextAvailable,
                  ]}
                >
                  {item.status === "lent" ? "Lent" : "Available"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors["warm-white"],
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 14,
    color: Colors["earth-light"],
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.earth,
  },
  signOut: {
    fontSize: 14,
    color: Colors.destructive,
  },
  welcomeCard: {
    margin: 20,
    padding: 24,
    backgroundColor: Colors.primary + "15",
    borderRadius: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.earth,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors["earth-light"],
  },
  addButton: {
    marginHorizontal: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.earth,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cream,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors["earth-light"],
    marginTop: 4,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Colors["earth-light"],
    textAlign: "center",
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.cream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
});
