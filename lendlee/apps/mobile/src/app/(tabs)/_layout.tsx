import { Tabs } from "expo-router";
import { Colors } from "@/lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors["muted-foreground"],
        tabBarStyle: {
          backgroundColor: Colors.cream,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "🏠",
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: "My Items",
          tabBarLabel: "📦",
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: "Loans",
          tabBarLabel: "🔄",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "👤",
        }}
      />
    </Tabs>
  );
}
