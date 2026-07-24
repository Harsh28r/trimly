import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../src/api";
import { EmptyState, Screen } from "../src/components";
import { colors, radius } from "../src/theme";

type Notice = { _id: string; title: string; body: string; readAt?: string; createdAt: string };

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notices = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get<Notice[]>("/notifications")).data });
  const read = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <Screen>
      <View style={{ gap: 11, marginTop: 18 }}>
        {notices.data?.map((notice) => (
          <Pressable key={notice._id} style={[styles.notice, !notice.readAt && styles.unread]} onPress={() => read.mutate(notice._id)}>
            <View style={styles.icon}><Ionicons name="notifications" size={18} color={colors.ink} /></View>
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.title}>{notice.title}</Text><Text style={styles.body}>{notice.body}</Text></View>
            {!notice.readAt && <View style={styles.dot} />}
          </Pressable>
        ))}
        {!notices.isLoading && !notices.data?.length && <EmptyState icon="notifications-outline" title="All quiet" copy="Booking updates and reminders will appear here." />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  unread: { backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  title: { color: colors.ink, fontWeight: "900" },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
});
