import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import axios from "axios";

const AUTH_KEY = "trimly.auth";

const authStorage = {
  get: () =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.getItem(AUTH_KEY) ?? null)
      : SecureStore.getItemAsync(AUTH_KEY),
  set: (value: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.setItem(AUTH_KEY, value))
      : SecureStore.setItemAsync(AUTH_KEY, value),
  remove: () =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.removeItem(AUTH_KEY))
      : SecureStore.deleteItemAsync(AUTH_KEY),
};

export type User = {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "owner" | "barber";
  avatar?: string;
};

type AuthPayload = { user: User; accessToken: string; refreshToken: string };

type AuthState = {
  hydrated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  signIn: (payload: AuthPayload) => Promise<void>;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

function apiBase() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "android") return "http://10.0.2.2:4000/api";
  return "http://localhost:4000/api";
}

export const useAuth = create<AuthState>((set, get) => ({
  hydrated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrate: async () => {
    try {
      const raw = await authStorage.get();
      if (!raw) return;
      const saved = JSON.parse(raw) as AuthPayload;
      set({
        user: saved.user,
        accessToken: saved.accessToken,
        refreshToken: saved.refreshToken ?? null,
      });

      // Validate / refresh so reseed + expired tokens don't leave a zombie session
      try {
        await axios.get(`${apiBase()}/me`, {
          headers: { Authorization: `Bearer ${saved.accessToken}` },
          timeout: 8_000,
        });
      } catch {
        if (!saved.refreshToken) {
          await authStorage.remove();
          set({ user: null, accessToken: null, refreshToken: null });
          return;
        }
        try {
          const { data } = await axios.post(
            `${apiBase()}/auth/refresh`,
            { refreshToken: saved.refreshToken },
            { timeout: 8_000 },
          );
          const next = {
            user: saved.user,
            accessToken: data.accessToken as string,
            refreshToken: data.refreshToken as string,
          };
          await authStorage.set(JSON.stringify(next));
          set(next);
        } catch {
          await authStorage.remove();
          set({ user: null, accessToken: null, refreshToken: null });
        }
      }
    } catch {
      await authStorage.remove();
      set({ user: null, accessToken: null, refreshToken: null });
    } finally {
      set({ hydrated: true });
    }
  },
  signIn: async (payload) => {
    await authStorage.set(JSON.stringify(payload));
    set({
      user: payload.user,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  },
  setTokens: async (tokens) => {
    const { user } = get();
    if (!user) return;
    const next = { user, ...tokens };
    await authStorage.set(JSON.stringify(next));
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  },
  signOut: async () => {
    await authStorage.remove();
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
