import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";

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

type AuthState = {
  hydrated: boolean;
  user: User | null;
  accessToken: string | null;
  hydrate: () => Promise<void>;
  signIn: (payload: { user: User; accessToken: string; refreshToken: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  hydrated: false,
  user: null,
  accessToken: null,
  hydrate: async () => {
    try {
      const raw = await authStorage.get();
      if (raw) {
        const saved = JSON.parse(raw);
        set({ user: saved.user, accessToken: saved.accessToken, hydrated: true });
        return;
      }
    } catch {
      await authStorage.remove();
    } finally {
      set({ hydrated: true });
    }
  },
  signIn: async (payload) => {
    await authStorage.set(JSON.stringify(payload));
    set({ user: payload.user, accessToken: payload.accessToken });
  },
  signOut: async () => {
    await authStorage.remove();
    set({ user: null, accessToken: null });
  },
}));
