import {
  parseNotificationPayload,
  TARGET_PAYMENT_PACKAGES,
} from '../notificationParser';

describe('notificationParser', () => {
  describe('Target Package Filter', () => {
    it('recognizes all target Indian payment app packages', () => {
      expect(TARGET_PAYMENT_PACKAGES['com.phonepe.app']).toBe('PhonePe');
      expect(TARGET_PAYMENT_PACKAGES['net.one97.paytm']).toBe('Paytm');
      expect(TARGET_PAYMENT_PACKAGES['in.amazon.mShop.android.shopping']).toBe('Amazon Pay');
      expect(TARGET_PAYMENT_PACKAGES['com.google.android.apps.nbu.paisa.user']).toBe('Google Pay');
      expect(TARGET_PAYMENT_PACKAGES['com.cred.android']).toBe('CRED');
      expect(TARGET_PAYMENT_PACKAGES['in.org.npci.upiapp']).toBe('BHIM UPI');
      expect(TARGET_PAYMENT_PACKAGES['money.super.payments']).toBe('Super.money');
      expect(TARGET_PAYMENT_PACKAGES['money.super.app']).toBe('Super.money');
    });

    it('successfully parses notifications from Super.money official package', () => {
      const payload = {
        app: 'money.super.payments',
        title: 'Payment Successful',
        text: 'Paid ₹150 to Chai Point on Super.money UPI',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(150);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Chai Point');
      expect(result.sourceApp).toBe('Super.money');
    });

    it('successfully parses inverted amount-first format from Super.money', () => {
      const payload = {
        app: 'money.super.payments',
        title: 'Super.money',
        text: '₹150 paid to Ramesh Kumar',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(150);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Ramesh Kumar');
      expect(result.sourceApp).toBe('Super.money');
    });

    it('returns null for untracked app package identifiers', () => {
      const payload = {
        app: 'com.whatsapp',
        title: 'Payment',
        text: 'Paid ₹100 to Rahul',
      };
      expect(parseNotificationPayload(payload)).toBeNull();
    });

    it('returns null for empty or invalid raw payloads', () => {
      expect(parseNotificationPayload(null)).toBeNull();
      expect(parseNotificationPayload(undefined)).toBeNull();
      expect(parseNotificationPayload('')).toBeNull();
      expect(parseNotificationPayload('{ malformed json }')).toBeNull();
    });
  });

  describe('Anti-Spam Filter', () => {
    it('discards promotional offers, scratch cards, discounts, and bill reminders', () => {
      const spamPayloads = [
        {
          app: 'com.phonepe.app',
          title: 'Special offer!',
          text: 'Cashback offer on your next recharge',
        },
        {
          app: 'net.one97.paytm',
          title: 'Congratulations!',
          text: 'Scratch card ready! Win up to ₹500',
        },
        {
          app: 'com.google.android.apps.nbu.paisa.user',
          title: 'Flat Off',
          text: 'Get flat off 50% on Swiggy order now',
        },
        {
          app: 'in.amazon.mShop.android.shopping',
          title: 'Reminder',
          text: 'Your electricity bill due tomorrow. Recharge now',
        },
        {
          app: 'com.cred.android',
          title: 'Loan Approved',
          text: 'Apply now for pre-approved credit up to ₹5,00,000',
        },
      ];

      for (const payload of spamPayloads) {
        expect(parseNotificationPayload(payload)).toBeNull();
      }
    });
  });

  describe('Debit Transaction Parsing', () => {
    it('correctly parses PhonePe debit to Sharma Tea Stall with FOOD category', () => {
      const payload = {
        app: 'com.phonepe.app',
        title: 'PhonePe',
        text: 'Paid ₹150 to Sharma Tea Stall on PhonePe',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(150);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Sharma Tea Stall');
      expect(result.category).toBe('FOOD');
      expect(result.sourceApp).toBe('PhonePe');
      expect(result.appPackage).toBe('com.phonepe.app');
    });

    it('parses Google Pay debit for Zomato food delivery', () => {
      const payload = JSON.stringify({
        app: 'com.google.android.apps.nbu.paisa.user',
        title: 'Google Pay',
        text: 'Payment of Rs 350 to Zomato successful',
      });
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(350);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Zomato');
      expect(result.category).toBe('FOOD');
      expect(result.sourceApp).toBe('Google Pay');
    });

    it('parses Uber cab debit with TRANSPORTATION category', () => {
      const payload = {
        app: 'net.one97.paytm',
        title: 'Paytm UPI',
        text: 'Paid ₹280.50 to Uber India via Paytm Payments Bank.',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(280.50);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Uber India');
      expect(result.category).toBe('TRANSPORTATION');
    });

    it('parses D-Mart shopping debit with SHOPPING category', () => {
      const payload = {
        app: 'in.amazon.mShop.android.shopping',
        title: 'Amazon Pay',
        text: 'Paid INR 1,450 to DMart Retail using Amazon Pay UPI.',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(1450);
      expect(result.type).toBe('DEBIT');
      expect(result.category).toBe('SHOPPING');
    });

    it('parses BookMyShow entertainment debit with ENTERTAINMENT category', () => {
      const payload = {
        app: 'com.cred.android',
        title: 'CRED Pay',
        text: 'Payment of ₹750 to BookMyShow successful via UPI',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(750);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('BookMyShow');
      expect(result.category).toBe('ENTERTAINMENT');
    });

    it('parses electricity bill debit with UTILITIES category', () => {
      const payload = {
        app: 'in.org.npci.upiapp',
        title: 'BHIM',
        text: 'Payment to BESL Electricity bill of ₹1,820 successful',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(1820);
      expect(result.type).toBe('DEBIT');
      expect(result.category).toBe('UTILITIES');
    });
  });

  describe('Credit Transaction Parsing', () => {
    it('correctly parses Paytm credit from Rahul Verma with INCOME category', () => {
      const payload = {
        app: 'net.one97.paytm',
        title: 'Money Received',
        text: 'Received ₹500 from Rahul Verma on Paytm',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(500);
      expect(result.type).toBe('CREDIT');
      expect(result.merchant).toBe('Rahul Verma');
      expect(result.category).toBe('INCOME');
      expect(result.sourceApp).toBe('Paytm');
      expect(result.appPackage).toBe('net.one97.paytm');
    });

    it('parses incoming money transfer notification format', () => {
      const payload = {
        app: 'com.phonepe.app',
        title: 'PhonePe',
        text: 'Priya Sharma sent you ₹1,200 using PhonePe UPI',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(1200);
      expect(result.type).toBe('CREDIT');
      expect(result.merchant).toBe('Priya Sharma');
      expect(result.category).toBe('INCOME');
    });

    it('parses refund credit notification', () => {
      const payload = {
        app: 'com.google.android.apps.nbu.paisa.user',
        title: 'Google Pay',
        text: 'Refund of ₹350 from Swiggy credited by your bank',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(350);
      expect(result.type).toBe('CREDIT');
      expect(result.merchant).toBe('Swiggy');
      expect(result.category).toBe('FOOD');
    });
  });

  describe('Amount and Currency Formats', () => {
    it('handles comma-formatted amounts and decimals correctly', () => {
      const variations = [
        { text: 'Paid ₹15,400 to Dell India', expected: 15400 },
        { text: 'Paid Rs. 240.50 to Chaayos', expected: 240.50 },
        { text: 'Paid Rs 1,250 to Store', expected: 1250 },
        { text: 'Paid INR 99.00 to Merchant', expected: 99 },
      ];

      for (const item of variations) {
        const res = parseNotificationPayload({
          app: 'com.phonepe.app',
          title: 'Alert',
          text: item.text,
        });
        expect(res).not.toBeNull();
        expect(res.amount).toBe(item.expected);
      }
    });

    it('returns null when notification lacks a numerical currency amount', () => {
      const payload = {
        app: 'com.phonepe.app',
        title: 'Payment Alert',
        text: 'Paid some amount to merchant',
      };
      expect(parseNotificationPayload(payload)).toBeNull();
    });
  });

  describe('Super.money Support', () => {
    it('correctly recognizes Super.money package identifier', () => {
      expect(TARGET_PAYMENT_PACKAGES['money.super.app']).toBe('Super.money');
      expect(TARGET_PAYMENT_PACKAGES['com.supermoney']).toBe('Super.money');
    });

    it('correctly parses Super.money payment notification', () => {
      const payload = {
        app: 'money.super.app',
        title: 'Super.money',
        text: 'Paid ₹120 to Chai Point on Super.money UPI',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(120);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Chai Point');
      expect(result.sourceApp).toBe('Super.money');
      expect(result.category).toBe('FOOD');
    });

    it('correctly parses Super.money package variants', () => {
      const payload = {
        app: 'com.supermoney',
        title: 'UPI Transaction',
        text: 'Paid ₹250 to Fresh Fruits using Super.money',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(250);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Fresh Fruits');
      expect(result.sourceApp).toBe('Super.money');
      expect(result.category).toBe('FOOD');
    });
  });

  describe('Bank UPI & Grouped Notifications', () => {
    it('parses Axis Bank UPI debit notification', () => {
      const payload = {
        app: 'com.axis.mobile',
        title: 'Axis Bank Alert',
        text: 'A/c debited by INR 650.00 on 17-Oct at Swiggy UPI-Ref 123456',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(650);
      expect(result.type).toBe('DEBIT');
      expect(result.sourceApp).toBe('Axis Mobile');
      expect(result.category).toBe('FOOD');
    });

    it('parses SBI UPI debit notification', () => {
      const payload = {
        app: 'com.sbi.upi',
        title: 'SBI UPI',
        text: 'Rs 1500 debited from A/c XX1234 for transfer to Landlord on 17-Oct',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(1500);
      expect(result.type).toBe('DEBIT');
      expect(result.sourceApp).toBe('SBI UPI');
    });

    it('parses groupedMessages when standard text is empty', () => {
      const payload = {
        app: 'com.phonepe.app',
        title: 'PhonePe',
        text: '',
        groupedMessages: [
          { title: 'Payment', text: 'Paid ₹420 to Dominos Pizza' },
        ],
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(420);
      expect(result.type).toBe('DEBIT');
      expect(result.merchant).toBe('Dominos Pizza');
      expect(result.category).toBe('FOOD');
    });

    it('supports ADB shell simulation notifications for PhonePe and GPay', () => {
      const payload = {
        app: 'com.android.shell',
        title: 'PhonePe',
        text: 'Paid ₹150 to Sharma Tea Stall on PhonePe',
      };
      const result = parseNotificationPayload(payload);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(150);
      expect(result.sourceApp).toBe('PhonePe');
    });
  });
});

