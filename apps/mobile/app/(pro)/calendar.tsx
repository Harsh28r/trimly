import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { api, getErrorMessage } from "../../src/api";
import { EmptyState, Screen } from "../../src/components";
import { colors, radius } from "../../src/theme";

type Booking = { _id: string; startAt: string; status: string; customer?: { name: string }; service: { name: string }; staff: { name: string } };

export default function ProCalendar() {
  const queryClient = useQueryClient();
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: async () => (await api.get<Booking[]>("/bookings")).data });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (error) => Alert.alert("Could not update", getErrorMessage(error)),
  });
  return (
    <Screen>
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.copy}>Confirm requests and keep the day moving.</Text>
      <View style={{ gap: 12, marginTop: 24 }}>
        {bookings.data?.map((booking) => (
          <View key={booking._id} style={styles.card}>
            <Text style={styles.date}>{format(new Date(booking.startAt), "EEE, d MMM · h:mm a")}</Text>
            <Text style={styles.service}>{booking.service.name}</Text>
            <Text style={styles.meta}>{booking.staff.name} · {booking.status}</Text>
            {booking.status === "pending" && (
              <View style={styles.actions}>
                <Pressable style={styles.confirm} onPress={() => update.mutate({ id: booking._id, status: "confirmed" })}><Text style={styles.actionText}>Confirm</Text></Pressable>
                <Pressable style={styles.decline} onPress={() => update.mutate({ id: booking._id, status: "cancelled" })}><Text style={styles.actionText}>Decline</Text></Pressable>
              </View>
            )}
            {booking.status === "confirmed" && (
              <Pressable style={styles.confirm} onPress={() => update.mutate({ id: booking._id, status: "completed" })}><Text style={styles.actionText}>Mark completed</Text></Pressable>
            )}
          </View>
        ))}
        {!bookings.isLoading && !bookings.data?.length && <EmptyState icon="calendar-outline" title="No bookings yet" copy="Appointments will show up here." />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 31, color: colors.ink, fontWeight: "900", paddingTop: 18 },
  copy: { color: colors.muted, marginTop: 5 },
  card: { padding: 17, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 4 },
  date: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  service: { color: colors.ink, fontSize: 18, fontWeight: "900", marginTop: 5 },
  meta: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  confirm: { backgroundColor: colors.yellow, borderRadius: radius.pill, paddingHorizontal: 17, paddingVertical: 10, alignSelf: "flex-start", marginTop: 12 },
  decline: { backgroundColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 17, paddingVertical: 10 },
  actionText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
});
