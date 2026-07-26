import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Screen } from "../../src/components";
import { useAuth } from "../../src/store";
import { colors, radius, shadow, textDisplay, type } from "../../src/theme";

export default function ProfileScreen() {
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);
  return (
    <Screen>
      <Text style={styles.brand}>TRIMLY</Text>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.person}>
        <LinearGradient colors={[colors.ink, colors.inkSoft]} style={StyleSheet.absoluteFill} />
        <View style={styles.avatar}>
          <LinearGradient colors={[colors.yellowHot, colors.yellowDeep]} style={StyleSheet.absoluteFill} />
          <Text style={styles.initial}>{user?.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.role ?? "customer"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {[
          ["person-outline", "Personal details"],
          ["notifications-outline", "Notifications"],
          ["location-outline", "Saved addresses"],
          ["help-circle-outline", "Help & support"],
          ...(__DEV__ ? [["bug-outline", "Debug menu"] as const] : []),
        ].map(([icon, label], index, arr) => (
          <Pressable
            key={label}
            style={[styles.row, index === arr.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => {
              if (label === "Notifications") router.push("/notifications");
              if (label === "Debug menu") router.push("/debug");
            }}
          >
            <View style={styles.rowIcon}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.ink} />
            </View>
            <Text style={styles.rowText}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedSoft} />
          </Pressable>
        ))}
      </View>
      <Button
        title="Sign out"
        variant="secondary"
        onPress={async () => {
          await signOut();
          router.replace("/auth");
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...type.brand, marginTop: 12 },
  title: { ...textDisplay({ fontSize: 34, marginTop: 6 }) },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 28,
    padding: 20,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 28, fontWeight: "900", color: colors.ink },
  name: { fontSize: 20, fontWeight: "900", color: "#fff" },
  email: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,184,0,0.25)",
  },
  badgeText: { color: colors.yellowHot, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  menu: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    marginBottom: 24,
    overflow: "hidden",
    ...shadow.soft,
  },
  row: {
    minHeight: 60,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 15 },
});
