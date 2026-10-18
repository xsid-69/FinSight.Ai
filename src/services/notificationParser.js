// src/services/notificationParser.js

// Target Payment App Package Identifiers
export const TARGET_PAYMENT_PACKAGES = {
  'com.phonepe.app': 'PhonePe',
  'com.phonepe.app.business': 'PhonePe',
  'net.one97.paytm': 'Paytm',
  'com.paytm.business': 'Paytm',
  'in.amazon.mShop.android.shopping': 'Amazon Pay',
  'com.amazon.mShop.android.shopping': 'Amazon Pay',
  'in.amazon.pay': 'Amazon Pay',
  'com.google.android.apps.nbu.paisa.user': 'Google Pay',
  'com.cred.android': 'CRED',
  'com.dreamplug.cred': 'CRED',
  'com.dreamplug.cred.app': 'CRED',
  'in.org.npci.upiapp': 'BHIM UPI',
  'money.super.payments': 'Super.money',
  'money.super.app': 'Super.money',
  'money.super': 'Super.money',
  'com.supermoney': 'Super.money',
  'com.super.money': 'Super.money',
  'com.supermoney.app': 'Super.money',
  'com.navi.finance': 'Navi UPI',
  'com.navi.app': 'Navi UPI',
  'money.jupiter': 'Jupiter',
  'money.fi.app': 'Fi Money',
  'fi.money': 'Fi Money',
  'org.flipkart.slice': 'Slice',
  'indwin.c3.sharemoney': 'Slice',
  'com.mobikwik_new': 'MobiKwik',
  'com.mobikwik': 'MobiKwik',
  'com.freecharge.android': 'Freecharge',
  'com.tatadigital.tcp': 'Tata Neu',
  'com.fampay.in': 'FamPay',
  'in.kiwi.app': 'Kiwi UPI',
  'club.pop.app': 'POP Club',
  'com.bajajfinserv.direct': 'Bajaj Markets',
  'org.altruist.BajajExperia': 'Bajaj Finserv',
  'com.sbi.upi': 'SBI UPI',
  'com.sbi.lotusintouch': 'SBI YONO',
  'com.snapwork.hdfc': 'HDFC Bank',
  'com.hdfcbank.payzapp': 'PayZapp',
  'com.csam.icici.bank.imobile': 'ICICI iMobile',
  'com.axis.mobile': 'Axis Mobile',
  'com.upi.axispay': 'Axis Pay',
  'com.msf.kbank.mobile': 'Kotak 811',
  'com.pnb.pnbone': 'PNB ONE',
  'com.bob.bobworld': 'BoB World',
  'com.idfcfirstbank.optimus': 'IDFC First',
  'com.myairtelapp': 'Airtel Thanks',
  'com.android.shell': 'PhonePe',
  'android': 'PhonePe',
};

/**
 * Resolves source app name from package or content (with simulation support).
 */
export function resolveSourceAppName(app, combinedContent) {
  if (app && TARGET_PAYMENT_PACKAGES[app] && app !== 'com.android.shell' && app !== 'android') {
    return TARGET_PAYMENT_PACKAGES[app];
  }
  // Exclude social messaging apps to avoid false positives from chat messages
  if (app && /(?:whatsapp|telegram|instagram|facebook|twitter|discord)/i.test(app)) {
    return null;
  }
  if (/super\.?money|supermoney/i.test(combinedContent) || /super(?:\.payments|\.money|\.app|money)/i.test(app || '')) return 'Super.money';
  if (/phonepe/i.test(combinedContent) || /phonepe/i.test(app || '')) return 'PhonePe';
  if (/paytm/i.test(combinedContent) || /paytm/i.test(app || '')) return 'Paytm';
  if (/google pay|gpay|paisa/i.test(combinedContent) || /paisa|gpay/i.test(app || '')) return 'Google Pay';
  if (/amazon pay/i.test(combinedContent) || /amazon.*pay/i.test(app || '')) return 'Amazon Pay';
  if (/cred/i.test(combinedContent) || /cred/i.test(app || '')) return 'CRED';
  if (/bhim/i.test(combinedContent) || /bhim/i.test(app || '')) return 'BHIM UPI';
  if (/navi/i.test(combinedContent) || /navi/i.test(app || '')) return 'Navi UPI';
  if (/jupiter/i.test(combinedContent) || /jupiter/i.test(app || '')) return 'Jupiter';
  if (/fi money|fi\.app/i.test(combinedContent) || /fi\.app/i.test(app || '')) return 'Fi Money';
  if (/slice/i.test(combinedContent) || /slice/i.test(app || '')) return 'Slice';
  if (/mobikwik/i.test(combinedContent) || /mobikwik/i.test(app || '')) return 'MobiKwik';
  if (/freecharge/i.test(combinedContent) || /freecharge/i.test(app || '')) return 'Freecharge';
  if (/payzapp/i.test(combinedContent) || /payzapp/i.test(app || '')) return 'PayZapp';
  if (/sbi|yono/i.test(combinedContent) || /sbi/i.test(app || '')) return 'SBI';
  if (/hdfc/i.test(combinedContent) || /hdfc/i.test(app || '')) return 'HDFC Bank';
  if (/icici/i.test(combinedContent) || /icici/i.test(app || '')) return 'ICICI Bank';
  if (/axis/i.test(combinedContent) || /axis/i.test(app || '')) return 'Axis Bank';
  if (/kotak/i.test(combinedContent) || /kotak/i.test(app || '')) return 'Kotak Bank';

  // Fallback for any tracked package
  if (app && TARGET_PAYMENT_PACKAGES[app]) {
    return TARGET_PAYMENT_PACKAGES[app];
  }

  // Fallback for generic UPI apps (package contains upi, banking, payments, finance, pay)
  if (app && /(?:upi|payment|payments|payz|wallet|bank|finance)/i.test(app)) {
    return 'UPI App';
  }

  return null;
}

