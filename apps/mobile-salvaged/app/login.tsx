import React, { useEffect, useState } from 'react';
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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Apple, Chrome } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { signInWithApple } from '@/lib/auth/apple';
import { signInWithGoogle, configureGoogleSignIn } from '@/lib/auth/google';
import {
  signInWithEmail,
  signUpWithEmail,
  authErrorMessage,
  type AuthErrorKind,
} from '@/lib/auth/email';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isAppleLoading, setIsAppleLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  const { isReady } = useAuth();
  const insets = useSafeAreaInsets();

  // Warm up the native Google Sign-In SDK on mount so the first tap is fast.
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

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

  // Clear inline errors when the user toggles between Sign In / Sign Up
  // so a stale message from the previous mode doesn't linger.
  useEffect(() => {
    setEmailError('');
    setPasswordError('');
  }, [isSignUp]);

  const validate = (): boolean => {
    let ok = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Enter your email.');
      ok = false;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError('That email doesn’t look right.');
      ok = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Enter your password.');
      ok = false;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      ok = false;
    } else {
      setPasswordError('');
    }

    return ok;
  };

  const surfaceError = (kind: AuthErrorKind, message: string) => {
    if (kind === 'rate_limit') {
      Alert.alert('Slow down', message);
      return;
    }
    if (kind === 'invalid_credentials' || kind === 'weak_password') {
      setPasswordError(message);
      return;
    }
    if (kind === 'user_already_exists' || kind === 'email_not_confirmed') {
      setEmailError(message);
      return;
    }
    if (kind === 'network') {
      Alert.alert('Connection issue', message);
      return;
    }
    Alert.alert(isSignUp ? 'Sign Up Failed' : 'Sign In Failed', message);
  };

  const handleEmailAuth = async () => {
    if (isSubmitting) return;
    if (isSignUp && !name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to create an account.');
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const result = await signUpWithEmail(email, password);
        if (result.error) {
          const mapped = authErrorMessage(result.error);
          surfaceError(mapped.kind, mapped.message);
          return;
        }
        // Email confirmation flow: Supabase returned a user but no session.
        // Route the user to a "check your email" screen so they know what
        // happens next instead of dropping them on a silent login screen.
        if (result.needsEmailConfirmation || !result.session) {
          router.replace({
            pathname: '/check-email',
            params: { email: email.trim() },
          });
          return;
        }
        // Session in hand — the AuthProvider's onAuthStateChange will route us.
      } else {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          const mapped = authErrorMessage(result.error);
          surfaceError(mapped.kind, mapped.message);
          return;
        }
        // Session in hand — the AuthProvider's onAuthStateChange will route us.
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert(isSignUp ? 'Sign Up Failed' : 'Sign In Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apple Sign-In (iOS only)
  const handleAppleSignIn = async () => {
    if (isAppleLoading) return;
    setIsAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      console.error('Apple Sign-In error:', error);
      Alert.alert(
        'Sign In Error',
        error?.message || 'Failed to sign in with Apple. Please try again.'
      );
    } finally {
      setIsAppleLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert(
        'Sign In Error',
        error?.message || 'Failed to sign in with Google. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => handleGoogleSignIn() },
        ]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const submitDisabled =
    isSubmitting ||
    !email.trim() ||
    !password ||
    (isSignUp && !name.trim());

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
            <Text style={styles.tagline}>
              Lend freely. Care deeply.{'\n'}Stay connected.
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="What should we call you?"
                  placeholderTextColor={Colors.mutedForeground}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError('');
                }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              {emailError ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {emailError}
                </Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="••••••••"
                placeholderTextColor={Colors.mutedForeground}
                secureTextEntry
                editable={!isSubmitting}
              />
              {passwordError ? (
                <Text style={styles.fieldError} accessibilityRole="alert">
                  {passwordError}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, submitDisabled && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={submitDisabled}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.cream} />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Apple Sign-In Button (iOS only) */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.appleButton, isAppleLoading && styles.buttonDisabled]}
                onPress={handleAppleSignIn}
                disabled={isAppleLoading}
                activeOpacity={0.8}
              >
                {isAppleLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Apple size={20} color={Colors.white} />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color={Colors.earth} />
              ) : (
                <>
                  <Chrome size={20} color={Colors.earth} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.mutedForeground,
    fontSize: 14,
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
    marginBottom: 40,
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
    gap: 12,
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
  inputError: {
    borderColor: Colors.destructive,
  },
  fieldError: {
    color: Colors.destructive,
    fontSize: 13,
    paddingLeft: 4,
    marginTop: 2,
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
    paddingVertical: 8,
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
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingVertical: 18,
  },
  appleButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleButtonText: {
    color: Colors.earth,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 32,
  },
});
