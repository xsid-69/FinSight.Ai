// src/services/notificationListenerBridge.ts
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

const NOTIFICATION_RECEIVED_EVENT = 'notificationReceived';

export const NotificationListenerBridge = {
  /**
   * Listen to real-time notification events emitted by native FinsightNotificationListenerService.
   */
  addListener(callback: (payload: { notification: any }) => void) {
    if (Platform.OS !== 'android') {
      return { remove: () => {} };
    }

    const subscription = DeviceEventEmitter.addListener(
      NOTIFICATION_RECEIVED_EVENT,
      (data) => {
        try {
          callback(data);
        } catch (err) {
          console.warn('Error in notification listener callback:', err);
        }
      }
    );

    return {
      remove() {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        } else if (typeof (DeviceEventEmitter as any).removeListener === 'function') {
          (DeviceEventEmitter as any).removeListener(NOTIFICATION_RECEIVED_EVENT, callback);
        }
      },
    };
  },

  /**
   * Check if user has granted Notification Access (NotificationListenerService).
   */
  async getPermissionStatus(): Promise<'authorized' | 'denied' | 'unknown'> {
    if (Platform.OS !== 'android') return 'denied';
    try {
      const module = NativeModules?.FinsightNotificationListener || NativeModules?.RNAndroidNotificationListener;
      if (module && typeof module.getPermissionStatus === 'function') {
        return await module.getPermissionStatus();
      }
      return 'denied';
    } catch {
      return 'denied';
    }
  },

  /**
   * Open Android Special App Access -> Notification Access settings screen.
   */
  async requestPermission(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      if (NativeModules?.FinsightNotificationListener?.requestPermission) {
        NativeModules.FinsightNotificationListener.requestPermission();
      } else if (NativeModules?.RNAndroidNotificationListener?.requestPermission) {
        NativeModules.RNAndroidNotificationListener.requestPermission();
      }
    } catch (err) {
      console.warn('Could not request notification listener permission:', err);
    }
  },

  /**
   * Open App Details / App Info screen so user can unlock 'Allow restricted settings' on Android 13/14/15.
   */
  async openAppDetails(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      const module = NativeModules?.FinsightNotificationListener;
      if (module && typeof module.openAppDetails === 'function') {
        module.openAppDetails();
        return;
      }
      const Linking = require('react-native').Linking;
      await Linking.openSettings();
    } catch (err) {
      console.warn('Could not open app details settings:', err);
    }
  },

  /**
   * Query status bar notifications currently present in Android notification drawer.
   */
  async readActiveNotifications(): Promise<any[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const module = NativeModules?.FinsightNotificationListener;
      if (module && typeof module.readActiveNotifications === 'function') {
        return await module.readActiveNotifications();
      }
      return [];
    } catch (err) {
      console.warn('Could not read active notifications:', err);
      return [];
    }
  },

  /**
   * Flush any notifications intercepted while app was in background or closed.
   */
  async flushPendingNotifications(): Promise<any[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const module = NativeModules?.FinsightNotificationListener;
      if (module && typeof module.flushPendingNotifications === 'function') {
        return await module.flushPendingNotifications();
      }
      return [];
    } catch (err) {
      console.warn('Could not flush pending notifications:', err);
      return [];
    }
  },
};

export default NotificationListenerBridge;