/**
 * Parses raw status-bar notifications into clean transaction objects.
 */
export function parseNotificationPayload(rawPayload) {
  if (!rawPayload) return null;
  let notificationData = rawPayload;
  if (typeof rawPayload === 'string') {
    try {
      notificationData = JSON.parse(rawPayload);
    } catch (e) {
      return null;
    }
  }

  const {
    app,
    title = '',
    titleBig = '',
    text = '',
    bigText = '',
    subText = '',
    summaryText = '',
    extraInfoText = '',
    tickerText = '',
    textLines = '',
    groupedMessages = [],
  } = notificationData || {};

  const groupedContent = Array.isArray(groupedMessages)
    ? groupedMessages.map((g) => `${g.title || ''} ${g.text || ''}`).join(' ')
    : '';

  const combinedContent = `${title} ${titleBig} ${text} ${bigText} ${subText} ${summaryText} ${extraInfoText} ${tickerText} ${textLines} ${groupedContent}`
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Target Package Filter: Only process recognized payment apps or payment content
  const sourceAppName = resolveSourceAppName(app, combinedContent);
  if (!sourceAppName) return null;

  // 2. Anti-Spam Filter: Ignore promotional ads, cashbacks offers, bill reminders, recharge promos
  const isSpam = /(cashback offer|flat off|discount|scratch card|bill due|win up to|recharge now|apply now|loan offer|pre-approved|rate us)/i.test(
    combinedContent
  );
  if (isSpam) return null;

  // 3. Determine Transaction Type (DEBIT vs CREDIT)
  const hasCreditClues = /(received from|received|credited by|credited to|credited with|credited|credit|deposited|refund of|refund|sent you|cashback of|cashback credited|cashback|money added|auto-credited)/i.test(
    combinedContent
  );
  const hasDebitClues = /(paid to|paid|sent to|debited by|debited for|debited with|debited|spent at|spent|transfer to|transferred to|purchased at|purchased|withdrawn|deducted|you paid)/i.test(
    combinedContent
  );

  let isCredit = false;
  let isDebit = false;

  if (hasCreditClues && !hasDebitClues) {
    isCredit = true;
  } else if (hasDebitClues && !hasCreditClues) {
    isDebit = true;
  } else if (hasCreditClues && hasDebitClues) {
    // Disambiguate when both appear (e.g. "Payment Received", "Priya sent you ₹1200", "Refund of ₹350 credited")
    if (/(sent you|received|credited|refund|cashback|deposited)/i.test(combinedContent)) {
      isCredit = true;
    } else {
      isDebit = true;
    }
  } else {
    // Fallback for general payment messages
    if (/(?:payment\s+(?:of|to)|sent\s+[\d₹RsINR]|transfer)/i.test(combinedContent)) {
      isDebit = true;
    }
  }

  if (!isDebit && !isCredit) return null;

  // 4. Extract Numerical Amount
  // Matches: ₹150, Rs. 150.00, INR 150, Rs 150, 150 INR, and terminal-encoded ?150
  const amountMatch =
    combinedContent.match(/(?:Rs\.?|INR|\u20b9|₹|\?)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    combinedContent.match(/(?:paid|payment|received|sent|spent|debited|credited|transferred)\s+(?:of|to|with)?\s*(?:Rs\.?|INR|\u20b9|₹|\?|\$)?\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    combinedContent.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|\u20b9|₹)/i);

  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // 5. Extract Merchant or Payee/Sender Name
  let merchant = sourceAppName;

  if (isDebit) {
    // E.g. "Paid ₹150 to Sharma Chai", "Payment of Rs 350 to Zomato successful", "Paid ₹150 to Sharma Tea Stall on PhonePe", "Payment to BESL Electricity bill of ₹1,820", "Paid ₹120 to Chai Point on Super.money"
    const debitMerchantMatch =
      combinedContent.match(/(?:paid to|payment to|transfer to|transferred to|sent to|to)\s+([A-Za-z0-9\s._&-]+?)(?=\s+(?:successful|via|using|from|on|of|bill|ref|vpa|\.|$)|$)/i) ||
      combinedContent.match(/(?:paid|spent|sent)\s+(?:Rs\.?|INR|\u20b9|₹|\?)\s*[\d,.]+\s+(?:at|to|for)\s+([A-Za-z0-9\s._&-]+?)(?=\s+(?:successful|via|using|from|on|of|ref|\.|$)|$)/i) ||
      combinedContent.match(/(?:Rs\.?|INR|\u20b9|₹|\?)\s*[\d,.]+\s+(?:paid to|sent to|transferred to|to)\s+([A-Za-z0-9\s._&-]+?)(?=\s+(?:successful|via|using|from|on|of|ref|\.|$)|$)/i) ||
      combinedContent.match(/(?:at|for)\s+([A-Za-z0-9\s._&-]+?)\s+(?:via|using|UPI-Ref|UPI Ref|\.|$)/i);
    if (debitMerchantMatch && debitMerchantMatch[1].trim().length > 1) {
      merchant = debitMerchantMatch[1].trim();
    }
  } else if (isCredit) {
    // E.g. "Received ₹500 from Rahul Verma", "Rahul sent you ₹250", "Priya Sharma sent you ₹1,200", "Refund of ₹350 from Swiggy credited by your bank"
    const creditSenderMatch =
      combinedContent.match(/(?:received from|from)\s+([A-Za-z0-9\s._&-]+?)(?=\s+(?:in|on|using|credited|by|via|\.|$)|$)/i) ||
      (text || bigText || title || combinedContent).match(/(?:^|:\s*|\s+)([A-Za-z0-9\s._&-]+?)\s+(?:sent you|transferred)/i);
    if (creditSenderMatch && creditSenderMatch[1].trim().length > 1) {
      merchant = creditSenderMatch[1].trim();
    }
  }

  // Clean trailing punctuation or noise from merchant
  merchant = merchant.replace(/[.,\s]+$/, '').trim();
  merchant = merchant.replace(/\s+(?:on|via|using)\s+[A-Za-z0-9._-]+$/i, '').trim();
  merchant = merchant.replace(/(?:₹|Rs\.?|INR|\?)\s*[\d,.]+/gi, '').trim();
  merchant = merchant.replace(/\s+to\s*$/i, '').trim();
  const appPrefixRegex = new RegExp(`^${sourceAppName}\\s+`, 'i');
  merchant = merchant.replace(appPrefixRegex, '').trim();

  // Guard against capturing currency amounts or noise words as merchant
  if (/^(?:Rs\.?|INR|\u20b9|\$|USD|\?|\d|payment|paid|sent|received)/i.test(merchant)) {
    merchant = sourceAppName;
  }

  if (!merchant || merchant.length < 2) {
    merchant = sourceAppName;
  }

  // 6. Tier-1 Categorization Engine
  const lowerMerchant = merchant.toLowerCase();
  let category = isCredit ? 'INCOME' : 'TRANSFER';
  if (/(zomato|swiggy|mcdonalds|kfc|dominos|burger|pizza|restaurant|cafe|chai|tea|bakery|food|dine|fruit|grocery|vegetable|meat|supermarket)/i.test(lowerMerchant)) {
    category = 'FOOD';
  } else if (/(uber|ola|rapido|irctc|metro|petrol|fuel|hpcl|bpcl|iocl|cab)/i.test(lowerMerchant)) {
    category = 'TRANSPORTATION';
  } else if (/(amazon|flipkart|myntra|zudio|trends|dmart|retail|store|mart|mall|shopping|bazaar)/i.test(lowerMerchant)) {
    category = 'SHOPPING';
  } else if (/(pvr|inox|bookmyshow|netflix|prime|spotify|hotstar|cinema|movie)/i.test(lowerMerchant)) {
    category = 'ENTERTAINMENT';
  } else if (/(electricity|airtel|jio|vi|besl|recharge|water|gas|bill|bescom|tneb)/i.test(lowerMerchant)) {
    category = 'UTILITIES';
  } else if (/(hospital|pharmacy|apollo|medplus|pharmeasy|clinic|doctor|health)/i.test(lowerMerchant)) {
    category = 'HEALTHCARE';
  }

  return {
    amount,
    type: isDebit ? 'DEBIT' : 'CREDIT',
    merchant,
    description: merchant,
    sanitizedDescription: merchant,
    category,
    sourceApp: sourceAppName,
    appPackage: app || 'com.phonepe.app',
    timestamp: Date.now(),
  };
}
