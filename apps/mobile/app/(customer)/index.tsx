import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../../src/api";
import { EmptyState, SalonCard, Screen, type SalonSummary } from "../../src/components";
import { useAuth } from "../../src/store";
import { colors, radius } from "../../src/theme";

export default function DiscoverScreen() {
  const user = useAuth((state) => state.user);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>();

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      }
    });
  }, []);

  const salons = useQuery({
    queryKey: ["salons", query, coords],
    queryFn: async () =>
      (
        await api.get<SalonSummary[]>("/salons", {
          params: { q: query || undefined, ...coords, radiusKm: 30 },
        })
      ).data,
  });

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HELLO, {user?.name.split(" ")[0]?.toUpperCase()}</Text>
          <Text style={styles.title}>Find your next look.</Text>
        </View>
        <Pressable style={styles.avatar}><Text style={styles.avatarText}>{user?.name[0]}</Text></Pressable>
      </View>
      <View style={styles.search}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Salon, service or city"
          placeholderTextColor="#929292"
          style={styles.searchInput}
        />
        <Pressable style={styles.filter}><Ionicons name="options" size={18} color={colors.ink} /></Pressable>
      </View>
      <View style={styles.banner}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.bannerTitle}>Skip the wait.</Text>
          <Text style={styles.bannerCopy}>Real availability. Instant booking.</Text>
        </View>
        <Ionicons name="cut" size={32} color={colors.ink} />
      </View>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Near you</Text>
        <Text style={styles.sectionLink}>{coords ? "Within 30 km" : "Top rated"}</Text>
      </View>
      <View style={{ gap: 18 }}>
        {salons.isLoading && <ActivityIndicator color={colors.ink} size="large" style={{ marginTop: 50 }} />}
        {salons.data?.map((salon) => (
          <SalonCard key={salon._id} salon={salon} onPress={() => router.push(`/salon/${salon._id}`)} />
        ))}
        {!salons.isLoading && salons.data?.length === 0 && (
          <EmptyState icon="search" title="No salons found" copy="Try another name or widen your search area." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 18, paddingBottom: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 31, lineHeight: 37, fontWeight: "900", marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  search: {
    height: 56,
    borderRadius: radius.pill,
    paddingLeft: 18,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, paddingHorizontal: 11, color: colors.ink, fontSize: 15 },
  filter: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  banner: {
    marginVertical: 22,
    borderRadius: radius.md,
    backgroundColor: colors.yellowSoft,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  bannerCopy: { color: colors.muted, fontSize: 13 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  sectionLink: { color: colors.muted, fontSize: 12, fontWeight: "700" },
});
