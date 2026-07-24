import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";
import { useAuth } from "./store";

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Physical device / Expo Go: reuse Metro machine IP (localhost won't work on phone)
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.linkingUri?.replace(/^[a-z]+:\/\//, "").split("/")[0];
  const lanHost = hostUri?.split(":")[0];
  if (lanHost && lanHost !== "localhost" && lanHost !== "127.0.0.1") {
    return `http://${lanHost}:4000/api`;
  }

  // Android emulator loopback to host machine
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) await useAuth.getState().signOut();
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return "Something went wrong";
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return `Network error — API at ${api.defaults.baseURL} unreachable. Is the API running?`;
  }
  return error.response?.data?.error ?? error.message;
};
