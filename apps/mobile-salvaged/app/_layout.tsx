import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { LendleeProvider } from '@/providers/LendleeProvider';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoggedIn, isReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    const inAuthScreen = segments[0] === 'login' || segments[0] === 'check-email';

    if (!isLoggedIn && !inAuthScreen) {
      router.replace('/login');
    } else if (isLoggedIn && inAuthScreen) {
      router.replace('/');
    }
  }, [isLoggedIn, isReady, segments, router]);

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <>
    <StatusBar style="dark" backgroundColor={Colors.cream} />
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.earth,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="check-email" options={{ headerShown: false }} />
      <Stack.Screen name="add-item" options={{ title: 'Add Item', presentation: 'modal' }} />
      <Stack.Screen name="select-contact" options={{ title: 'Select Contact' }} />
      <Stack.Screen name="set-reminder" options={{ title: 'Set Reminder' }} />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <AuthProvider>
            <LendleeProvider>
              <RootLayoutNav />
            </LendleeProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
