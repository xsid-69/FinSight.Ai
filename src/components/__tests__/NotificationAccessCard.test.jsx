import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationAccessCard } from '../NotificationAccessCard';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';

describe('NotificationAccessCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the 1-Tap Setup card when permission is not authorized', async () => {
    RNAndroidNotificationListener.getPermissionStatus.mockResolvedValueOnce('denied');

    const screen = await render(<NotificationAccessCard />);

    await waitFor(() => {
      expect(screen.getByText('⚡ Real-Time UPI Tracking')).toBeTruthy();
      expect(screen.getByText('1-Tap Setup')).toBeTruthy();
      expect(screen.getByTestId('notification-access-button')).toBeTruthy();
      expect(screen.getByTestId('restricted-settings-help-button')).toBeTruthy();
    });
  });

  it('calls RNAndroidNotificationListener.requestPermission when button is pressed', async () => {
    RNAndroidNotificationListener.getPermissionStatus.mockResolvedValueOnce('denied');

    const screen = await render(<NotificationAccessCard />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-access-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('notification-access-button'));
    expect(RNAndroidNotificationListener.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('displays active tracking state when permission is already authorized', async () => {
    RNAndroidNotificationListener.getPermissionStatus.mockResolvedValueOnce('authorized');

    const screen = await render(<NotificationAccessCard />);

    await waitFor(() => {
      expect(screen.getByText('🟢 Real-Time UPI Tracking Active')).toBeTruthy();
      expect(screen.getByText('LIVE')).toBeTruthy();
      expect(screen.getByTestId('scan-active-notifications-button')).toBeTruthy();
    });
  });

  it('renders and presses Android 13+ restricted settings help button', async () => {
    RNAndroidNotificationListener.getPermissionStatus.mockResolvedValueOnce('denied');

    const screen = await render(<NotificationAccessCard />);

    await waitFor(() => {
      expect(screen.getByTestId('restricted-settings-help-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('restricted-settings-help-button'));
  });
});
