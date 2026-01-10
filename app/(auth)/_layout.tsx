import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
        presentation: "modal",
      }}
    >
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
