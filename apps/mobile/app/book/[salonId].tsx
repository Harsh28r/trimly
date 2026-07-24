import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, getErrorMessage } from "../../src/api";
import { Button, Screen } from "../../src/components";
import { colors, radius } from "../../src/theme";

type SalonDetail = {
  services: Array<{ _id: string; name: string; durationMinutes: number; price: number }>;
  staff: Array<{ _id: string; name: string; services: string[] }>;
};

export default function BookingScreen() {
  const { salonId } = useLocalSearchParams<{ salonId: string }>();
  const queryClient = useQueryClient();
  const dates = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(new Date(), index)), []);
  const [date, setDate] = useState(dates[0]!);
  const [serviceId, setServiceId] = useState<string>();
  const [staffId, setStaffId] = useState<string>();
  const [startAt, setStartAt] = useState<string>();

  const detail = useQuery({
    queryKey: ["salon", salonId],
    queryFn: async () => (await api.get<SalonDetail>(`/salons/${salonId}`)).data,
  });
  const service = detail.data?.services.find((value) => value._id === serviceId);
  const eligibleStaff = detail.data?.staff.filter((value) => !serviceId || value.services.includes(serviceId)) ?? [];
  const availability = useQuery({
    queryKey: ["availability", staffId, serviceId, format(date, "yyyy-MM-dd")],
    enabled: !!staffId && !!serviceId,
    queryFn: async () =>
      (
        await api.get<Array<{ startAt: string; endAt: string }>>("/availability", {
          params: { staffId, serviceId, date: format(date, "yyyy-MM-dd") },
        })
      ).data,
  });
  const book = useMutation({
    mutationFn: () => api.post("/bookings", { salonId, staffId, serviceId, startAt }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      Alert.alert("You’re booked", "The salon will confirm your appointment shortly.", [
        { text: "View bookings", onPress: () => router.replace("/(customer)/appointments") },
      ]);
    },
    onError: (error) => Alert.alert("Could not book", getErrorMessage(error)),
  });

  return (
    <Screen>
      <Text style={styles.heading}>Pick a service</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {detail.data?.services.map((item) => (
          <Pressable
            key={item._id}
            onPress={() => { setServiceId(item._id); setStaffId(undefined); setStartAt(undefined); }}
            style={[styles.choice, serviceId === item._id && styles.choiceActive]}
          >
            <Text style={styles.choiceTitle}>{item.name}</Text>
            <Text style={styles.choiceMeta}>{item.durationMinutes} min · ₹{item.price}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.heading}>Choose a stylist</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {eligibleStaff.map((item) => (
          <Pressable
            key={item._id}
            onPress={() => { setStaffId(item._id); setStartAt(undefined); }}
            style={[styles.smallChoice, staffId === item._id && styles.choiceActive]}
          >
            <Text style={styles.choiceTitle}>{item.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.heading}>Select a day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {dates.map((item) => {
          const active = format(item, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
          return (
            <Pressable key={item.toISOString()} onPress={() => { setDate(item); setStartAt(undefined); }} style={[styles.date, active && styles.dateActive]}>
              <Text style={styles.weekday}>{format(item, "EEE")}</Text>
              <Text style={styles.day}>{format(item, "d")}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.heading}>Available times</Text>
      {!staffId || !serviceId ? (
        <Text style={styles.hint}>Choose a service and stylist first.</Text>
      ) : (
        <View style={styles.slots}>
          {availability.data?.map((slot) => (
            <Pressable key={slot.startAt} onPress={() => setStartAt(slot.startAt)} style={[styles.slot, startAt === slot.startAt && styles.slotActive]}>
              <Text style={styles.slotText}>{format(new Date(slot.startAt), "h:mm a")}</Text>
            </Pressable>
          ))}
          {!availability.isLoading && !availability.data?.length && <Text style={styles.hint}>No slots left for this day.</Text>}
        </View>
      )}
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>PAY AT SALON</Text>
          <Text style={styles.summaryPrice}>{service ? `₹${service.price}` : "Select service"}</Text>
        </View>
        <View style={{ flex: 1 }}><Button title="Confirm booking" disabled={!startAt} loading={book.isPending} onPress={() => book.mutate()} /></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  horizontal: { gap: 10 },
  choice: { width: 190, minHeight: 78, justifyContent: "center", padding: 15, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  choiceActive: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  choiceTitle: { color: colors.ink, fontWeight: "800" },
  choiceMeta: { color: colors.muted, fontSize: 12, marginTop: 5 },
  smallChoice: { paddingHorizontal: 18, minHeight: 50, justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  date: { width: 60, height: 72, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  dateActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  weekday: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  day: { color: colors.ink, fontSize: 21, fontWeight: "900", marginTop: 2 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slot: { paddingHorizontal: 17, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  slotActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  slotText: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  hint: { color: colors.muted, paddingVertical: 12 },
  summary: { marginTop: 34, paddingTop: 18, borderTopWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", gap: 18 },
  summaryLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  summaryPrice: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 3 },
});
