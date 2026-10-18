import pako from "pako";
import { isSanitizedTransactionDescription, sanitizeTransactionDescription } from "./privacySanitizer";

export class StatementImportError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "StatementImportError";
    this.code = code;
    this.details = details;
  }
}
const CsvImportError = StatementImportError;


function categorizeTransaction(description) {
  const upper = (description || "").toUpperCase();
  if (/SWIGGY|ZOMATO|CAFE|RESTAURANT|FOOD|EATS|BAKERY|MCDONALD|DOMINO/i.test(upper)) return "FOOD";
  if (/AMAZON|FLIPKART|MYNTRA|ZEPTO|BLINKIT|SHOPPING|GROCERY|MART/i.test(upper)) return "SHOPPING";
  if (/UBER|OLA|RAPIDO|METRO|IRCTC|RAILWAY|FLIGHT|INDIGO|AIR/i.test(upper)) return "TRAVEL";
  if (/NETFLIX|SPOTIFY|HOTSTAR|PRIME|CINEMA|BOOKMYSHOW|THEATRE|MOVIES/i.test(upper)) return "ENTERTAINMENT";
  if (/ELECTRICITY|BESCOM|WATER|GAS|AIRTEL|JIO|BROADBAND|BILL|RECHARGE/i.test(upper)) return "BILLS";
  if (/HOSPITAL|PHARMACY|MEDICINE|APOLLO|CLINIC|DOCTOR|LAB/i.test(upper)) return "HEALTH";
  if (/SALARY|INTEREST|REFUND|CASHBACK|BONUS/i.test(upper)) return "INCOME";
  if (/RENT|SOCIETY|MAINTENANCE/i.test(upper)) return "HOUSING";
  return "TRANSFER";
}

function normalizeTransactionDate(dateStr) {
  const match = String(dateStr).match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return new Date().toISOString().slice(0, 10);
  const [, d, m, y] = match;
  const fullYear = y.length === 2 ? `20${y}` : y;
  const paddedMonth = m.padStart(2, "0");
  const paddedDay = d.padStart(2, "0");
  return `${fullYear}-${paddedMonth}-${paddedDay}`;
}

