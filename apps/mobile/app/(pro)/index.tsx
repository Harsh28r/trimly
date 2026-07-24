import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api";
import { EmptyState, Screen } from "../../src/components";
import { useAuth } from "../../src/store";
import { colors, radius } from "../../src/theme";

type Booking = { _id: string; startAt: string; status: string; price: number; service: { name: string }; staff: { name: string } };

export default function ProDashboard() {
  const user = useAuth((state) => state.user);
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: async () => (await api.get<Booking[]>("/bookings")).data });
  const today = bookings.data?.filter((booking) => isToday(new Date(booking.startAt))) ?? [];
  const pending = bookings.data?.filter((booking) => booking.status === "pending").length ?? 0;
  const revenue = today.filter((booking) => booking.status !== "cancelled").reduce((sum, booking) => sum + booking.price, 0);

  return (
    <Screen>
      <Text style={styles.eyebrow}>PRO DASHBOARD</Text>
      <Text style={styles.title}>Morning, {user?.name.split(" ")[0]}.</Text>
      <Text style={styles.copy}>Here’s how your chair is looking today.</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={styles.metricLabel}>TODAY</Text><Text style={styles.metricValue}>{today.length}</Text><Text style={styles.metricMeta}>appointments</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>PENDING</Text><Text style={styles.metricValue}>{pending}</Text><Text style={styles.metricMeta}>to confirm</Text></View>
        <View style={[styles.metric, styles.metricYellow]}><Text style={styles.metricLabel}>VALUE</Text><Text style={styles.metricValue}>₹{revenue}</Text><Text style={styles.metricMeta}>booked today</Text></View>
      </View>
      <Text style={styles.section}>Today’s lineup</Text>
      <View style={{ gap: 10 }}>
        {today.map((booking) => (
          <View key={booking._id} style={styles.booking}>
            <Text style={styles.time}>{format(new Date(booking.startAt), "h:mm")}</Text>
            <View style={{ flex: 1 }}><Text style={styles.service}>{booking.service.name}</Text><Text style={styles.staff}>{booking.staff.name}</Text></View>
            <Text style={styles.status}>{booking.status}</Text>
          </View>
        ))}
        {!bookings.isLoading && !today.length && <EmptyState icon="sunny-outline" title="A clear day" copy="New bookings will appear here as customers reserve." />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.4, paddingTop: 20 },
  title: { color: colors.ink, fontSize: 31, fontWeight: "900", marginTop: 6 },
  copy: { color: colors.muted, marginTop: 5 },
  metrics: { flexDirection: "row", gap: 8, marginTop: 25 },
  metric: { flex: 1, minHeight: 122, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 14 },
  metricYellow: { backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  metricLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  metricValue: { color: colors.ink, fontSize: 25, fontWeight: "900", marginTop: 13 },
  metricMeta: { color: colors.muted, fontSize: 10, marginTop: 2 },
  section: { color: colors.ink, fontSize: 21, fontWeight: "900", marginTop: 30, marginBottom: 13 },
  booking: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.line },
  time: { color: colors.ink, fontWeight: "900", width: 45 },
  service: { color: colors.ink, fontWeight: "800" },
  staff: { color: colors.muted, fontSize: 12, marginTop: 2 },
  status: { color: colors.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
});
