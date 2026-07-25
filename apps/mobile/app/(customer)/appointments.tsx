import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { api, getErrorMessage } from "../../src/api";
import { EmptyState, Screen } from "../../src/components";
import { colors, radius, shadow, textDisplay, type } from "../../src/theme";

type Booking = {
  _id: string;
  startAt: string;
  status: string;
  price: number;
  salon: { name: string; address: string };
  staff: { name: string };
  service: { name: string };
};

export default function AppointmentsScreen() {
  const queryClient = useQueryClient();
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: async () => (await api.get<Booking[]>("/bookings")).data });
  const cancel = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/status`, { status: "cancelled" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (error) => Alert.alert("Could not cancel", getErrorMessage(error)),
  });
  const review = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/review`, { rating: 5, comment: "Great service!" }),
    onSuccess: () => Alert.alert("Thanks!", "Your review is now live."),
    onError: (error) => Alert.alert("Could not review", getErrorMessage(error)),
  });

  return (
    <Screen>
      <Text style={styles.brand}>TRIMLY</Text>
      <Text style={styles.title}>Your bookings</Text>
      <Text style={styles.copy}>Upcoming chairs and looks you’ve already loved.</Text>
      <View style={styles.tabs}>
        <Text style={styles.tabActive}>Upcoming</Text>
        <Text style={styles.tab}>Past</Text>
      </View>
      <View style={{ gap: 14 }}>
        {bookings.data?.map((booking) => (
          <View key={booking._id} style={styles.card}>
            <View style={styles.date}>
              <Text style={styles.day}>{format(new Date(booking.startAt), "dd")}</Text>
              <Text style={styles.month}>{format(new Date(booking.startAt), "MMM").toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.service}>{booking.service.name}</Text>
              <Text style={styles.meta}>
                {booking.salon.name} · {booking.staff.name}
              </Text>
              <Text style={styles.meta}>
                {format(new Date(booking.startAt), "EEE, h:mm a")} · ₹{booking.price}
              </Text>
              <View style={styles.status}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            {["pending", "confirmed"].includes(booking.status) && (
              <Pressable onPress={() => cancel.mutate(booking._id)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
            )}
            {booking.status === "completed" && (
              <Pressable onPress={() => review.mutate(booking._id)}>
                <Text style={styles.review}>Review</Text>
              </Pressable>
            )}
          </View>
        ))}
        {!bookings.isLoading && !bookings.data?.length && (
          <EmptyState icon="calendar-outline" title="Nothing booked yet" copy="Pick a salon and claim a time that works for you." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...type.brand, marginTop: 12 },
  title: { ...textDisplay({ fontSize: 34, marginTop: 6 }) },
  copy: { color: colors.muted, lineHeight: 21, marginTop: 6, fontWeight: "500" },
  tabs: { flexDirection: "row", gap: 22, marginVertical: 24, borderBottomWidth: 1, borderColor: colors.line },
  tabActive: {
    color: colors.ink,
    fontWeight: "800",
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderColor: colors.yellow,
  },
  tab: { color: colors.muted, fontWeight: "700", paddingBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    ...shadow.soft,
  },
  date: {
    width: 56,
    height: 68,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { color: colors.yellowHot, fontSize: 22, fontWeight: "900" },
  month: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "800", marginTop: 2 },
  service: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 12, fontWeight: "500" },
  status: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { color: colors.ink, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  cancel: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  review: { color: colors.ink, fontSize: 12, fontWeight: "800" },
});
