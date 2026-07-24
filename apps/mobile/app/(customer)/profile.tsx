import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Screen } from "../../src/components";
import { useAuth } from "../../src/store";
import { colors, radius } from "../../src/theme";

export default function ProfileScreen() {
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);
  return (
    <Screen>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.person}>
        <View style={styles.avatar}><Text style={styles.initial}>{user?.name[0]}</Text></View>
        <View><Text style={styles.name}>{user?.name}</Text><Text style={styles.email}>{user?.email}</Text></View>
      </View>
      <View style={styles.menu}>
        {[
          ["person-outline", "Personal details"],
          ["notifications-outline", "Notifications"],
          ["location-outline", "Saved addresses"],
          ["help-circle-outline", "Help & support"],
          ...(__DEV__ ? [["bug-outline", "Debug menu"] as const] : []),
        ].map(([icon, label]) => (
          <Pressable
            key={label}
            style={styles.row}
            onPress={() => {
              if (label === "Notifications") router.push("/notifications");
              if (label === "Debug menu") router.push("/debug");
            }}
          >
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={21} color={colors.ink} />
            <Text style={styles.rowText}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
      <Button title="Sign out" variant="secondary" onPress={async () => { await signOut(); router.replace("/auth"); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 31, color: colors.ink, fontWeight: "900", paddingTop: 18 },
  person: { flexDirection: "row", alignItems: "center", gap: 15, marginVertical: 28 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 26, fontWeight: "900", color: colors.ink },
  name: { fontSize: 20, fontWeight: "900", color: colors.ink },
  email: { fontSize: 13, color: colors.muted, marginTop: 3 },
  menu: { borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginBottom: 24 },
  row: { minHeight: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  rowText: { flex: 1, color: colors.ink, fontWeight: "700" },
});
