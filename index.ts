import "./src/services/polyfills";
import { AppRegistry } from "react-native";
import { registerRootComponent } from "expo";
import App from "./App";
import { RNAndroidNotificationListenerHeadlessJsName } from "react-native-android-notification-listener";
import { processIncomingNotification } from "./src/services/notificationService";

// Register Main App
registerRootComponent(App);

// Register Headless Background Notification Task
AppRegistry.registerHeadlessTask(
  RNAndroidNotificationListenerHeadlessJsName,
  () => async ({ notification }: { notification: any }) => {
    if (notification) {
      await processIncomingNotification(notification);
    }
  }
);
