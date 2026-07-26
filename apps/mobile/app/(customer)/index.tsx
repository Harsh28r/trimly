import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../../src/api";
import { Chip, EmptyState, SalonCard, Screen, type SalonSummary } from "../../src/components";
import { useAuth } from "../../src/store";
import { colors, radius, shadow, textDisplay, type } from "../../src/theme";

export default function DiscoverScreen() {
  const user = useAuth((state) => state.user);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>();
  const [nearbyOnly, setNearbyOnly] = useState(true);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      } else {
        setNearbyOnly(false);
      }
    });
  }, []);

  const salons = useQuery({
    queryKey: ["salons", query, coords, nearbyOnly],
    queryFn: async () => {
      const useGeo = nearbyOnly && !!coords;
      const { data } = await api.get<SalonSummary[]>("/salons", {
        params: {
          q: query || undefined,
          ...(useGeo ? { ...coords, radiusKm: 40 } : {}),
        },
      });
      if (useGeo && data.length === 0) {
        const all = await api.get<SalonSummary[]>("/salons", { params: { q: query || undefined } });
        return all.data;
      }
      return data;
    },
  });

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>TRIMLY</Text>
          <Text style={styles.greeting}>Hey {user?.name.split(" ")[0]}</Text>
          <Text style={styles.title}>Find your next look.</Text>
        </View>
        <Pressable style={styles.avatar} onPress={() => router.push("/(customer)/profile")}>
          <LinearGradient colors={[colors.yellowHot, colors.yellowDeep]} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.avatarText}>{user?.name[0]}</Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Salon, service or city"
          placeholderTextColor={colors.mutedSoft}
          style={styles.searchInput}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.chips}>
        <Chip
          label={nearbyOnly && coords ? "Near you · 40 km" : "All salons"}
          active={nearbyOnly && !!coords}
          onPress={() => {
            void Haptics.selectionAsync();
            setNearbyOnly((value) => !value);
          }}
        />
        <Chip label={`${salons.data?.length ?? "…"} spots`} />
      </View>

      <Pressable style={styles.promo} onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
        <LinearGradient colors={[colors.ink, colors.yellowDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <View style={styles.promoGlow} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.promoEyebrow}>INSTANT BOOKING</Text>
          <Text style={styles.promoTitle}>Skip the wait.</Text>
          <Text style={styles.promoCopy}>Real chairs. Live slots. Confirmed in seconds.</Text>
        </View>
        <View style={styles.promoIcon}>
          <Ionicons name="cut" size={22} color={colors.ink} />
        </View>
      </Pressable>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{nearbyOnly && coords ? "Near you" : "Browse"}</Text>
      </View>

      <View style={{ gap: 20 }}>
        {salons.isLoading && <ActivityIndicator color={colors.ink} size="large" style={{ marginTop: 50 }} />}
        {salons.data?.map((salon) => (
          <SalonCard
            key={salon._id}
            salon={salon}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/salon/${salon._id}`);
            }}
          />
        ))}
        {!salons.isLoading && salons.data?.length === 0 && (
          <EmptyState icon="search" title="No salons found" copy="Try another name or widen your search area." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  brand: { ...type.brand, marginBottom: 10 },
  greeting: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  title: { ...textDisplay({ fontSize: 34, lineHeight: 38, marginTop: 2 }) },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...shadow.glow,
  },
  avatarText: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  search: {
    height: 58,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
    ...shadow.soft,
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  promo: {
    marginTop: 20,
    marginBottom: 8,
    borderRadius: radius.lg,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
    minHeight: 120,
    ...shadow.card,
  },
  promoGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.yellow,
    opacity: 0.2,
    right: -20,
    top: -30,
  },
  promoEyebrow: { color: colors.yellowHot, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  promoTitle: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  promoCopy: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18, maxWidth: 220 },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: { marginTop: 18, marginBottom: 14 },
  sectionTitle: { ...type.section },
});
