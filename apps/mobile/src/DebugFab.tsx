import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Platform, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "./theme";

/** Floating entry to /debug — __DEV__ only. */
export function DebugFab() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!__DEV__ || pathname === "/debug") return null;

  return (
    <Pressable
      accessibilityLabel="Open debug menu"
      onPress={() => router.push("/debug")}
      style={({ pressed }) => [
        styles.fab,
        { bottom: Math.max(insets.bottom, 12) + 72 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
    >
      <Ionicons name="bug" size={22} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    zIndex: 9999,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.ink,
    ...Platform.select({
      web: { boxShadow: "0 3px 6px rgba(0,0,0,0.2)" },
      default: {
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
});
