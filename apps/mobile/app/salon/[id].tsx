import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, getErrorMessage } from "../../src/api";
import { Button, Screen, type SalonSummary } from "../../src/components";
import { colors, radius, shadow, type } from "../../src/theme";

type Detail = {
  salon: SalonSummary & { description: string };
  services: Array<{ _id: string; name: string; description: string; durationMinutes: number; price: number }>;
  staff: Array<{ _id: string; name: string; title: string; avatar?: string }>;
  reviews: Array<{ _id: string; rating: number; comment: string; user: { name: string } }>;
};

export default function SalonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const detail = useQuery({ queryKey: ["salon", id], queryFn: async () => (await api.get<Detail>(`/salons/${id}`)).data });
  const favorite = useMutation({
    mutationFn: () => api.put(`/favorites/${id}`),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (error) => Alert.alert("Could not save", getErrorMessage(error)),
  });
  const data = detail.data;
  if (!data) {
    return (
      <Screen>
        <Text style={styles.loading}>Loading salon…</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={[]}>
      <View style={styles.heroWrap}>
        <Image
          source={data.salon.images[0] ?? "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000"}
          style={styles.hero}
          contentFit="cover"
          transition={400}
        />
        <LinearGradient colors={["rgba(12,12,12,0.35)", "transparent", "rgba(12,12,12,0.92)"]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFillObject} />
        <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={[styles.heart, { top: insets.top + 8 }]}
          onPress={() => favorite.mutate()}
        >
          <Ionicons name="heart" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.heroMeta}>
          <Text style={styles.heroBrand}>SALON</Text>
          <Text style={styles.heroTitle}>{data.salon.name}</Text>
          <Text style={styles.heroAddress}>
            {data.salon.address}, {data.salon.city}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.facts}>
          <View style={styles.fact}>
            <Ionicons name="star" size={14} color={colors.ink} />
            <Text style={styles.factText}>
              {data.salon.rating.toFixed(1)} · {data.salon.reviewCount} reviews
            </Text>
          </View>
          <View style={[styles.fact, styles.factOpen]}>
            <View style={styles.dot} />
            <Text style={styles.factText}>Open today</Text>
          </View>
        </View>

        <Text style={styles.description}>{data.salon.description}</Text>

        <Text style={styles.section}>Services</Text>
        <View style={{ gap: 10 }}>
          {data.services.map((service) => (
            <Pressable
              key={service._id}
              style={styles.service}
              onPress={() => router.push(`/book/${id}`)}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceMeta}>
                  {service.durationMinutes} min · {service.description}
                </Text>
              </View>
              <Text style={styles.price}>₹{service.price}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Meet the team</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {data.staff.map((staff) => (
            <View key={staff._id} style={styles.staff}>
              <Image source={staff.avatar} style={styles.staffImage} />
              <Text style={styles.staffName}>{staff.name}</Text>
              <Text style={styles.staffTitle}>{staff.title}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.section}>What clients say</Text>
        <View style={{ gap: 10 }}>
          {data.reviews.slice(0, 3).map((review) => (
            <View key={review._id} style={styles.review}>
              <Text style={styles.reviewName}>
                {review.user.name} · {"★".repeat(review.rating)}
              </Text>
              <Text style={styles.description}>{review.comment || "Great experience."}</Text>
            </View>
          ))}
          {!data.reviews.length && (
            <Text style={styles.description}>Be the first to review after your appointment.</Text>
          )}
        </View>

        <View style={styles.cta}>
          <Button title="See available times" variant="dark" onPress={() => router.push(`/book/${id}`)} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingTop: 80, textAlign: "center", color: colors.muted },
  heroWrap: { width: "100%", height: 380, backgroundColor: colors.ink },
  hero: { ...StyleSheet.absoluteFillObject },
  back: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(12,12,12,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.glow,
  },
  heroMeta: { position: "absolute", left: 20, right: 20, bottom: 28, gap: 6 },
  heroBrand: { ...type.brand, color: colors.yellowHot, fontSize: 11 },
  heroTitle: { color: "#fff", fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -0.6 },
  heroAddress: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },
  body: { padding: 20, paddingBottom: 48, marginTop: -18, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.background },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  factOpen: { backgroundColor: colors.yellowSoft, borderColor: colors.yellowSoft },
  factText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  section: { ...type.section, marginTop: 28, marginBottom: 13 },
  service: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    ...shadow.soft,
  },
  serviceName: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  serviceMeta: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  price: { color: colors.ink, fontWeight: "900", fontSize: 16 },
  staff: { width: 100, alignItems: "center" },
  staffImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.line,
    borderWidth: 3,
    borderColor: colors.yellowSoft,
  },
  staffName: { color: colors.ink, fontWeight: "800", marginTop: 8, fontSize: 13 },
  staffTitle: { color: colors.muted, fontSize: 11, textAlign: "center" },
  review: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
    gap: 6,
  },
  reviewName: { color: colors.ink, fontWeight: "800" },
  cta: { marginTop: 32 },
});
