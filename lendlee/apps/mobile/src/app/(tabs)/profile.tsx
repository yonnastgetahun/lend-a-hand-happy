import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/store/auth";
import { Colors } from "@/lib/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || "Guest User"}</Text>
        <Text style={styles.email}>{user?.email || "Sign in to continue"}</Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Terms of Service</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Lendlee v1.0.0</Text>
        <Text style={styles.footerText}>Made with 💚</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.earth,
  },
  profileCard: {
    margin: 20,
    padding: 24,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.earth,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors["earth-light"],
  },
  menuSection: {
    margin: 20,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: Colors.earth,
  },
  menuArrow: {
    fontSize: 20,
    color: Colors["earth-light"],
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: Colors.destructive,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors["earth-light"],
    marginBottom: 4,
  },
});
