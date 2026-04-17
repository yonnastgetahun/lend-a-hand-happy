import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="add-item" />
      <Stack.Screen name="select-contact" />
      <Stack.Screen name="set-reminder" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
