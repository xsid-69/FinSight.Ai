import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

const SMS_RECEIVED_EVENT = 'smsReceived';

export const SmsListenerBridge = {
  addListener(callback) {
    if (Platform.OS !== 'android') {
      return { remove: () => {} };
    }
    try {
      NativeModules?.SmsListener?.startListening?.();
    } catch {
      // Ignored
    }
    const subscription = DeviceEventEmitter.addListener(SMS_RECEIVED_EVENT, callback);
    return {
      remove() {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        } else if (typeof DeviceEventEmitter.removeListener === 'function') {
          DeviceEventEmitter.removeListener(SMS_RECEIVED_EVENT, callback);
        }
      },
    };
  },

  async readRecentSms(limit = 100) {
    if (Platform.OS !== 'android') {
      return [];
    }
    try {
      const smsModule = NativeModules?.SmsListener;
      if (smsModule && typeof smsModule.readRecentSms === 'function') {
        return await smsModule.readRecentSms(limit);
      }
      return [];
    } catch (error) {
      console.warn('Could not read recent SMS from inbox:', error);
      return [];
    }
  },
};

export default SmsListenerBridge;

