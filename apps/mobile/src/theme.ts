import { Platform, type TextStyle } from "react-native";

/** Trimly visual system — ink + champagne gold, editorial barbershop. */
export const colors = {
  yellow: "#E8C04A",
  yellowHot: "#F5D56A",
  yellowSoft: "#F7E9B8",
  yellowDeep: "#C9A227",
  ink: "#0C0C0C",
  inkSoft: "#1A1A1A",
  muted: "#6F6A63",
  mutedSoft: "#9A948C",
  line: "#E7E2D9",
  lineStrong: "#D4CEC3",
  surface: "#FFFFFF",
  surfaceWarm: "#FBF8F2",
  background: "#EEEDE8",
  backgroundDeep: "#E4E2DB",
  danger: "#C43C2C",
  success: "#1F7A4D",
  overlay: "rgba(12,12,12,0.55)",
  glass: "rgba(255,255,255,0.72)",
};

export const radius = { xs: 10, sm: 14, md: 22, lg: 28, xl: 36, pill: 999 };

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 };

export const type = {
  brand: {
    fontSize: 15,
    fontWeight: "800" as const,
    letterSpacing: 3.2,
    textTransform: "uppercase" as const,
    color: colors.ink,
  },
  hero: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "900" as const,
    letterSpacing: -1.2,
    color: colors.ink,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900" as const,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  section: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900" as const,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500" as const,
    color: colors.muted,
  },
  label: {
    fontSize: 12,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    color: colors.muted,
  },
};

export const shadow = {
  soft: Platform.select({
    ios: {
      shadowColor: "#1A1408",
      shadowOpacity: 0.1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 6 },
    web: { boxShadow: "0 12px 28px rgba(26,20,8,0.12)" },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: "#1A1408",
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
    },
    android: { elevation: 8 },
    web: { boxShadow: "0 16px 40px rgba(26,20,8,0.14)" },
    default: {},
  }),
  glow: Platform.select({
    ios: {
      shadowColor: colors.yellow,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 4 },
    web: { boxShadow: "0 10px 28px rgba(232,192,74,0.45)" },
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
