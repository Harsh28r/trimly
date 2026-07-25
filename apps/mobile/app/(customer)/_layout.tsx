import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { Platform } from "react-native";
import { colors } from "../../src/theme";

export default function CustomerTabs() {
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
      <Tabs.Screen name="index" options={{ title: "Discover", tabBarIcon: tabIcon("sparkles") }} />
      <Tabs.Screen name="appointments" options={{ title: "Bookings", tabBarIcon: tabIcon("calendar") }} />
      <Tabs.Screen name="favorites" options={{ title: "Saved", tabBarIcon: tabIcon("heart") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: tabIcon("person") }} />
    </Tabs>
  );
}

const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color} size={size} />;
