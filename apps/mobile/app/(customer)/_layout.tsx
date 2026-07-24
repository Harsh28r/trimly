import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { colors } from "../../src/theme";

export default function CustomerTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: "#929292",
        tabBarStyle: { height: 72, paddingTop: 8, backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", paddingBottom: 8 },
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
