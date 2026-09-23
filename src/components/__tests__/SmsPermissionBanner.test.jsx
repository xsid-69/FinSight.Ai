import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SmsPermissionBanner } from '../SmsPermissionBanner';

describe('SmsPermissionBanner', () => {
  it('renders title, description and action button', async () => {
    const screen = await render(
      <SmsPermissionBanner onRequestPermission={jest.fn()} />
    );

    expect(screen.getByTestId('sms-permission-banner')).toBeTruthy();
    expect(screen.getByText('⚡ Enable Auto-Spend Tracking')).toBeTruthy();
    expect(
      screen.getByText('Allow SMS permission to auto-detect bank UPI spends with zero manual typing.')
    ).toBeTruthy();
    expect(screen.getByText('Allow SMS Permission')).toBeTruthy();
  });

  it('triggers onRequestPermission callback when button is pressed', async () => {
    const onRequest = jest.fn();
    const screen = await render(
      <SmsPermissionBanner onRequestPermission={onRequest} />
    );

    fireEvent.press(screen.getByText('Allow SMS Permission'));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });
});
