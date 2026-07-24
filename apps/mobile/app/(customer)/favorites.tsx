import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api";
import { EmptyState, SalonCard, Screen, type SalonSummary } from "../../src/components";
import { colors } from "../../src/theme";

export default function FavoritesScreen() {
  const favorites = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => (await api.get<Array<{ _id: string; salon: SalonSummary }>>("/favorites")).data,
  });
  return (
    <Screen>
      <Text style={styles.title}>Saved places</Text>
      <Text style={styles.copy}>Your shortlist for the next refresh.</Text>
      <View style={{ gap: 18, marginTop: 24 }}>
        {favorites.data?.map(({ _id, salon }) => (
          <SalonCard key={_id} salon={salon} onPress={() => router.push(`/salon/${salon._id}`)} />
        ))}
        {!favorites.isLoading && !favorites.data?.length && (
          <EmptyState icon="heart-outline" title="No favorites yet" copy="Tap the heart on a salon to keep it close." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 31, lineHeight: 38, color: colors.ink, fontWeight: "900", paddingTop: 18 },
  copy: { color: colors.muted, lineHeight: 21, marginTop: 5 },
});
