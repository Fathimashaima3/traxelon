// const store = new Map();
// const OTP_TTL_MS = 5 * 60 * 1000;
// export const MAX_ATTEMPTS = 3;

// export function saveOtp(email, hashedOtp) {
//     const key = email.toLowerCase().trim();
//     store.set(key, { hashedOtp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
//     setTimeout(() => {
//         const entry = store.get(key);
//         if (entry && Date.now() >= entry.expiresAt) store.delete(key);
//     }, OTP_TTL_MS + 10000);
// }

// export function getOtp(email) {
//     const key = email.toLowerCase().trim();
//     const entry = store.get(key);
//     if (!entry) return null;
//     if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
//     return entry;
// }

// export function incrementAttempts(email) {
//     const key = email.toLowerCase().trim();
//     const entry = store.get(key);
//     if (!entry) return MAX_ATTEMPTS;
//     entry.attempts += 1;
//     store.set(key, entry);
//     return entry.attempts;
// }

// export function deleteOtp(email) {
//     store.delete(email.toLowerCase().trim());
// }

/**
 * otpStore.js
 * In-memory OTP store using a Map.
 * Each entry: { hashedOtp, expiresAt (ms epoch), attempts }
 *
 * Uses Node's built-in setTimeout to auto-clean expired entries.
 * For production scale, swap Map for Redis.
 */

const store = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

/**
 * Save a hashed OTP for an email.
 * Replaces any existing entry (resend scenario).
 */
export function saveOtp(email, hashedOtp) {
    const key = email.toLowerCase().trim();
    const expiresAt = Date.now() + OTP_TTL_MS;

    store.set(key, { hashedOtp, expiresAt, attempts: 0 });

    // Auto-cleanup after TTL + 10s buffer
    setTimeout(() => {
        const entry = store.get(key);
        if (entry && Date.now() >= entry.expiresAt) {
            store.delete(key);
        }
    }, OTP_TTL_MS + 10000);
}

/**
 * Get the current OTP entry for an email.
 * Returns null if not found or expired.
 */
export function getOtp(email) {
    const key = email.toLowerCase().trim();
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry;
}

/**
 * Increment the attempt counter for an email.
 * Returns the updated attempt count, or MAX_ATTEMPTS if exceeded.
 */
export function incrementAttempts(email) {
    const key = email.toLowerCase().trim();
    const entry = store.get(key);
    if (!entry) return MAX_ATTEMPTS;
    entry.attempts += 1;
    store.set(key, entry);
    return entry.attempts;
}

/**
 * Delete the OTP entry after successful verification.
 */
export function deleteOtp(email) {
    store.delete(email.toLowerCase().trim());
}

export { MAX_ATTEMPTS, OTP_TTL_MS };

