import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

/** Push remote APIs were removed from Expo Go (SDK 53+). Skip there + web. */
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const pushUnsupported = isExpoGo || Platform.OS === "web";

let Notifications: typeof import("expo-notifications") | null = null;

if (!pushUnsupported) {
  try {
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
  if (!Notifications || pushUnsupported) return;

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
