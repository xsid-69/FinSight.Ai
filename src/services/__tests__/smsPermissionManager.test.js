import { PermissionsAndroid, Platform } from 'react-native';
import { requestSmsPermission, checkSmsPermission } from '../smsPermissionManager';

describe('smsPermissionManager', () => {
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {
      get: () => 'android',
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      get: () => originalPlatformOS,
      configurable: true,
    });
  });

  describe('requestSmsPermission', () => {
    it('returns true when both RECEIVE_SMS and READ_SMS are granted', async () => {
      jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValueOnce({
        [PermissionsAndroid.PERMISSIONS.RECEIVE_SMS]: PermissionsAndroid.RESULTS.GRANTED,
        [PermissionsAndroid.PERMISSIONS.READ_SMS]: PermissionsAndroid.RESULTS.GRANTED,
      });

      const granted = await requestSmsPermission();
      expect(granted).toBe(true);
      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith([
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ]);
    });

    it('returns false if any permission is denied', async () => {
      jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValueOnce({
        [PermissionsAndroid.PERMISSIONS.RECEIVE_SMS]: PermissionsAndroid.RESULTS.GRANTED,
        [PermissionsAndroid.PERMISSIONS.READ_SMS]: PermissionsAndroid.RESULTS.DENIED,
      });

      const granted = await requestSmsPermission();
      expect(granted).toBe(false);
    });

    it('returns false when on iOS / non-android platform', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });
      const requestSpy = jest.spyOn(PermissionsAndroid, 'requestMultiple');
      const granted = await requestSmsPermission();
      expect(granted).toBe(false);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('returns false gracefully when requestMultiple throws', async () => {
      jest.spyOn(PermissionsAndroid, 'requestMultiple').mockRejectedValueOnce(new Error('Permission error'));
      const granted = await requestSmsPermission();
      expect(granted).toBe(false);
    });
  });

  describe('checkSmsPermission', () => {
    it('returns true when both permissions are checked and granted', async () => {
      jest.spyOn(PermissionsAndroid, 'check')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const isGranted = await checkSmsPermission();
      expect(isGranted).toBe(true);
    });

    it('returns false when either permission is not granted', async () => {
      jest.spyOn(PermissionsAndroid, 'check')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const isGranted = await checkSmsPermission();
      expect(isGranted).toBe(false);
    });

    it('returns false when on non-android platform', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });
      const isGranted = await checkSmsPermission();
      expect(isGranted).toBe(false);
    });
  });
});
