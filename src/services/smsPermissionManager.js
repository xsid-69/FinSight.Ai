import { PermissionsAndroid, Platform } from 'react-native';

export async function requestSmsPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.error('Error requesting SMS permission:', err);
    return false;
  }
}

export async function checkSmsPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    const receiveGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
    const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    return Boolean(receiveGranted && readGranted);
  } catch (err) {
    console.error('Error checking SMS permission:', err);
    return false;
  }
}
