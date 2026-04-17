import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.earth,
        headerTitleStyle: { fontWeight: '600' as const },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'My Items' }}
      />
      <Stack.Screen
        name="item-detail"
        options={{ title: 'Item Details' }}
      />
    </Stack>
  );
}
