import { Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { Colors } from "@/lib/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleRegister = async () => {
    setValidationError("");
    
    if (!name.trim()) {
      setValidationError("Name is required");
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    try {
      await register(email, password, name);
      router.replace("/(tabs)");
    } catch {
      // Error handled by store
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Join Lendlee</Text>
        <Text style={styles.subtitle}>Start sharing with your community.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={Colors["muted-foreground"]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError();
              setValidationError("");
            }}
          />
        </View>

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
              setValidationError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor={Colors["muted-foreground"]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
              setValidationError("");
            }}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor={Colors["muted-foreground"]}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setValidationError("");
            }}
            secureTextEntry
          />
        </View>

        {(error || validationError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || validationError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors["warm-white"],
    padding: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
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
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 24,
    alignItems: "center",
  },
  loginLinkText: {
    color: Colors["earth-light"],
    fontSize: 14,
  },
  loginLinkBold: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
