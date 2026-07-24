import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, getErrorMessage } from "../../src/api";
import { Button, Screen, type SalonSummary } from "../../src/components";
import { colors, radius } from "../../src/theme";

type Detail = {
  salon: SalonSummary & { description: string };
  services: Array<{ _id: string; name: string; description: string; durationMinutes: number; price: number }>;
  staff: Array<{ _id: string; name: string; title: string; avatar?: string }>;
  reviews: Array<{ _id: string; rating: number; comment: string; user: { name: string } }>;
};

export default function SalonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const detail = useQuery({ queryKey: ["salon", id], queryFn: async () => (await api.get<Detail>(`/salons/${id}`)).data });
  const favorite = useMutation({
    mutationFn: () => api.put(`/favorites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
    onError: (error) => Alert.alert("Could not save", getErrorMessage(error)),
  });
  const data = detail.data;
  if (!data) return <Screen><Text style={styles.loading}>Loading salon…</Text></Screen>;

  return (
    <Screen padded={false}>
      <Image
        source={data.salon.images[0] ?? "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000"}
        style={styles.hero}
        contentFit="cover"
      />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{data.salon.name}</Text>
            <Text style={styles.address}>{data.salon.address}, {data.salon.city}</Text>
          </View>
          <Pressable style={styles.heart} onPress={() => favorite.mutate()}>
            <Ionicons name="heart-outline" size={23} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.facts}>
          <Text style={styles.fact}><Ionicons name="star" size={15} /> {data.salon.rating.toFixed(1)} ({data.salon.reviewCount})</Text>
          <Text style={styles.fact}><Ionicons name="time-outline" size={16} /> Open today</Text>
        </View>
        <Text style={styles.description}>{data.salon.description}</Text>
        <Text style={styles.section}>Services</Text>
        <View style={{ gap: 10 }}>
          {data.services.map((service) => (
            <View key={service._id} style={styles.service}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceMeta}>{service.durationMinutes} min · {service.description}</Text>
              </View>
              <Text style={styles.price}>₹{service.price}</Text>
            </View>
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
              <Text style={styles.reviewName}>{review.user.name} · {"★".repeat(review.rating)}</Text>
              <Text style={styles.description}>{review.comment || "Great experience."}</Text>
            </View>
          ))}
          {!data.reviews.length && <Text style={styles.description}>Be the first to review after your appointment.</Text>}
        </View>
        <View style={styles.cta}><Button title="See available times" onPress={() => router.push(`/book/${id}`)} /></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingTop: 80, textAlign: "center", color: colors.muted },
  hero: { width: "100%", height: 330, backgroundColor: colors.line },
  body: { padding: 20 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 34, fontWeight: "900" },
  address: { color: colors.muted, marginTop: 5 },
  heart: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center" },
  facts: { flexDirection: "row", gap: 18, marginVertical: 18 },
  fact: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  section: { color: colors.ink, fontSize: 21, fontWeight: "900", marginTop: 28, marginBottom: 13 },
  service: { flexDirection: "row", gap: 12, padding: 16, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  serviceName: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  serviceMeta: { color: colors.muted, fontSize: 12 },
  price: { color: colors.ink, fontWeight: "900" },
  staff: { width: 92, alignItems: "center" },
  staffImage: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.line },
  staffName: { color: colors.ink, fontWeight: "800", marginTop: 7 },
  staffTitle: { color: colors.muted, fontSize: 11 },
  review: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 15, gap: 6 },
  reviewName: { color: colors.ink, fontWeight: "800" },
  cta: { marginTop: 30 },
});
