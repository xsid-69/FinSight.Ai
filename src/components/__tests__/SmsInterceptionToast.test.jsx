import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SmsInterceptionToast } from '../SmsInterceptionToast';

describe('SmsInterceptionToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const debitTx = {
    id: 'ref_626127227690',
    amount: 300.0,
    type: 'DEBIT',
    merchant: 'RIZWAN QURESHI',
    category: 'TRANSFER',
    referenceNo: '626127227690',
  };

  it('renders debit transaction details accurately', async () => {
    const screen = await render(
      <SmsInterceptionToast transaction={debitTx} onDismiss={jest.fn()} />
    );

    expect(screen.getByTestId('sms-interception-toast')).toBeTruthy();
    expect(screen.getByText('-₹300.00')).toBeTruthy();
    expect(screen.getByText(/Paid to RIZWAN QURESHI • TRANSFER • Ref: 626127227690/)).toBeTruthy();
    expect(screen.getByText('LIVE')).toBeTruthy();
  });

  it('renders credit transaction correctly with positive prefix', async () => {
    const creditTx = {
      id: 'ref_998877665544',
      amount: 1500.5,
      type: 'CREDIT',
      merchant: 'ABC CORP',
      category: 'INCOME',
      referenceNo: '998877665544',
    };

    const screen = await render(
      <SmsInterceptionToast transaction={creditTx} onDismiss={jest.fn()} />
    );

    expect(screen.getByText('+₹1500.50')).toBeTruthy();
    expect(screen.getByText(/Received from ABC CORP • INCOME • Ref: 998877665544/)).toBeTruthy();
  });

  it('calls onDismiss when tapped', async () => {
    const onDismiss = jest.fn();
    const screen = await render(
      <SmsInterceptionToast transaction={debitTx} onDismiss={onDismiss} />
    );

    fireEvent.press(screen.getByText('-₹300.00'));
    act(() => {
      jest.runAllTimers();
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses after duration expires', async () => {
    const onDismiss = jest.fn();
    await render(
      <SmsInterceptionToast
        transaction={debitTx}
        onDismiss={onDismiss}
        duration={4000}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(4050);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders nothing when transaction is null', async () => {
    const screen = await render(
      <SmsInterceptionToast transaction={null} onDismiss={jest.fn()} />
    );
    expect(screen.queryByTestId('sms-interception-toast')).toBeNull();
  });
});
