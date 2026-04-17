import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const { login, isLoggingIn } = useAuth();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogin = () => {
    if (!name.trim() || !email.trim()) return;
    login({ email: email.trim(), name: name.trim() });
  };

  const handleDemoLogin = () => {
    login({ email: 'demo@lendlee.app', name: 'Alex' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Heart size={32} color={Colors.cream} fill={Colors.cream} />
            </View>
            <Text style={styles.title}>Lendlee</Text>
            <Text style={styles.tagline}>Lend freely. Care deeply.{'\n'}Stay connected.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="What should we call you?"
                placeholderTextColor={Colors.mutedForeground}
                autoCapitalize="words"
                testID="login-name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="login-email-input"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!name.trim() || !email.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!name.trim() || !email.trim() || isLoggingIn}
              activeOpacity={0.8}
              testID="login-button"
            >
              {isLoggingIn ? (
                <ActivityIndicator color={Colors.cream} />
              ) : (
                <Text style={styles.buttonText}>Get Started</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              activeOpacity={0.8}
              testID="demo-login-button"
            >
              <Text style={styles.demoButtonText}>Try Demo Mode</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Your items, your community, your peace of mind.
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.earth,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.earthLight,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.cream,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  demoButton: {
    backgroundColor: Colors.warmWhite,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoButtonText: {
    color: Colors.earth,
    fontSize: 17,
    fontWeight: '500' as const,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 40,
  },
});
