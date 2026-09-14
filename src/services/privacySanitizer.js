const LABELED_FINANCIAL_NUMBER =
  /\b((?:(?:bank|beneficiary)\s+)?(?:a\/?c|acct|account|card|cif|customer(?:\s+id)?)(?:\s*(?:number|no\.?|id|#))?\s*[:=\-]?\s*)(?:[x*]*\d[\d x*.-]{2,}\d)/gi;

const LABELED_REFERENCE =
  /\b((?:utr|rrn|reference|ref|transaction|txn|order|mandate)(?:\s*(?:number|no\.?|id|#))?\s*[:=\-]?\s*)([a-z0-9][a-z0-9./_-]{5,})\b/gi;

const PRIVATE_HANDLE = /\b[a-z0-9._%+-]{2,}@[a-z0-9.-]{2,}\b/gi;
const RESIDUAL_AT_SIGN = /@/g;
const IFSC_CODE = /\b[a-z]{4}0[a-z0-9]{6}\b/gi;
const PAN_CODE = /\b[a-z]{5}\d{4}[a-z]\b/gi;
const GSTIN_CODE = /\b\d{2}[a-z]{5}\d{4}[a-z]\d[a-z]\d\b/gi;

const TEN_DIGIT_PHONE =
  /(^|[^\d])(?:\+?91[\s.-]?)?(\d(?:[\s.-]?\d){9})(?!\d)/g;

const LONG_UNLABELED_NUMBER =
  /(^|[^\d])((?:\d[\s-]?){10,17}\d)(?!\d)/g;

// Mirrors the defense-in-depth identifier checks in firestore.rules.
const FIRESTORE_LONG_IDENTIFIER = /\d(?:[ .-]?\d){9}/;
const FIRESTORE_LABELED_IDENTIFIER =
  /(?:a\/?c|acct|account|card|cif|customer)(?:\s+(?:number|no\.?|id|#))?\s*[ :=-]*[x*]*\d[\d x*.-]{2,}\d/i;
const FIRESTORE_LABELED_REFERENCE =
  /(?:utr|rrn|reference|ref|transaction|txn|order|mandate)(?:\s*(?:number|no\.?|id|#))?\s*[ :=-]*[a-z0-9][a-z0-9._/-]{5,}/i;
const FIRESTORE_PRIVATE_HANDLE = /@/;
const FIRESTORE_IFSC_CODE = /\b[a-z]{4}0[a-z0-9]{6}\b/i;
const FIRESTORE_PAN_CODE = /\b[a-z]{5}\d{4}[a-z]\b/i;
const FIRESTORE_GSTIN_CODE = /\b\d{2}[a-z]{5}\d{4}[a-z]\d[a-z]\d\b/i;

export function normalizeTransactionDescription(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Scrubs common identifiers before a transaction can leave device memory.
 * Descriptions remain useful for merchant/category analysis while phone,
 * account, handle, tax, bank-code, and transfer-reference values are masked.
 */
export function sanitizeTransactionDescription(value) {
  let sanitized = normalizeTransactionDescription(value);
  if (!sanitized) return "";

  sanitized = sanitized
    .replace(PRIVATE_HANDLE, "PRIVATE_HANDLE")
    .replace(RESIDUAL_AT_SIGN, " ")
    .replace(GSTIN_CODE, "PRIVATE_TAX_ID")
    .replace(PAN_CODE, "PRIVATE_TAX_ID")
    .replace(IFSC_CODE, "PRIVATE_BANK_CODE")
    .replace(LABELED_REFERENCE, "REF XXXX")
    .replace(LABELED_FINANCIAL_NUMBER, (_match, label) => `${label}XXXX`);

  sanitized = sanitized.replace(
    TEN_DIGIT_PHONE,
    (_match, prefix, phoneWithSeparators) => {
      const digits = String(phoneWithSeparators).replace(/\D/g, "");
      return `${prefix}XXXXXX${digits.slice(-4)}`;
    },
  );

  sanitized = sanitized.replace(
    LONG_UNLABELED_NUMBER,
    (_match, prefix) => `${prefix}XXXX`,
  );

  return normalizeTransactionDescription(sanitized);
}

export function isFirestoreSafeTransactionDescription(value) {
  const normalized = normalizeTransactionDescription(value);
  return Boolean(normalized)
    && !FIRESTORE_LONG_IDENTIFIER.test(normalized)
    && !FIRESTORE_LABELED_IDENTIFIER.test(normalized)
    && !FIRESTORE_LABELED_REFERENCE.test(normalized)
    && !FIRESTORE_PRIVATE_HANDLE.test(normalized)
    && !FIRESTORE_IFSC_CODE.test(normalized)
    && !FIRESTORE_PAN_CODE.test(normalized)
    && !FIRESTORE_GSTIN_CODE.test(normalized);
}

export function isSanitizedTransactionDescription(value) {
  const normalized = normalizeTransactionDescription(value);
  return Boolean(normalized)
    && sanitizeTransactionDescription(normalized) === normalized
    && isFirestoreSafeTransactionDescription(normalized);
}
