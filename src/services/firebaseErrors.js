const ACCESS_CODES = new Set(["permission-denied"]);
const AUTH_CODES = new Set(["unauthenticated"]);
const NETWORK_CODES = new Set([
  "aborted",
  "cancelled",
  "deadline-exceeded",
  "network-request-failed",
  "resource-exhausted",
  "unavailable",
]);

function normalizeCode(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value
    .trim()
    .replace(/^(?:firestore|auth)\//i, "")
    .replace(/^firebase:/i, "")
    .toLowerCase();
}

/**
 * Firebase errors are often wrapped by the import/load services. Walk the safe
 * metadata chain without logging document contents, user IDs, or auth tokens.
 */
export function getFirebaseErrorCode(error) {
  let current = error;
  const visited = new Set();

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || visited.has(current)) break;
    visited.add(current);

    const firestoreCode = normalizeCode(current.firestoreCode);
    if (firestoreCode) return firestoreCode;

    const code = normalizeCode(current.code);
    if (code && !code.startsWith("firestore_")) return code;

    current = current.cause;
  }

  return null;
}

export function classifyFirebaseError(error) {
  const code = getFirebaseErrorCode(error);
  if (code && ACCESS_CODES.has(code)) {
    return { code, kind: "access", retryable: true };
  }
  if (code && AUTH_CODES.has(code)) {
    return { code, kind: "auth", retryable: true };
  }
  if (code && NETWORK_CODES.has(code)) {
    return { code, kind: "network", retryable: true };
  }
  return { code, kind: "unknown", retryable: true };
}

export function privateCloudReadMessage(subject, error) {
  const failure = classifyFirebaseError(error);

  if (failure.kind === "access") {
    return `Cloud access to ${subject} was denied. Your data remains protected. Verify the signed-in account and the app's Firebase project, App Check, and owner-only Firestore rules, then try again.`;
  }
  if (failure.kind === "auth") {
    return `Your secure session needs to be refreshed before ${subject} can be opened. Sign out, sign in again, and retry.`;
  }
  if (failure.kind === "network") {
    return `${subject} is temporarily unavailable because the cloud service could not be reached. Check your connection and try again.`;
  }
  return `${subject} could not be opened right now. Try again in a moment.`;
}

export function privateCloudSaveMessage(error) {
  const failure = classifyFirebaseError(error);

  if (failure.kind === "access") {
    return "Private cloud save was denied. No original statement file was uploaded; only sanitized extracted data is waiting on this screen. Verify the signed-in account and Firebase project, App Check, and owner-only Firestore rules, then retry.";
  }
  if (failure.kind === "auth") {
    return "Your secure session ended before private cloud save completed. The original statement file was not uploaded. Keep this analysis open while restoring access when possible; an app sign-in reset will remove this in-memory retry copy.";
  }
  if (failure.kind === "network") {
    return "The private cloud service could not be reached. Your sanitized analysis is still available on this screen; reconnect and retry without selecting the CSV again.";
  }
  return "The private cloud save did not finish. Your sanitized analysis is still available on this screen and can be retried without selecting the CSV again.";
}
