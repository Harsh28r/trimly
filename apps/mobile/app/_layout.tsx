import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DebugFab } from "../src/DebugFab";
import { registerPushNotifications } from "../src/notifications";
import { useAuth } from "../src/store";
import { colors } from "../src/theme";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const hydrate = useAuth((state) => state.hydrate);
  const hydrated = useAuth((state) => state.hydrated);
  const user = useAuth((state) => state.user);
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  useEffect(() => {
    if (user) void registerPushNotifications();
  }, [user]);

  // Kick to auth when session dies (e.g. memory DB restart / expired refresh)
  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === "auth";
    const inDebug = segments[0] === "debug";
    if (!user && !inAuth && !inDebug) router.replace("/auth");
  }, [hydrated, user, segments]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.ink,
              headerTitleStyle: { fontWeight: "800" },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(customer)" options={{ headerShown: false }} />
            <Stack.Screen name="(pro)" options={{ headerShown: false }} />
            <Stack.Screen name="salon/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="book/[salonId]" options={{ title: "Book", headerBackTitle: "Back" }} />
            <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
            <Stack.Screen name="debug" options={{ title: "Debug" }} />
          </Stack>
          <DebugFab />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
