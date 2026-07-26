import { Platform, type TextStyle } from "react-native";

/** Trimly visual system — modern vibrant barbershop theme. */
export const colors = {
  yellow: "#FFB800",
  yellowHot: "#FFD700",
  yellowSoft: "#FFF4CC",
  yellowDeep: "#E6A800",
  ink: "#1A1A2E",
  inkSoft: "#2D2D44",
  muted: "#7A7A8C",
  mutedSoft: "#A0A0B0",
  line: "#E8E8F0",
  lineStrong: "#D0D0E0",
  surface: "#FFFFFF",
  surfaceWarm: "#FFFBF0",
  background: "#F5F5FA",
  backgroundDeep: "#EBEBF5",
  danger: "#FF4757",
  success: "#2ED573",
  overlay: "rgba(26,26,46,0.6)",
  glass: "rgba(255,255,255,0.85)",
};

export const radius = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 };

export const type = {
  brand: {
    fontSize: 14,
    fontWeight: "900" as const,
    letterSpacing: 2.8,
    textTransform: "uppercase" as const,
    color: colors.ink,
  },
  hero: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900" as const,
    letterSpacing: -1,
    color: colors.ink,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900" as const,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  section: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900" as const,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const,
    color: colors.muted,
  },
  label: {
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    color: colors.muted,
  },
};

export const shadow = {
  soft: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 6 },
    web: { boxShadow: "0 12px 32px rgba(26,26,46,0.1)" },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: 0.12,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
    },
    android: { elevation: 10 },
    web: { boxShadow: "0 20px 48px rgba(26,26,46,0.14)" },
    default: {},
  }),
  glow: Platform.select({
    ios: {
      shadowColor: colors.yellow,
      shadowOpacity: 0.5,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 6 },
    web: { boxShadow: "0 12px 32px rgba(255,184,0,0.5)" },
    default: {},
  }),
};

export const font = {
  display: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
  body: Platform.select({ ios: "System", android: "sans-serif", default: "system-ui" }),
};

export const textDisplay = (extra?: TextStyle): TextStyle => ({
  fontFamily: font.display,
  fontWeight: "700",
  color: colors.ink,
  ...extra,
});
