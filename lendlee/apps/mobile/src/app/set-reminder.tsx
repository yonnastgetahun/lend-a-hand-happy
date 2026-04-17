import { Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useItemStore } from "@/store/items";
import { Colors } from "@/lib/theme";

const quickDates = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

export default function SetReminderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { items, lendItem } = useItemStore();
  const [selectedDays, setSelectedDays] = useState<number | null>(14);
  const [loading, setLoading] = useState(false);

  const item = items.find((i) => i.id === params.itemId);
  const contactName = params.contactName as string;

  const handleComplete = async () => {
    if (!item) return;

    setLoading(true);
    try {
      const dueDate = selectedDays
        ? new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000)
        : undefined;

      lendItem(
        item.id,
        { id: params.contactId as string, name: contactName },
        dueDate
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to lend item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!item) return;

    setLoading(true);
    try {
      lendItem(
        item.id,
        { id: params.contactId as string, name: contactName },
        undefined
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to lend item:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Set Reminder</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Lending to</Text>
          <Text style={styles.summaryValue}>{contactName}</Text>
          <Text style={styles.summaryLabel}>Item</Text>
          <Text style={styles.summaryValue}>{item.title}</Text>
        </View>

        <View style={styles.reminderSection}>
          <Text style={styles.reminderTitle}>When would you like a reminder?</Text>

          <View style={styles.quickDates}>
            {quickDates.map((qd) => (
              <TouchableOpacity
                key={qd.days}
                style={[
                  styles.quickDateButton,
                  selectedDays === qd.days && styles.quickDateButtonActive,
                ]}
                onPress={() => setSelectedDays(qd.days)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    selectedDays === qd.days && styles.quickDateTextActive,
                  ]}
                >
                  {qd.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.lendButton, loading && styles.lendButtonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.lendButtonText}>Lend Item</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipButtonText}>Skip reminder</Text>
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
  content: {
    padding: 20,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: Colors.cream,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors["earth-light"],
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.earth,
    marginBottom: 12,
  },
  reminderSection: {
    marginTop: 16,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.earth,
    marginBottom: 16,
  },
  quickDates: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickDateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  quickDateButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "15",
  },
  quickDateText: {
    fontSize: 14,
    color: Colors.earth,
  },
  quickDateTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  lendButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  lendButtonDisabled: {
    opacity: 0.7,
  },
  lendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: Colors["earth-light"],
    fontSize: 14,
  },
  errorText: {
    padding: 20,
    color: Colors.destructive,
    textAlign: "center",
    marginTop: 100,
  },
});
