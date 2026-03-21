import express from "express";
import bcrypt from "bcryptjs";
import {
    saveOtp,
    getOtp,
    deleteOtp,
    incrementAttempts,
    MAX_ATTEMPTS,
} from "../utils/otpStore.js";
import { sendOtpEmail } from "../utils/brevoService.js";
import { sendResetEmail } from "../utils/resetEmailService.js";
import { auth as adminAuth } from "../firebase/config.js";

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────

/** Generate a zero-padded 6-digit OTP string */
function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// ── POST /api/auth/send-otp ───────────────────────────────────
// Body: { email }
// Generates OTP, hashes with bcrypt, stores in memory, sends via Brevo.

router.post("/send-otp", async(req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes("@")) {
            return res.status(400).json({ error: "A valid email is required." });
        }

        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);

        saveOtp(email, hashedOtp); // store (replaces any existing)
        await sendOtpEmail(email, otp); // send via Brevo

        console.log(`[OTP] Sent to ${email}`);
        return res.status(200).json({ success: true, message: "OTP sent to your email." });

    } catch (err) {
        console.error("[POST /send-otp]", err.message);

        // Surface Brevo config errors clearly during development
        if (err.message.includes("BREVO_API_KEY") || err.message.includes("BREVO_SENDER_EMAIL")) {
            return res.status(500).json({ error: err.message });
        }

        return res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────
// Body: { email, otp }
// Validates OTP against hash, enforces expiry and max-attempt limit.

router.post("/verify-otp", async(req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required." });
        }

        const entry = getOtp(email);

        if (!entry) {
            return res.status(400).json({ error: "OTP expired or not found. Please request a new one." });
        }

        if (entry.attempts >= MAX_ATTEMPTS) {
            deleteOtp(email);
            return res.status(429).json({ error: "Too many incorrect attempts. Please request a new OTP." });
        }

        const isMatch = await bcrypt.compare(String(otp).trim(), entry.hashedOtp);

        if (!isMatch) {
            const attempts = incrementAttempts(email);
            const remaining = MAX_ATTEMPTS - attempts;
            return res.status(400).json({
                error: remaining > 0 ?
                    `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        // ✅ Valid — clean up and signal success
        deleteOtp(email);
        console.log(`[OTP] Verified for ${email}`);
        return res.status(200).json({ success: true, message: "Email verified successfully." });

    } catch (err) {
        console.error("[POST /verify-otp]", err.message);
        return res.status(500).json({ error: "Verification failed. Please try again." });
    }
});

// ── POST /api/auth/send-reset-email ──────────────────────────
router.post("/send-reset-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    // Generate a Firebase password-reset link via Admin SDK
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // Send it via your branded Brevo email instead of Firebase's default
    await sendResetEmail(email, resetLink);

    console.log(`[Reset] Password reset email sent to ${email}`);
    return res.status(200).json({ success: true, message: "Password reset email sent." });

  } catch (err) {
    console.error("[POST /send-reset-email]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;