import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { api, getErrorMessage } from "../../src/api";
import { EmptyState, Screen } from "../../src/components";
import { colors, radius } from "../../src/theme";

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
      <Text style={styles.title}>Your bookings</Text>
      <Text style={styles.copy}>Everything coming up and every look you’ve loved.</Text>
      <View style={styles.tabs}><Text style={styles.tabActive}>Upcoming</Text><Text style={styles.tab}>Past</Text></View>
      <View style={{ gap: 14 }}>
        {bookings.data?.map((booking) => (
          <View key={booking._id} style={styles.card}>
            <View style={styles.date}>
              <Text style={styles.day}>{format(new Date(booking.startAt), "dd")}</Text>
              <Text style={styles.month}>{format(new Date(booking.startAt), "MMM").toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.service}>{booking.service.name}</Text>
              <Text style={styles.meta}>{booking.salon.name} · {booking.staff.name}</Text>
              <Text style={styles.meta}>{format(new Date(booking.startAt), "EEE, h:mm a")} · ₹{booking.price}</Text>
              <View style={styles.status}><Text style={styles.statusText}>{booking.status}</Text></View>
            </View>
            {["pending", "confirmed"].includes(booking.status) && (
              <Pressable onPress={() => cancel.mutate(booking._id)}><Text style={styles.cancel}>Cancel</Text></Pressable>
            )}
            {booking.status === "completed" && (
              <Pressable onPress={() => review.mutate(booking._id)}><Text style={styles.review}>Review</Text></Pressable>
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
  title: { fontSize: 31, lineHeight: 38, color: colors.ink, fontWeight: "900", paddingTop: 18 },
  copy: { color: colors.muted, lineHeight: 21, marginTop: 5 },
  tabs: { flexDirection: "row", gap: 22, marginVertical: 24, borderBottomWidth: 1, borderColor: colors.line },
  tabActive: { color: colors.ink, fontWeight: "800", paddingBottom: 12, borderBottomWidth: 3, borderColor: colors.yellow },
  tab: { color: colors.muted, fontWeight: "700", paddingBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    flexDirection: "row",
    gap: 14,
  },
  date: { width: 52, height: 62, borderRadius: 14, backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center" },
  day: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  month: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  service: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 12 },
  status: { alignSelf: "flex-start", marginTop: 5, backgroundColor: colors.yellowSoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { color: colors.ink, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  cancel: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  review: { color: colors.ink, fontSize: 12, fontWeight: "800" },
});
