/**
 * Anti-Fake Bank SMS Parser & Sanitizer
 * Production-grade parser for Indian & Global Bank, Card, UPI, and Wallet transaction SMS formats
 * with 3-tier Anti-Fake/Anti-Fraud filters.
 */

// Comprehensive bank and financial institution identifiers
const BANK_REGEX = /(SBI|HDFC|ICICI|AXIS|PNB|BOB|PAYTM|GPAY|PHONEPE|YESB|CANARA|UNIONB|KOTAK|INDUS|IDFC|FED|RBL|BANDHAN|AUBL|AUBANK|CBIN|BOI|IOB|UCO|SCB|CITI|HSBC|DBS|BHIM|CRED|SLICE|JUPITER|FI|AMAZONPAY|MOBIKWIK|FREECHARGE|AIRTEL|PAYU|ONEPAY|UNI|STAN)/i;

const PHISHING_REGEX = /(https?:\/\/|bit\.ly|tinyurl\.com|claim-cashback|\.apk|reward-login|kyc-update|bank-blocked|claim-prize)/i;

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/**
 * 1. Anti-Fake Filter 1: Validates Bank Sender Header or institutional SMS format
 * Discards personal mobile numbers (+91XXXXXXXXXX or 10-digit).
 * Accepts official DLT alphanumeric sender IDs (e.g. VK-SBIINB, AD-HDFCBK, AXISBK, CP-IDFCFB)
 * or bank signatures in the message body.
 */
export function isValidBankSender(senderAddress, messageBody = '') {
  if (!senderAddress) {
    return BANK_REGEX.test(messageBody) || /(debited|credited|spent|withdrawn|a\/c|account|inr|rs\.)/i.test(messageBody);
  }

  const cleanedSender = senderAddress.replace(/[\s-]+/g, '');

  // Discard messages originating from personal 10-digit mobile numbers (+91XXXXXXXXXX or standard 10-digit)
  if (/^\+?91?[6-9]\d{9}$/.test(cleanedSender) || /^[6-9]\d{9}$/.test(cleanedSender)) {
    return false;
  }

  // Check known bank signatures in sender code
  if (BANK_REGEX.test(cleanedSender)) {
    return true;
  }

  // If sender has typical TRAI commercial header (e.g., VM-XXXXXX, 3-10 alphanumeric chars)
  // and body contains banking keywords, accept it
  const isInstitutionalSender = /^[A-Za-z0-9]{3,11}$/.test(cleanedSender);
  const containsBankingKeywords = /(debited|credited|spent|withdrawn|paid|received|a\/c|account|card|inr|rs\.?|\u20b9|upi|vpa|refno|utr|rrn)/i.test(messageBody);

  if (isInstitutionalSender && containsBankingKeywords) {
    return true;
  }

  // Check known bank signatures in message body
  return BANK_REGEX.test(messageBody);
}

/**
 * 2. Anti-Fake Filter 2: Checks for Phishing / Fraudulent Links
 */
export function containsPhishingLinks(text) {
  if (!text || typeof text !== 'string') return false;
  return PHISHING_REGEX.test(text);
}

/**
 * Helper to parse dates like "18Sep26", "18-Sep-2026", "18-09-2026", "24/09/24"
 */
