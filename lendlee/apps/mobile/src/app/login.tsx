import { Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { Colors } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsGuest, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch {
      // Error handled by store
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>L</Text>
        </View>
        <Text style={styles.title}>Welcome to Lendlee</Text>
        <Text style={styles.subtitle}>Lend freely. Care deeply. Stay connected.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors["muted-foreground"]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors["muted-foreground"]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            secureTextEntry
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={() => router.push("/register")}>
          <Text style={styles.registerLinkText}>
            Don't have an account? <Text style={styles.registerLinkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors["warm-white"],
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.earth,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors["earth-light"],
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
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
  errorContainer: {
    backgroundColor: Colors.destructive + "15",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: Colors["earth-light"],
    fontSize: 14,
  },
  guestButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  guestButtonText: {
    color: Colors.earth,
    fontSize: 16,
    fontWeight: "500",
  },
  registerLink: {
    marginTop: 24,
    alignItems: "center",
  },
  registerLinkText: {
    color: Colors["earth-light"],
    fontSize: 14,
  },
  registerLinkBold: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
