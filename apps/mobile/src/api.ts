import Constants from "expo-constants";
import axios from "axios";
import { router } from "expo-router";
import { Platform } from "react-native";
import { useAuth } from "./store";

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.linkingUri?.replace(/^[a-z]+:\/\//, "").split("/")[0];
  const lanHost = hostUri?.split(":")[0];
  if (lanHost && lanHost !== "localhost" && lanHost !== "127.0.0.1") {
    return `http://${lanHost}:4000/api`;
  }

  if (Platform.OS === "android") return "http://10.0.2.2:4000/api";
  return "http://localhost:4000/api";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const { refreshToken, setTokens, signOut } = useAuth.getState();
  if (!refreshToken) {
    await signOut();
    return null;
  }
  try {
    const { data } = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken },
      { timeout: 10_000 },
    );
    await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken as string;
  } catch {
    await signOut();
    try {
      router.replace("/auth");
    } catch {
      /* navigation may not be ready */
    }
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      // Don't try to refresh the refresh call itself
      if (String(original.url ?? "").includes("/auth/")) {
        await useAuth.getState().signOut();
        try {
          router.replace("/auth");
        } catch {
          /* ignore */
        }
        return Promise.reject(error);
      }
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api.request(original);
      }
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return "Something went wrong";
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return `Network error — API at ${api.defaults.baseURL} unreachable. Is the API running?`;
  }
  if (error.response?.status === 401) return "Session expired — sign in again";
  const data = error.response?.data as
    | { error?: string; issues?: { fieldErrors?: Record<string, string[]> } }
    | undefined;
  const fieldErrors = data?.issues?.fieldErrors;
  if (fieldErrors) {
    const lines = Object.entries(fieldErrors)
      .filter(([, msgs]) => msgs?.length)
      .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`);
    if (lines.length) return lines.join("\n");
  }
  return data?.error ?? error.message;
};