export function parseSmsDate(messageBody) {
  const currentDate = new Date().toISOString().slice(0, 10);
  if (!messageBody) return currentDate;

  // Format 1: 18Sep26, 18-Sep-2026, 18 Sep 2026, 18-Sep-26
  const alphaDateMatch = messageBody.match(/(?:on date|on|dated)?\s*([0-9]{1,2})[-/\s]?([A-Za-z]{3})[-/\s]?([0-9]{2,4})/i);
  if (alphaDateMatch) {
    const day = alphaDateMatch[1].padStart(2, '0');
    const monthKey = alphaDateMatch[2].toLowerCase();
    const month = MONTH_MAP[monthKey];
    let year = alphaDateMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (month && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format 2: DD-MM-YYYY or DD/MM/YYYY or DD-MM-YY or DD/MM/YY
  const numDateMatch = messageBody.match(/(?:on date|on|dated)?\s*([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{2,4})/i);
  if (numDateMatch) {
    const day = numDateMatch[1].padStart(2, '0');
    const month = numDateMatch[2].padStart(2, '0');
    let year = numDateMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format 3: YYYY-MM-DD
  const isoDateMatch = messageBody.match(/\b([2-9]\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (isoDateMatch) {
    return isoDateMatch[0];
  }

  return currentDate;
}

/**
 * 3. Core Parser: Extracts fields matching SBI, HDFC, ICICI, Axis, Kotak, UPI, and Card formats
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

  // Filter 3: Discard pure OTPs and non-transactional alerts (unless it also contains debit/credit keywords)
  const isOtp = /(\botp\b|verification code|one time password|secret code)/i.test(messageBody);
  const isTransaction = /\b(debited|spent|paid|withdrawn|sent|transferred|credited|received|deposited|refunded|cashback)\b/i.test(messageBody);
  if (isOtp && !isTransaction) {
    return null;
  }

  // Determine Type (Debit vs Credit)
  const isDebit = /\b(debited|spent|paid|withdrawn|withdrawal|sent|transferred|trf to|transfer to|charged|deducted|auto-debit|purchase at|payment to|paid at|txn of)\b/i.test(messageBody);
  const isCredit = /\b(credited|credit|received|deposited|deposit|refunded|refund|cashback|reversal|reversed|salary|added to)\b/i.test(messageBody);
  if (!isDebit && !isCredit) return null;

  // Extract Amount:
  // Handles:
  // - "debited by 300.00", "debited by Rs. 300", "debited for INR 1,500.00"
  // - "Rs. 250", "Rs 250.50", "INR 1,200.50", "₹500.00"
  // - "spent Rs 450", "paid Rs 200", "Sent Rs. 350", "Txn of INR 120"
  let amount = 0;

  // Regex 1: Action followed by optional currency and amount
  const contextualMatch = messageBody.match(/(?:debited|credited|spent|paid|withdrawn|sent|transferred|deposit|refunded|cashback|txn of|payment of|auto-debit of|amount of)\s+(?:by|with|for|of)?\s*(?:(?:Rs\.?|INR|\u20b9|USD|\$)\s*)?([\d,]+(?:\.\d{1,2})?)/i);
  if (contextualMatch && contextualMatch[1]) {
    const parsed = parseFloat(contextualMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  // Regex 2: Currency symbol followed directly by amount
  if (!amount) {
    const currencyMatch = messageBody.match(/(?:Rs\.?|INR|\u20b9|USD|\$)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (currencyMatch && currencyMatch[1]) {
      const parsed = parseFloat(currencyMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  // Regex 3: Amount followed by currency and debit/credit
  if (!amount) {
    const reverseMatch = messageBody.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|\u20b9)?\s*(?:debited|credited|spent|withdrawn|deposited|transferred)/i);
    if (reverseMatch && reverseMatch[1]) {
      const parsed = parseFloat(reverseMatch[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  if (!amount || isNaN(amount) || amount <= 0) return null;

  // Extract Merchant / Payee / Description:
  let merchant = isDebit ? 'Bank Transfer' : 'Deposit / Credit';

  // Pattern A: "trf to Ramesh", "paid to Starbucks", "sent to John", "to VPA zomato@hdfcbank"
  const payeeMatch = messageBody.match(/(?:trf to|to VPA|paid to|sent to|transfer to|to info|to)\s+([A-Za-z0-9\s._@&-]+?)(?=\s+(?:Refno|Ref\s*no|Ref|on date|on|dated|via|using|bal|avail|avl|a\/c|\.|$))/i);
  if (payeeMatch && payeeMatch[1].trim().length > 1) {
    merchant = payeeMatch[1].trim();
  }

  // Pattern B: "spent on Card at STARBUCKS", "paid at SHELL", "at DMART"
  if (merchant === 'Bank Transfer' || merchant === 'Deposit / Credit') {
    const atMatch = messageBody.match(/(?:paid at|spent at|spent on .*? at|at)\s+([A-Za-z0-9\s._&-]+?)(?=\s+(?:on date|on|dated|via|using|card|bal|avail|avl|Refno|Ref|\.|$))/i);
    if (atMatch && atMatch[1].trim().length > 1) {
      merchant = atMatch[1].trim();
    }
  }

  // Pattern C: UPI Slash Formats:
  // e.g. "by UPI/Zomato/UPI-Ref 112233445566", "via UPI/Swiggy/1234", "Info: UPI/426819281729/Swiggy/Payment"
  if (merchant === 'Bank Transfer' || merchant === 'Deposit / Credit') {
    const upiSlashMatch = messageBody.match(/(?:Info[:\s]+|by\s+|via\s+)?UPI\/([A-Za-z0-9\s._-]+?)\/([A-Za-z0-9\s._-]+?)(?:\/|\s+(?:Bal|Tot Bal|Avl|UPI-?Ref|\.|$)|$)/i);
    if (upiSlashMatch) {
      const p1 = upiSlashMatch[1].trim();
      const p2 = upiSlashMatch[2].trim();
      if (!/^\d+$/.test(p1) && p1.length > 1) {
        merchant = p1;
      } else if (!/^\d+$/.test(p2) && !/^(UPI-?Ref|Ref|Txn|Payment)$/i.test(p2) && p2.length > 1) {
        merchant = p2;
      }
    }
  }

  // Pattern D: "towards Electricity bill", "for Netflix" (guard against currency amounts like "for Rs. 69.50")
  if (merchant === 'Bank Transfer' || merchant === 'Deposit / Credit') {
    const towardsMatch = messageBody.match(/(?:towards|for)\s+([A-Za-z0-9\s._&-]+?)(?=\s+(?:Refno|Ref\s*no|Ref|on date|on|dated|via|bal|a\/c|\.|$))/i);
    if (towardsMatch && towardsMatch[1].trim().length > 1) {
      const candidate = towardsMatch[1].trim();
      if (!/^(?:Rs\.?|INR|\u20b9|\$|USD|\d)/i.test(candidate)) {
        merchant = candidate;
      }
    }
  }

  // Clean merchant noise (e.g. "VPA Ramesh@upi" -> "Ramesh", remove trailing words and punctuation)
  merchant = merchant
    .replace(/^VPA\s+/i, '')
    .replace(/@[\w.-]+$/, '') // Clean UPI handle suffix
    .replace(/\s+(on|via|dated|effective|balance|bal)$/i, '')
    .replace(/[.,\s]+$/, '')
    .trim();

  // Guard against accidental currency capture
  if (/^(?:Rs\.?|INR|\u20b9|\$|USD|\d)/i.test(merchant)) {
    merchant = isDebit ? 'Bank Transfer' : 'Deposit / Credit';
  }

  if (!merchant || merchant.length < 2) {
    merchant = isDebit ? 'Bank Transfer' : 'Deposit / Credit';
  }

  // Extract 10 to 18-digit Reference Number (UTR / RRN / IMPS / Txn ID)
  let referenceNo = '';
  const refMatch = messageBody.match(/(?:Refno|Ref no|Ref|UTR|RRN|Txn\s*ID|Txn#|Transaction\s*ID|UPI\s*ref)\s*[:.]?\s*([A-Za-z0-9]{8,22})/i);
  if (refMatch) {
    referenceNo = refMatch[1].trim();
  }

  // Extract Masked Account / Card (e.g. "A/C X1131", "A/c *1234", "Card ending 1234", "AC **4321")
  let accountMask = 'Account';
  const endingMatch = messageBody.match(/(?:Card|A\/C|Account)\s+ending\s+(?:with\s+|in\s+)?([0-9]{4}|[A-Za-z0-9*X]{4})/i);
  if (endingMatch) {
    accountMask = `A/c *${endingMatch[1]}`;
  } else {
    const acctMatch = messageBody.match(/(?:A\/C|Acct|Account|Card)\s*(?:no\.?|ending)?\s*[:#]?\s*([A-Za-z0-9*X]+)/i);
    if (acctMatch) {
      accountMask = `A/c ${acctMatch[1]}`;
    }
  }

  // Extract Date
  const txnDate = parseSmsDate(messageBody);

  // Auto-Categorization (Tier 1 Local Regex)
  // Check merchant first, then fallback to message body if needed
  const lowerMerchant = merchant.toLowerCase();
  const lowerText = `${merchant} ${messageBody}`.toLowerCase();
  let category = 'TRANSFER';

  if (/\b(atm|cash withdrawal|atm cash)\b/i.test(lowerText) && isDebit) {
    category = 'CASH';
  } else if (/\b(zomato|swiggy|mcdonalds|kfc|dominos|starbucks|restaurant|cafe|bakery|dining|food|eats|burger|pizza|biryani|chai|tea|coffee)\b/i.test(lowerMerchant) || /\b(zomato|swiggy|dominos|mcdonalds|kfc|starbucks)\b/i.test(lowerText)) {
    category = 'FOOD';
  } else if (/\b(uber|ola|rapido|irctc|metro|petrol|fuel|hpcl|bpcl|iocl|shell|fastag|toll|railway|flight|indigo)\b/i.test(lowerMerchant) || /\b(uber|ola|rapido|petrol|fuel)\b/i.test(lowerText)) {
    category = 'TRANSPORTATION';
  } else if (/\b(amazon|flipkart|myntra|zudio|trends|dmart|blinkit|zepto|instamart|bigbasket|retail|supermarket|mall|grocery|shopping)\b/i.test(lowerMerchant) || /\b(amazon|flipkart|myntra|dmart|blinkit|zepto)\b/i.test(lowerText)) {
    category = 'SHOPPING';
  } else if (/\b(pvr|inox|bookmyshow|netflix|prime|spotify|hotstar|disney|youtube|cinema|movie|gaming)\b/i.test(lowerMerchant) || /\b(netflix|spotify|prime|pvr|bookmyshow)\b/i.test(lowerText)) {
    category = 'ENTERTAINMENT';
  } else if (/\b(electricity|airtel|jio|\bvi\b|vodafone|recharge|water|gas|besl|bill payment|broadband|wifi|utility)\b/i.test(lowerMerchant) || /\b(electricity|airtel|jio|recharge|besl)\b/i.test(lowerText)) {
    category = 'UTILITIES';
  } else if (/\b(pharmacy|apollo|hospital|clinic|medical|medplus|netmeds|1mg|doctor|health)\b/i.test(lowerMerchant)) {
    category = 'HEALTHCARE';
  } else if (isCredit && /\b(salary|payroll|bonus|wages|pension)\b/i.test(lowerText)) {
    category = 'INCOME';
  }


  // Unique deterministic document ID (prevents double logging)
  let docId;
  if (referenceNo) {
    docId = `ref_${referenceNo}`;
  } else {
    const rawFingerprint = `${senderAddress}_${txnDate}_${amount}_${accountMask || ''}_${merchant}`;
    let hash = 0;
    for (let i = 0; i < rawFingerprint.length; i++) {
      hash = ((hash << 5) - hash) + rawFingerprint.charCodeAt(i);
      hash |= 0;
    }
    const cleanHash = Math.abs(hash);
    docId = `sms_${amount}_${cleanHash}`;
  }

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

