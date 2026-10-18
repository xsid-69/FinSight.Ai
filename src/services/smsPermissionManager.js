import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';

export async function requestSmsPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ]);

    const receiveStatus = granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
    const readStatus = granted[PermissionsAndroid.PERMISSIONS.READ_SMS];

    const isGranted =
      receiveStatus === PermissionsAndroid.RESULTS.GRANTED &&
      readStatus === PermissionsAndroid.RESULTS.GRANTED;

    if (isGranted) {
      return true;
    }

    // If denied or blocked by Android 13+ "Restricted settings", guide user to App Settings
    if (typeof Alert?.alert === 'function') {
      Alert.alert(
        "SMS Permission Restricted by Android",
        "Android 13/14/15 restricts sensitive permissions for downloaded apps.\n\nTo allow it:\n1. Tap 'Open Settings' below\n2. Tap the 3 dots (⋮) in the top-right corner\n3. Tap 'Allow restricted settings'\n4. Then tap Permissions > SMS > Allow",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              if (typeof Linking?.openSettings === 'function') {
                Linking.openSettings().catch(() => {});
              }
            },
          },
        ]
      );
    }

    return false;
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
