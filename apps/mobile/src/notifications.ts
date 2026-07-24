import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

/** Push remote APIs were removed from Expo Go (SDK 53+). Skip there. */
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import("expo-notifications") | null = null;

if (!isExpoGo) {
  try {
    // Lazy require so Expo Go never evaluates the push stubs that throw.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require("expo-notifications");
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    Notifications = null;
  }
}

export async function registerPushNotifications() {
  if (!Notifications || isExpoGo) return;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Bookings",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const permission = await Notifications.requestPermissionsAsync();
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (permission.status !== "granted" || !projectId) return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api.patch("/me/push-token", { expoPushToken: token });
  } catch (error) {
    if (__DEV__) console.warn("[push] skipped:", error);
  }
}
