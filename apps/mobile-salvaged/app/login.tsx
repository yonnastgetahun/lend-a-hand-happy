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
import { Heart, Apple, Chrome } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  
  const { login, signUp, isLoggingIn, isSigningUp, authError, clearError, isReady } = useAuth();
  const insets = useSafeAreaInsets();

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

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
  }, [isSignUp, clearError]);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    
    if (isSignUp) {
      if (!name.trim()) {
        Alert.alert('Name Required', 'Please enter your name to create an account.');
        return;
      }
      await signUp(email.trim(), password.trim(), name.trim());
    } else {
      await login(email.trim(), password.trim());
    }
  };

  // Apple Sign-In (iOS only)
  const handleAppleSignIn = async () => {
    try {
      // @TODO: Implement Apple Sign-In
      // This requires:
      // 1. Apple Developer account ($99/year)
      // 2. Configure in Supabase Dashboard > Authentication > Providers > Apple
      // 3. Setup in Xcode: Capabilities > Sign in with Apple
      // 4. Use expo-apple-authentication or @invertase/react-native-apple-authentication
      
      Alert.alert(
        'Apple Sign-In',
        'Apple Sign-In requires configuration:\n\n' +
        '1. Apple Developer Account ($99/year)\n' +
        '2. Supabase Dashboard configuration\n' +
        '3. Xcode capabilities setup\n\n' +
        'See SUPABASE_AUTH_SETUP.md for details.'
      );
    } catch (error) {
      console.error('Apple Sign-In error:', error);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      // @TODO: Implement Google Sign-In
      // This requires:
      // 1. Google Cloud Console project
      // 2. Configure OAuth 2.0 credentials
      // 3. Add iOS/Android client IDs to Supabase
      // 4. Use @react-native-google-signin/google-signin
      
      Alert.alert(
        'Google Sign-In',
        'Google Sign-In requires configuration:\n\n' +
        '1. Google Cloud Console project\n' +
        '2. OAuth 2.0 credentials setup\n' +
        '3. Supabase Dashboard configuration\n\n' +
        'See SUPABASE_AUTH_SETUP.md for details.'
      );
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  };

  // Demo mode for testing
  const handleDemoLogin = () => {
    setEmail('demo@lendlee.app');
    setPassword('demo123456');
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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

          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

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
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.mutedForeground}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!email.trim() || !password.trim() || (isSignUp && !name.trim())) && 
                  styles.buttonDisabled,
              ]}
              onPress={handleEmailAuth}
              disabled={!email.trim() || !password.trim() || (isSignUp && !name.trim()) || 
                isLoggingIn || isSigningUp}
              activeOpacity={0.8}
            >
              {isLoggingIn || isSigningUp ? (
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
                style={styles.appleButton}
                onPress={handleAppleSignIn}
                activeOpacity={0.8}
              >
                <Apple size={20} color={Colors.white} />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <Chrome size={20} color={Colors.earth} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
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

            <View style={styles.demoSection}>
              <TouchableOpacity onPress={handleDemoLogin}>
                <Text style={styles.demoText}>Use Demo Account</Text>
              </TouchableOpacity>
            </View>
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
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
  demoSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  demoText: {
    color: Colors.mutedForeground,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 32,
  },
});
