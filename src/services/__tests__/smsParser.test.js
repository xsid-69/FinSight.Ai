import {
  parseBankSms,
  isValidBankSender,
  containsPhishingLinks,
  parseSmsDate,
} from '../smsParser';

describe('smsParser - Bank SMS Engine', () => {
  describe('Anti-Fake Filter 1: isValidBankSender', () => {
    it('rejects personal 10-digit mobile numbers with or without +91', () => {
      expect(isValidBankSender('+919876543210', 'debited by 500')).toBe(false);
      expect(isValidBankSender('9876543210', 'debited by 500')).toBe(false);
      expect(isValidBankSender('+91 98765 43210', 'debited by 500')).toBe(false);
    });

    it('accepts official bank sender codes or bank signatures in sender address', () => {
      expect(isValidBankSender('VK-SBIINB', 'debited by 500')).toBe(true);
      expect(isValidBankSender('AD-HDFCBK', 'debited by 500')).toBe(true);
      expect(isValidBankSender('AXISBK', 'debited by 500')).toBe(true);
      expect(isValidBankSender('ICICIB', 'debited by 500')).toBe(true);
      expect(isValidBankSender('PAYTM', 'debited by 500')).toBe(true);
    });

    it('accepts bank signatures found at the end of the message body', () => {
      expect(isValidBankSender('', 'debited by 500 -SBI')).toBe(true);
      expect(isValidBankSender('UNKNOWN', 'debited by 500 for other services-18001234-SBI')).toBe(true);
    });
  });

  describe('Anti-Fake Filter 2: containsPhishingLinks', () => {
    it('detects http and https links', () => {
      expect(containsPhishingLinks('Click here http://fakebank.com to claim')).toBe(true);
      expect(containsPhishingLinks('Visit https://secure-bank-update.xyz now')).toBe(true);
    });

    it('detects URL shorteners and fraudulent keywords', () => {
      expect(containsPhishingLinks('Update KYC at bit.ly/3xyz or account blocked')).toBe(true);
      expect(containsPhishingLinks('Claim reward tinyurl.com/claim-cashback')).toBe(true);
      expect(containsPhishingLinks('Download app from http://bank.apk')).toBe(true);
      expect(containsPhishingLinks('Login to get points at reward-login')).toBe(true);
    });

    it('allows clean bank text without links', () => {
      expect(
        containsPhishingLinks(
          'Dear UPI user A/C X1131 debited by 300.00 on date 18Sep26 trf to RIZWAN QURESHI Refno 626127227690 If not u? call-1800111109'
        )
      ).toBe(false);
    });
  });

  describe('Filter 3: OTP and Non-Transactional Messages', () => {
    it('rejects OTP and verification code messages', () => {
      expect(parseBankSms('Your OTP for SBI card is 549102. Do not share it.')).toBeNull();
      expect(parseBankSms('Verification code is 998811 for login')).toBeNull();
      expect(parseBankSms('Your one time password is 123456')).toBeNull();
      expect(parseBankSms('Your secret code is 884422')).toBeNull();
    });

    it('rejects messages without debit or credit keywords', () => {
      expect(parseBankSms('Welcome to SBI Netbanking. Enjoy seamless banking.')).toBeNull();
      expect(parseBankSms('Dear customer, your statement has been generated.')).toBeNull();
    });
  });

  describe('Date Parsing: parseSmsDate', () => {
    it('parses alphanumeric date like 18Sep26 into 2026-09-18', () => {
      expect(parseSmsDate('debited by 100 on date 18Sep26')).toBe('2026-09-18');
      expect(parseSmsDate('credited by 500 on 05Jan2026')).toBe('2026-01-05');
    });

    it('parses numeric date like 18-09-2026', () => {
      expect(parseSmsDate('debited by 100 on 18-09-2026')).toBe('2026-09-18');
    });
  });

  describe('Acceptance Criteria Test Case', () => {
    const rawSms =
      'Dear UPI user A/C X1131 debited by 300.00 on date 18Sep26 trf to RIZWAN QURESHI Refno 626127227690 If not u? call-1800111109 for other services-18001234-SBI';

    it('successfully parses the SBI UPI debit sample according to acceptance criteria', () => {
      const result = parseBankSms(rawSms, 'VK-SBIINB');

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: 'ref_626127227690',
        amount: 300.0,
        type: 'DEBIT',
        merchant: 'RIZWAN QURESHI',
        category: 'TRANSFER',
        referenceNo: '626127227690',
        accountMask: 'A/c X1131',
        source: 'SMS_AUTO_PARSE',
        date: '2026-09-18',
      });
      expect(result.sanitizedDescription).toBe('RIZWAN QURESHI');
      expect(result.createdAt).toBeDefined();
    });

    it('rejects the sample if sender is a personal 10-digit mobile number', () => {
      const result = parseBankSms(rawSms, '+919876543210');
      expect(result).toBeNull();
    });

    it('rejects the sample if a phishing link is embedded', () => {
      const phishingSms = `${rawSms} Click bit.ly/refund300 to claim back`;
      const result = parseBankSms(phishingSms, 'VK-SBIINB');
      expect(result).toBeNull();
    });
  });

  describe('Auto-Categorization and Merchant Extraction', () => {
    it('correctly categorizes Food transactions (Zomato, Swiggy, Dominos)', () => {
      const sms = 'A/c 1234 debited by Rs. 420.00 on 20Sep26 trf to Zomato Refno 112233445566 -HDFCBK';
      const result = parseBankSms(sms, 'AD-HDFCBK');
      expect(result).not.toBeNull();
      expect(result.category).toBe('FOOD');
      expect(result.merchant).toBe('Zomato');
      expect(result.amount).toBe(420.0);
    });

    it('correctly categorizes Transportation transactions (Uber, Ola, Petrol)', () => {
      const sms = 'A/c 5678 debited by INR 350.50 on 20Sep26 paid to Uber Ref 998877665544 -AXIS';
      const result = parseBankSms(sms, 'AXISBK');
      expect(result).not.toBeNull();
      expect(result.category).toBe('TRANSPORTATION');
      expect(result.merchant).toBe('Uber');
      expect(result.amount).toBe(350.5);
    });

    it('correctly categorizes Shopping transactions (Amazon, Flipkart)', () => {
      const sms = 'A/c 9999 debited by 1,499.00 on 20Sep26 trf to Amazon Refno 334455667788 -ICICI';
      const result = parseBankSms(sms, 'ICICIB');
      expect(result).not.toBeNull();
      expect(result.category).toBe('SHOPPING');
      expect(result.merchant).toBe('Amazon');
      expect(result.amount).toBe(1499.0);
    });

    it('correctly categorizes Entertainment transactions (Netflix, BookMyShow)', () => {
      const sms = 'A/c 4321 debited by 649.00 on 20Sep26 paid to Netflix Refno 887766554433 -SBI';
      const result = parseBankSms(sms, 'SBIINB');
      expect(result).not.toBeNull();
      expect(result.category).toBe('ENTERTAINMENT');
      expect(result.merchant).toBe('Netflix');
    });

    it('correctly categorizes Utilities transactions (Electricity, Airtel, Jio)', () => {
      const sms = 'A/c 1111 debited by 799.00 on 20Sep26 paid to Jio recharge Refno 556677889900 -HDFC';
      const result = parseBankSms(sms, 'HDFCBK');
      expect(result).not.toBeNull();
      expect(result.category).toBe('UTILITIES');
    });

    it('correctly handles Credit transactions and Salary income', () => {
      const sms = 'Your A/C *5555 credited by Rs 75,000.00 on 01Sep26 towards Salary Refno 443322110099 -HDFCBK';
      const result = parseBankSms(sms, 'HDFCBK');
      expect(result).not.toBeNull();
      expect(result.type).toBe('CREDIT');
      expect(result.amount).toBe(75000.0);
      expect(result.category).toBe('INCOME');
    });

    it('falls back to deterministic ID when reference number is absent', () => {
      const sms = 'A/C 1234 debited by 150.00 via UPI to Cafe Coffee -SBI';
      const result = parseBankSms(sms, 'SBIINB');
      expect(result).not.toBeNull();
      expect(result.id).toMatch(/^sms_150_\d+$/);
    });
  });
});