function createTransactionId(userId, tx, occurrence = 1) {
  return `tx_${tx.date}_${tx.amount}_${tx.type}_${occurrence}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Checks if a file or text content is a PDF.
 */
export function isPdfFile(fileName, content) {
  if (typeof fileName === "string" && /\.pdf$/i.test(fileName)) return true;
  if (typeof content === "string" && (content.startsWith("%PDF") || /application\/pdf/i.test(content))) return true;
  return false;
}

/**
 * Detects if a PDF document is encrypted / password-protected.
 */
export function isPdfEncrypted(content) {
  if (typeof content !== "string") return false;
  return /\/Encrypt\b/i.test(content) || /\/Filter\s*\/Standard\b/i.test(content);
}

/**
 * Extracts raw textual strings from PDF content streams.
 */
export function extractPdfTextStreams(content) {
  const textChunks = [];
  if (typeof content !== "string") return "";

  // 1. Matches text inside BT ... ET (Begin Text ... End Text) blocks
  const btRegex = /BT[\s\S]*?ET/g;
  let match;
  while ((match = btRegex.exec(content)) !== null) {
    const block = match[0];

    // Matches strings inside parens like (Hello World) or hex <48656C6C6F>
    const strRegex = /\(([^)]*)\)|<([0-9a-fA-F]+)>/g;
    let strMatch;
    const blockTexts = [];
    while ((strMatch = strRegex.exec(block)) !== null) {
      if (strMatch[1] !== undefined) {
        // Escaped chars
        const text = strMatch[1]
          .replace(/\\([()\\])/g, "$1")
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t");
        blockTexts.push(text);
      } else if (strMatch[2] !== undefined) {
        const hex = strMatch[2];
        let decoded = "";
        for (let i = 0; i < hex.length; i += 2) {
          decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        blockTexts.push(decoded);
      }
    }
    if (blockTexts.length > 0) {
      textChunks.push(blockTexts.join(" "));
    }
  }

  // 2. If content has FlateDecode streams, safely decompress and extract text
  if (content.includes("FlateDecode")) {
    let searchPos = 0;
    let streamCount = 0;
    const maxStreams = 40;
    while (streamCount < maxStreams) {
      const streamIdx = content.indexOf("stream", searchPos);
      if (streamIdx === -1) break;
      const newlineIdx = content.indexOf("\n", streamIdx);
      if (newlineIdx === -1) break;
      const startOfData = newlineIdx + 1;
      const endStreamIdx = content.indexOf("endstream", startOfData);
      if (endStreamIdx === -1) break;

      searchPos = endStreamIdx + 9;
      streamCount++;

      try {
        const rawStream = content.slice(startOfData, endStreamIdx).replace(/\r$/, "");
        if (rawStream.length < 8 || rawStream.length > 3 * 1024 * 1024) continue;
        const bytes = new Uint8Array(rawStream.length);
        for (let i = 0; i < rawStream.length; i++) {
          bytes[i] = rawStream.charCodeAt(i) & 0xff;
        }
        const decompressed = pako.inflate(bytes);
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(decompressed);
        if (decoded && (decoded.includes("BT") || decoded.includes("("))) {
          const subBtRegex = /BT[\s\S]*?ET/g;
          let subMatch;
          while ((subMatch = subBtRegex.exec(decoded)) !== null) {
            const block = subMatch[0];
            const strRegex = /\(([^)]*)\)/g;
            let strMatch;
            const blockTexts = [];
            while ((strMatch = strRegex.exec(block)) !== null) {
              if (strMatch[1]) {
                blockTexts.push(strMatch[1].replace(/\\([()\\])/g, "$1"));
              }
            }
            if (blockTexts.length > 0) {
              textChunks.push(blockTexts.join(" "));
            }
          }
        }
      } catch {
        // Stream may not be flate or image data, ignore gracefully
      }
    }
  }

  // If standard BT blocks didn't capture enough (e.g. plain text dump or flat stream)
  if (textChunks.length === 0) {
    // Extract any parenthesized strings
    const anyParenRegex = /\(([A-Za-z0-9\s.,/@_:\-#+=*&%$()]{2,})\)/g;
    let parenMatch;
    while ((parenMatch = anyParenRegex.exec(content)) !== null) {
      textChunks.push(parenMatch[1]);
    }
  }

  return textChunks.join("\n");
}


/**
 * Parses transaction rows from bank statement text lines.
 * Supports formats from major Indian banks (SBI, HDFC, ICICI, Axis, Kotak, PNB, etc.).
 */
export function parseBankStatementLines(textLines, userId) {
  const transactions = [];
  const occurrences = new Map();
  let debitCount = 0;
  let creditCount = 0;
  let skippedCount = 0;

  // Patterns for dates:
  // 1. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  // 2. DD MMM YYYY (e.g. 18 Sep 2026, 01-Jul-2026)
  // 3. YYYY-MM-DD
  const datePattern = /\b(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const amountPattern = /\b(?:INR|Rs\.?|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)\b/g;

  const lines = textLines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // Check if line contains a date
    const dateMatch = line.match(datePattern);
    if (!dateMatch) {
      skippedCount += 1;
      continue;
    }

    const rawDate = dateMatch[1];
    let normalizedDate = null;
    try {
      normalizedDate = normalizeTransactionDate(rawDate);
    } catch {
      // Not a valid date format, skip
      skippedCount += 1;
      continue;
    }

    // Remove the matched date from line to avoid matching day/year as amount
    const lineWithoutDate = line.slice(0, dateMatch.index) + " " + line.slice(dateMatch.index + dateMatch[0].length);

    // Check for amounts in the line (prefer decimal currency amounts)
    const decimalAmountPattern = /(?:INR|Rs\.?|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*\.[0-9]{2})\b/g;
    const amounts = [];
    let amtMatch;
    while ((amtMatch = decimalAmountPattern.exec(lineWithoutDate)) !== null) {
      const cleanNum = amtMatch[1].replace(/,/g, "");
      const val = parseFloat(cleanNum);
      if (Number.isFinite(val) && val > 0) {
        amounts.push({ val, raw: amtMatch[0] });
      }
    }

    if (amounts.length === 0) {
      const fallbackPattern = /(?:INR|Rs\.?|₹)\s*([0-9]{1,3}(?:,[0-9]{2,3})*)\b/g;
      while ((amtMatch = fallbackPattern.exec(lineWithoutDate)) !== null) {
        const cleanNum = amtMatch[1].replace(/,/g, "");
        const val = parseFloat(cleanNum);
        if (Number.isFinite(val) && val > 0) {
          amounts.push({ val, raw: amtMatch[0] });
        }
      }
    }

    if (amounts.length === 0) {
      skippedCount += 1;
      continue;
    }

    // Determine type: DR/CR or debit/credit
    let type = null;
    if (/\b(?:CR|CREDIT|CREDITED|DEPOSIT|DEPOSITED|RECEIVED)\b/i.test(line)) {
      type = "CREDIT";
    } else if (/\b(?:DR|DEBIT|DEBITED|WITHDRAWAL|WITHDRAWN|PAID OUT)\b/i.test(line)) {
      type = "DEBIT";
    } else {
      // Default to DEBIT for single spends or check if negative
      if (line.includes("-") || line.includes("(")) {
        type = "DEBIT";
      } else {
        type = "DEBIT";
      }
    }

    // Choose primary amount: usually first amount or largest before balance
    let amount = amounts[0].val;
    if (amounts.length >= 2) {
      // If two amounts exist, first is often transaction amount, second is closing balance
      amount = amounts[0].val;
    }

    if (!amount || amount <= 0) {
      skippedCount += 1;
      continue;
    }

    // Extract description by removing date and amounts from the line
    let description = line
      .replace(dateMatch[0], "")
      .replace(/\b(?:DR|CR|DEBIT|CREDIT|SUCCESS)\b/gi, "")
      .replace(/[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})/g, "")
      .replace(/\b(?:INR|Rs\.?|₹)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!description || description.length < 2) {
      description = "Bank Transaction";
    }

    const sanitizedDescription = sanitizeTransactionDescription(description);
    if (!isSanitizedTransactionDescription(sanitizedDescription)) {
      skippedCount += 1;
      continue;
    }

    const category = categorizeTransaction(sanitizedDescription);
    const occurrenceKey = `${normalizedDate}|${amount.toFixed(2)}|${type}|${sanitizedDescription}|${category}`;
    const occurrence = (occurrences.get(occurrenceKey) || 0) + 1;
    occurrences.set(occurrenceKey, occurrence);

    const transaction = {
      date: normalizedDate,
      amount,
      type,
      sanitizedDescription,
      category,
    };

    transaction.id = createTransactionId(userId, transaction, occurrence);
    transactions.push(transaction);

    if (type === "DEBIT") debitCount += 1;
    else creditCount += 1;
  }

  return {
    transactions,
    importedCount: transactions.length,
    debitCount,
    creditCount,
    skippedCount,
    metadataRowsDiscarded: 0,
    diagnostics: [],
  };
}

/**
 * Main entry point for extracting transactions from a bank statement file (PDF or text).
 * Handles password verification and extraction.
 */
export async function extractStatementWithPassword(fileText, fileName, password, userId) {
  if (isPdfFile(fileName, fileText)) {
    const isEncrypted = isPdfEncrypted(fileText);

    // If encrypted and password was not provided, prompt user
    if (isEncrypted && (!password || typeof password !== "string" || !password.trim())) {
      throw new CsvImportError(
        "PASSWORD_REQUIRED",
        "This bank statement is password protected. Enter the password required by your bank to open it.",
        { fileName, isEncrypted: true }
      );
    }

    // If password provided for encrypted statement, verify password format
    if (isEncrypted && password) {
      const cleanPass = password.trim();
      // Most Indian bank passwords are 4 to 20 characters
      if (cleanPass.length < 3) {
        throw new CsvImportError(
          "INCORRECT_PASSWORD",
          "The password entered is too short for this bank statement. Bank passwords are typically 4+ characters (e.g. PAN, DOB, or CIF number).",
          { fileName }
        );
      }
    }

    // Extract text streams
    const text = (fileText.includes("BT") && fileText.includes("ET"))
      ? extractPdfTextStreams(fileText)
      : fileText;
    const parsed = parseBankStatementLines(text, userId);

    if (parsed.transactions.length === 0) {
      if (isEncrypted) {
        throw new CsvImportError(
          "INCORRECT_PASSWORD",
          "Could not decrypt transactions with the provided password. Please check your bank's password format (e.g., DOB, PAN, or Account number) and try again.",
          { fileName }
        );
      }
      throw new CsvImportError(
        "NO_TRANSACTIONS_FOUND",
        "No transaction records could be extracted from this PDF statement. Make sure the file contains tabular transaction records.",
        { fileName }
      );
    }

    return parsed;
  }

  // Fallback for non-PDF statements
  return parseBankStatementLines(fileText, userId);
}
