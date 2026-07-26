import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadow, textDisplay, type } from "./theme";

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ["top"],
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
}) {
  const content = <View style={[styles.content, !padded && { paddingHorizontal: 0 }]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <LinearGradient colors={[colors.background, colors.backgroundDeep]} style={StyleSheet.absoluteFill} />
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
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
  variant?: "primary" | "secondary" | "ghost" | "dark";
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, friction: 6, tension: 160 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
        style={({ pressed }) => [
          styles.button,
          variant === "primary" && styles.buttonPrimary,
          variant === "secondary" && styles.buttonSecondary,
          variant === "ghost" && styles.buttonGhost,
          variant === "dark" && styles.buttonDark,
          pressed && { opacity: 0.92 },
          disabled && { opacity: 0.4 },
        ]}
      >
        {variant === "primary" && !disabled && (
          <LinearGradient
            colors={[colors.yellowHot, colors.yellow, colors.yellowDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        {loading ? (
          <ActivityIndicator color={variant === "dark" ? colors.yellow : colors.ink} />
        ) : (
          <Text
            style={[
              styles.buttonText,
              variant === "dark" && { color: colors.yellowHot },
              variant === "ghost" && { color: colors.ink },
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedSoft}
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }] }]}>
      <Image
        source={salon.images[0] ?? "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900"}
        style={styles.cardImage}
        contentFit="cover"
        transition={320}
      />
      <LinearGradient
        colors={["transparent", "rgba(12,12,12,0.15)", "rgba(12,12,12,0.88)"]}
        locations={[0.35, 0.62, 1]}
        style={styles.cardFade}
      />
      <View style={styles.cardBody}>
        <View style={styles.rating}>
          <Ionicons name="star" size={12} color={colors.ink} />
          <Text style={styles.ratingText}>{salon.rating?.toFixed(1) || "New"}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {salon.name}
        </Text>
        <Text style={styles.cardCopy} numberOfLines={1}>
          {salon.city} · {salon.address}
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

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionLink}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, style]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48 },
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    overflow: "hidden",
  },
  buttonPrimary: { ...shadow.glow },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  buttonGhost: { backgroundColor: "transparent" },
  buttonDark: { backgroundColor: colors.ink, ...shadow.soft },
  buttonText: { color: colors.ink, fontSize: 15, fontWeight: "900", letterSpacing: 0.3 },
  label: { ...type.label, color: colors.inkSoft },
  input: {
    minHeight: 56,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "500",
  },
  error: { color: colors.danger, fontSize: 12, fontWeight: "600" },
  card: {
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.ink,
    height: 260,
    ...shadow.card,
  },
  cardImage: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.inkSoft },
  cardFade: { ...StyleSheet.absoluteFillObject },
  cardBody: { position: "absolute", left: 16, right: 16, bottom: 16, gap: 6 },
  cardTitle: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  cardCopy: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },
  rating: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow,
    marginBottom: 4,
  },
  ratingText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 72, paddingHorizontal: 28, gap: 10 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.yellowSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: { ...textDisplay({ fontSize: 22 }) },
  emptyCopy: { ...type.body, textAlign: "center" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: { ...type.section },
  sectionLink: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: colors.yellowHot },
});
