import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, getErrorMessage } from "../src/api";
import { Button, Screen } from "../src/components";
import { useAuth } from "../src/store";
import { colors, radius } from "../src/theme";

const DEMO_PASSWORD = "Password123!";
const DEMO_USERS = [
  { label: "Customer", email: "customer@trimly.test", href: "/(customer)" as const },
  { label: "Owner", email: "owner@trimly.test", href: "/(pro)" as const },
];

const JUMPS = [
  { label: "Auth", href: "/auth" },
  { label: "Customer home", href: "/(customer)" },
  { label: "Customer bookings", href: "/(customer)/appointments" },
  { label: "Customer saved", href: "/(customer)/favorites" },
  { label: "Customer profile", href: "/(customer)/profile" },
  { label: "Pro dashboard", href: "/(pro)" },
  { label: "Pro bookings", href: "/(pro)/calendar" },
  { label: "Pro store", href: "/(pro)/manage" },
  { label: "Pro profile", href: "/(pro)/profile" },
  { label: "Notifications", href: "/notifications" },
] as const;

export default function DebugScreen() {
  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const signIn = useAuth((s) => s.signIn);
  const signOut = useAuth((s) => s.signOut);
  const queryClient = useQueryClient();
  const [ping, setPing] = useState<string>("—");
  const [busy, setBusy] = useState(false);
  const [apiOverride, setApiOverride] = useState(api.defaults.baseURL ?? "");

  if (!__DEV__) {
    return (
      <Screen>
        <Text style={styles.title}>Debug</Text>
        <Text style={styles.muted}>Only available in development builds.</Text>
      </Screen>
    );
  }

  const loginAs = async (email: string, href: string) => {
    setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { email, password: DEMO_PASSWORD });
      await signIn(data);
      queryClient.clear();
      router.replace(href as "/(customer)");
    } catch (error) {
      Alert.alert("Login failed", getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const pingApi = async () => {
    setBusy(true);
    const started = Date.now();
    try {
      const base = String(api.defaults.baseURL ?? "").replace(/\/api\/?$/, "");
      const { data } = await api.get(`${base}/health`);
      setPing(`ok · ${Date.now() - started}ms · ${JSON.stringify(data)}`);
    } catch (error) {
      setPing(`fail · ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const applyApiUrl = () => {
    const next = apiOverride.trim().replace(/\/$/, "");
    if (!next) return;
    api.defaults.baseURL = next.endsWith("/api") ? next : `${next}/api`;
    setApiOverride(String(api.defaults.baseURL));
    Alert.alert("API URL set", String(api.defaults.baseURL));
  };

  const rows: [string, string][] = [
    ["Platform", `${Platform.OS} ${Platform.Version}`],
    ["API", String(api.defaults.baseURL)],
    ["Env API", process.env.EXPO_PUBLIC_API_URL ?? "(fallback)"],
    ["App", Constants.expoConfig?.slug ?? "—"],
    ["Version", Constants.expoConfig?.version ?? "—"],
    ["User", user ? `${user.name} · ${user.role}` : "signed out"],
    ["User id", user?._id ?? "—"],
    ["Email", user?.email ?? "—"],
    ["Token", accessToken ? `${accessToken.slice(0, 24)}…` : "—"],
    ["Ping", ping],
  ];

  return (
    <Screen>
      <Text style={styles.title}>Debug menu</Text>
      <Text style={styles.muted}>
        Dev only · seed pw <Text style={styles.mono}>{DEMO_PASSWORD}</Text>
      </Text>

      <View style={styles.card}>
        {rows.map(([label, value], i) => (
          <View key={label} style={[styles.row, i === rows.length - 1 && styles.rowLast]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} selectable>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Quick login</Text>
      <View style={styles.actions}>
        {DEMO_USERS.map((demo) => (
          <Button
            key={demo.email}
            title={`As ${demo.label}`}
            loading={busy}
            onPress={() => void loginAs(demo.email, demo.href)}
          />
        ))}
      </View>

      <Text style={styles.section}>Jump</Text>
      <View style={styles.jumpGrid}>
        {JUMPS.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [styles.jump, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.jumpText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>API base URL</Text>
      <TextInput
        value={apiOverride}
        onChangeText={setApiOverride}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="http://host:4000/api"
        placeholderTextColor="#9A9A9A"
        style={styles.input}
      />
      <View style={styles.actions}>
        <Button title="Apply API URL" variant="secondary" onPress={applyApiUrl} />
        <Button title="Ping /health" variant="secondary" loading={busy} onPress={() => void pingApi()} />
        <Button
          title="Share access token"
          variant="secondary"
          disabled={!accessToken}
          onPress={() => {
            if (accessToken) void Share.share({ message: accessToken });
          }}
        />
        <Button
          title="Haptic test"
          variant="secondary"
          onPress={() => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
        />
        <Button
          title="Clear query cache"
          variant="secondary"
          onPress={() => {
            queryClient.clear();
            Alert.alert("Cleared", "React Query cache wiped");
          }}
        />
        <Button
          title="Sign out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            queryClient.clear();
            router.replace("/auth");
          }}
        />
      </View>

      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Close</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 31, color: colors.ink, fontWeight: "900", paddingTop: 18 },
  muted: { color: colors.muted, marginTop: 6, marginBottom: 20, fontSize: 13 },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), color: colors.ink },
  section: { color: colors.ink, fontWeight: "800", fontSize: 15, marginTop: 22, marginBottom: 10 },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: 4,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  value: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  actions: { gap: 10 },
  jumpGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  jump: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  jumpText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 10,
  },
  back: { alignItems: "center", paddingVertical: 20 },
  backText: { color: colors.ink, fontWeight: "800" },
});
