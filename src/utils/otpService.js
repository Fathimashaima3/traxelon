/**
 * otpService.js
 * Thin API wrappers for OTP-related backend calls.
 */

const BACKEND_URL =
    import.meta.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

/**
 * Ask the backend to generate and send an OTP to the given email.
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendOtp(email) {
    const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
    return data;
}

/**
 * Ask the backend to verify an OTP for the given email.
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function verifyOtp(email, otp) {
    const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "OTP verification failed.");
    return data;
}