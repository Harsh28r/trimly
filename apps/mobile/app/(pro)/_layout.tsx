import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { Platform } from "react-native";
import { colors } from "../../src/theme";

export default function ProTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellowHot,
        tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
        tabBarStyle: {
          height: Platform.OS === "ios" ? 84 : 72,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          backgroundColor: colors.ink,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: icon("grid") }} />
      <Tabs.Screen name="calendar" options={{ title: "Bookings", tabBarIcon: icon("calendar") }} />
      <Tabs.Screen name="manage" options={{ title: "My store", tabBarIcon: icon("storefront") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person") }} />
    </Tabs>
  );
}

const icon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color} size={size} />;
