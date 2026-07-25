import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { addDays, format } from "date-fns";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, getErrorMessage } from "../../src/api";
import { Button, Screen } from "../../src/components";
import { colors, radius, shadow, type } from "../../src/theme";

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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("You’re booked", "The salon will confirm your appointment shortly.", [
        { text: "View bookings", onPress: () => router.replace("/(customer)/appointments") },
      ]);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
      Alert.alert("Could not book", message, [
        {
          text: "OK",
          onPress: () => {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
              router.replace("/auth");
            }
          },
        },
      ]);
    },
  });

  const step = !serviceId ? 1 : !staffId ? 2 : !startAt ? 3 : 4;

  return (
    <Screen>
      <Text style={styles.kicker}>BOOKING</Text>
      <Text style={styles.title}>Lock in your chair.</Text>
      <View style={styles.steps}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.stepDot, step >= n && styles.stepDotOn]} />
        ))}
      </View>

      <Text style={styles.heading}>1 · Service</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {detail.data?.services.map((item) => {
          const active = serviceId === item._id;
          return (
            <Pressable
              key={item._id}
              onPress={() => {
                void Haptics.selectionAsync();
                setServiceId(item._id);
                setStaffId(undefined);
                setStartAt(undefined);
              }}
              style={[styles.choice, active && styles.choiceActive]}
            >
              <Text style={[styles.choiceTitle, active && styles.choiceTitleActive]}>{item.name}</Text>
              <Text style={[styles.choiceMeta, active && styles.choiceMetaActive]}>
                {item.durationMinutes} min · ₹{item.price}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.heading}>2 · Stylist</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {eligibleStaff.map((item) => {
          const active = staffId === item._id;
          return (
            <Pressable
              key={item._id}
              onPress={() => {
                void Haptics.selectionAsync();
                setStaffId(item._id);
                setStartAt(undefined);
              }}
              style={[styles.smallChoice, active && styles.choiceActive]}
            >
              <Text style={[styles.choiceTitle, active && styles.choiceTitleActive]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.heading}>3 · Day & time</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {dates.map((item) => {
          const active = format(item, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
          return (
            <Pressable
              key={item.toISOString()}
              onPress={() => {
                setDate(item);
                setStartAt(undefined);
              }}
              style={[styles.date, active && styles.dateActive]}
            >
              <Text style={[styles.weekday, active && styles.weekdayActive]}>{format(item, "EEE")}</Text>
              <Text style={[styles.day, active && styles.dayActive]}>{format(item, "d")}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!staffId || !serviceId ? (
        <Text style={styles.hint}>Choose a service and stylist to see times.</Text>
      ) : (
        <View style={styles.slots}>
          {availability.data?.map((slot) => {
            const active = startAt === slot.startAt;
            return (
              <Pressable
                key={slot.startAt}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setStartAt(slot.startAt);
                }}
                style={[styles.slot, active && styles.slotActive]}
              >
                <Text style={[styles.slotText, active && styles.slotTextActive]}>
                  {format(new Date(slot.startAt), "h:mm a")}
                </Text>
              </Pressable>
            );
          })}
          {!availability.isLoading && !availability.data?.length && (
            <Text style={styles.hint}>No slots left for this day.</Text>
          )}
        </View>
      )}

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>PAY AT SALON</Text>
          <Text style={styles.summaryPrice}>{service ? `₹${service.price}` : "—"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Confirm booking"
            variant="dark"
            disabled={!startAt}
            loading={book.isPending}
            onPress={() => book.mutate()}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { ...type.brand, marginTop: 8 },
  title: { fontSize: 28, fontWeight: "900", color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  steps: { flexDirection: "row", gap: 6, marginTop: 14, marginBottom: 4 },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  stepDotOn: { backgroundColor: colors.yellow },
  heading: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 26, marginBottom: 12, letterSpacing: 0.2 },
  horizontal: { gap: 10, paddingRight: 8 },
  choice: {
    width: 196,
    minHeight: 86,
    justifyContent: "center",
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.soft,
  },
  choiceActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  choiceTitle: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  choiceTitleActive: { color: colors.yellowHot },
  choiceMeta: { color: colors.muted, fontSize: 12, marginTop: 6, fontWeight: "600" },
  choiceMetaActive: { color: "rgba(255,255,255,0.65)" },
  smallChoice: {
    paddingHorizontal: 18,
    minHeight: 48,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  date: {
    width: 62,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  dateActive: { backgroundColor: colors.yellow, borderColor: colors.yellow, ...shadow.glow },
  weekday: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  weekdayActive: { color: colors.ink },
  day: { color: colors.ink, fontSize: 22, fontWeight: "900", marginTop: 2 },
  dayActive: { color: colors.ink },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  slot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  slotActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  slotText: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  slotTextActive: { color: colors.yellowHot },
  hint: { color: colors.muted, paddingVertical: 14, fontWeight: "500" },
  summary: {
    marginTop: 36,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...shadow.card,
  },
  summaryLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  summaryPrice: { color: colors.ink, fontSize: 24, fontWeight: "900", marginTop: 4 },
});
