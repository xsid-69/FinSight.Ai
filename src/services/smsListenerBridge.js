import { DeviceEventEmitter, Platform } from 'react-native';

const SMS_RECEIVED_EVENT = 'smsReceived';

export const SmsListenerBridge = {
  addListener(callback) {
    if (Platform.OS !== 'android') {
      return { remove: () => {} };
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
};

export default SmsListenerBridge;
