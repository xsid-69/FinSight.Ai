/**
 * Anti-Fake Bank SMS Parser & Sanitizer
 * Production-grade parser for Indian Bank & UPI transaction SMS formats
 * with 3-tier Anti-Fake/Anti-Fraud filters.
 */

const BANK_REGEX = /(SBI|HDFC|ICICI|AXIS|PNB|BOB|PAYTM|GPAY|PHONEPE|YESB|CANARA|UNIONB|KOTAK|INDUS)/i;
const PHISHING_REGEX = /(https?:\/\/|bit\.ly|tinyurl\.com|claim-cashback|\.apk|reward-login)/i;

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/**
 * 1. Anti-Fake Filter 1: Validates TRAI DLT Bank Header (Alphanumeric sender, not 10-digit phone)
 */
export function isValidBankSender(senderAddress, messageBody = '') {
  if (!senderAddress) {
    // If senderAddress is not available, check for bank signature in body
    return BANK_REGEX.test(messageBody.slice(-30)) || BANK_REGEX.test(messageBody);
  }

  const cleanedSender = senderAddress.replace(/\s+/g, '');

  // Discard messages originating from personal 10-digit mobile numbers (+91XXXXXXXXXX or standard 10-digit)
  if (/^\+?91?[6-9]\d{9}$/.test(cleanedSender) || /^[6-9]\d{9}$/.test(cleanedSender)) {
    return false;
  }

  // Check known bank signatures in sender code or trailing signature (e.g., -SBI, -HDFCBK)
  return BANK_REGEX.test(cleanedSender) || BANK_REGEX.test(messageBody.slice(-30));
}

/**
 * 2. Anti-Fake Filter 2: Checks for Phishing / Fraudulent Links
 */
export function containsPhishingLinks(text) {
  if (!text || typeof text !== 'string') return false;
  return PHISHING_REGEX.test(text);
}

/**
 * Helper to parse dates like "18Sep26", "18-09-2026", or return current date YYYY-MM-DD
 */
export function parseSmsDate(messageBody) {
  const currentDate = new Date().toISOString().slice(0, 10);
  if (!messageBody) return currentDate;

  // Format: 18Sep26 or 18Sep2026
  const alphaDateMatch = messageBody.match(/(?:on date|on)\s*([0-9]{1,2})([A-Za-z]{3})([0-9]{2,4})/i);
  if (alphaDateMatch) {
    const day = alphaDateMatch[1].padStart(2, '0');
    const month = MONTH_MAP[alphaDateMatch[2].toLowerCase()];
    let year = alphaDateMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY
  const numDateMatch = messageBody.match(/(?:on date|on)\s*([0-9]{1,2})[-/]([0-9]{1,2})[-/]([0-9]{2,4})/i);
  if (numDateMatch) {
    const day = numDateMatch[1].padStart(2, '0');
    const month = numDateMatch[2].padStart(2, '0');
    let year = numDateMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  return currentDate;
}

/**
 * 3. Core Parser: Extracts fields matching SBI, HDFC, ICICI, Axis, UPI formats
 */
export function parseBankSms(messageBody, senderAddress = '') {
  if (!messageBody || typeof messageBody !== 'string') return null;

  // Filter 1: Sender validation
  if (senderAddress && !isValidBankSender(senderAddress, messageBody)) {
    return null;
  }

  // Filter 2: Drop phishing attempts
  if (containsPhishingLinks(messageBody)) {
    return null;
  }

  // Filter 3: Discard OTPs and non-transactional alerts
  if (/(\botp\b|verification code|one time password|secret code)/i.test(messageBody)) {
    return null;
  }

  // Determine Type (Debit vs Credit)
  const isDebit = /\b(debited|spent|paid|withdrawn|trf to)\b/i.test(messageBody);
  const isCredit = /\b(credited|received|deposited|refunded)\b/i.test(messageBody);
  if (!isDebit && !isCredit) return null;

  // Extract Amount (e.g. "debited by 300.00", "Rs. 250", "INR 1,200.50", "credited by 500")
  const amountMatch = messageBody.match(/(?:debited by|credited by|Rs\.?|INR|\u20b9)\s*([\d,]+(?:\.\d{2})?)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Extract Merchant / Payee (e.g. "trf to RIZWAN QURESHI", "to VPA zomato@hdfcbank", "paid to Starbucks")
  let merchant = 'Bank Transfer';
  const payeeMatch = messageBody.match(/(?:trf to|to VPA|paid to|to info|to)\s+([A-Za-z0-9\s._-]+?)(?=\s+(?:Refno|Ref\s*no|Ref|on date|on|via|bal|a\/c|\.))/i);
  if (payeeMatch && payeeMatch[1].trim().length > 1) {
    merchant = payeeMatch[1].trim();
  }

  // Extract 12-Digit UPI Reference Number (UTR / RRN)
  let referenceNo = '';
  const refMatch = messageBody.match(/(?:Refno|Ref no|Ref|UTR|RRN)\s*[:.]?\s*([A-Za-z0-9]{10,16})/i);
  if (refMatch) {
    referenceNo = refMatch[1].trim();
  }

  // Extract Masked Account (e.g. "A/C X1131", "A/c *1234", "Card XX1234")
  let accountMask = 'Account';
  const acctMatch = messageBody.match(/(?:A\/C|Acct|Card)\s*[:#]?\s*([A-Za-z0-9*]+)/i);
  if (acctMatch) {
    accountMask = `A/c ${acctMatch[1]}`;
  }

  // Extract Date
  const txnDate = parseSmsDate(messageBody);

  // Auto-Categorization (Tier 1 Local Regex)
  const lowerMerchant = merchant.toLowerCase();
  let category = 'TRANSFER';
  if (/(zomato|swiggy|mcdonalds|kfc|dominos|restaurant|cafe|bakery|dining|food)/i.test(lowerMerchant)) {
    category = 'FOOD';
  } else if (/(uber|ola|rapido|irctc|metro|petrol|fuel|hpcl|bpcl|iocl)/i.test(lowerMerchant)) {
    category = 'TRANSPORTATION';
  } else if (/(amazon|flipkart|myntra|zudio|trends|dmart|retail)/i.test(lowerMerchant)) {
    category = 'SHOPPING';
  } else if (/(pvr|inox|bookmyshow|netflix|prime|spotify)/i.test(lowerMerchant)) {
    category = 'ENTERTAINMENT';
  } else if (/(electricity|airtel|jio|recharge|water|besl)/i.test(lowerMerchant)) {
    category = 'UTILITIES';
  } else if (isCredit && /(salary|payroll|bonus)/i.test(messageBody)) {
    category = 'INCOME';
  }

  // Unique deterministic document ID (prevents double logging)
  const docId = referenceNo 
    ? `ref_${referenceNo}` 
    : `sms_${amount}_${Date.now()}`;

  return {
    id: docId,
    amount,
    type: isDebit ? 'DEBIT' : 'CREDIT',
    description: merchant,
    merchant,
    sanitizedDescription: merchant,
    category,
    accountMask,
    referenceNo,
    source: 'SMS_AUTO_PARSE',
    date: txnDate,
    createdAt: new Date().toISOString()
  };
}
