import { Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useItemStore, type ItemCategory } from "@/store/items";
import { Colors } from "@/lib/theme";

const categories: { value: ItemCategory; label: string; icon: string }[] = [
  { value: "book", label: "Book", icon: "📚" },
  { value: "tool", label: "Tool", icon: "🔧" },
  { value: "game", label: "Game", icon: "🎮" },
  { value: "gear", label: "Gear", icon: "🎒" },
  { value: "other", label: "Other", icon: "📦" },
];

export default function AddItemScreen() {
  const router = useRouter();
  const { addItem } = useItemStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("book");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setLoading(true);
    try {
      addItem({
        title: title.trim(),
        category,
        photo: "https://picsum.photos/400/300",
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/select-contact");
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add an Item</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoButton}>
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={styles.photoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you lending?"
            placeholderTextColor={Colors["muted-foreground"]}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categories}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  category === cat.value && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.value && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Continue</Text>
          )}
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
  form: {
    padding: 20,
    flex: 1,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoButton: {
    height: 120,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
    color: Colors["earth-light"],
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.earth,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.earth,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: "18%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  categoryButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "15",
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: Colors["earth-light"],
  },
  categoryLabelActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
