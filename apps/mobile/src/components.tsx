import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "./theme";

export function Screen({
  children,
  scroll = true,
  padded = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) {
  const content = <View style={[styles.content, !padded && { paddingHorizontal: 0 }]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function Button({
  title,
  onPress,
  loading,
  variant = "primary",
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "ghost" && styles.buttonGhost,
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#9A9A9A"
        style={[styles.input, !!error && { borderColor: colors.danger }]}
        {...props}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export type SalonSummary = {
  _id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  images: string[];
};

export function SalonCard({ salon, onPress }: { salon: SalonSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <Image
        source={salon.images[0] ?? "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900"}
        style={styles.cardImage}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.cardBody}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{salon.name}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={colors.ink} />
            <Text style={styles.ratingText}>{salon.rating?.toFixed(1) || "New"}</Text>
          </View>
        </View>
        <Text style={styles.cardCopy} numberOfLines={1}>
          {salon.address}, {salon.city}
        </Text>
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon, title, copy }: { icon: keyof typeof Ionicons.glyphMap; title: string; copy: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.ink} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buttonGhost: { backgroundColor: "transparent" },
  buttonText: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 12 },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardImage: { width: "100%", height: 230, backgroundColor: colors.line },
  cardBody: { padding: 16, gap: 7 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900", flex: 1 },
  cardCopy: { color: colors.muted, fontSize: 14 },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.yellowSoft,
  },
  ratingText: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 64, paddingHorizontal: 24, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.yellowSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 21 },
});
