import axios from "axios";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Send a branded password-reset email with the given Firebase reset link.
 * @param {string} toEmail
 * @param {string} resetLink  – Firebase-generated action URL
 */
export async function sendResetEmail(toEmail, resetLink) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Traxelon";

  if (!apiKey || apiKey === "your_brevo_api_key_here") {
    throw new Error("BREVO_API_KEY is not configured in backend .env");
  }
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is not configured in backend .env");
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Traxelon Password Reset</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { margin: 0; padding: 0; background-color: #060b14; font-family: 'Inter', Arial, sans-serif; width: 100%; }
    table { border-collapse: collapse; }
  </style>
</head>
<body style="margin:0; padding:0; background:#060b14; width:100%;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="width:100%; background:#060b14;">

    <!-- HEADER BAND -->
    <tr>
      <td align="center"
          style="background: linear-gradient(160deg, #0a1628 0%, #0d1f3c 55%, #091525 100%);
                 padding: 60px 48px 48px;
                 border-bottom: 2px solid rgba(0,212,255,0.2);">
        <div style="margin-bottom:24px;">
          <svg width="80" height="80" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="sg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1a3a5c"/>
                <stop offset="100%" stop-color="#0a1e33"/>
              </linearGradient>
            </defs>
            <circle cx="36" cy="36" r="36" fill="url(#sg)"/>
            <path d="M36 8 L58 18 L58 36 C58 50 47 61 36 65 C25 61 14 50 14 36 L14 18 Z"
                  fill="url(#sf)" stroke="#00d4ff" stroke-width="1.5" stroke-linejoin="round"/>
            <rect x="27" y="36" width="18" height="14" rx="2.5" fill="#00d4ff" opacity="0.9"/>
            <path d="M29.5 36 L29.5 31 C29.5 27.5 42.5 27.5 42.5 31 L42.5 36"
                  stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <circle cx="36" cy="41.5" r="2.2" fill="#0a1e33"/>
            <rect x="35" y="43" width="2" height="3.5" rx="1" fill="#0a1e33"/>
          </svg>
        </div>
        <h1 style="font-family:'Orbitron',monospace; font-size:30px; font-weight:900;
                    letter-spacing:8px; color:#e8f4ff; margin-bottom:8px;">
          TRAXELON
        </h1>
        <p style="font-size:11px; letter-spacing:4px; color:#00d4ff; font-weight:600;
                   text-transform:uppercase; font-family:'Inter',Arial,sans-serif;">
          Password Reset
        </p>
      </td>
    </tr>

    <!-- INTRO TEXT -->
    <tr>
      <td align="center" style="background:#0b1523; padding: 48px 64px 0;">
        <p style="font-size:16px; color:#8ba8c4; line-height:1.7;">
          We received a request to reset the password for your Traxelon account.<br/>
          Click the button below to choose a new password.<br/>
          This link is valid for <strong style="color:#c8dff0;">1 hour</strong> only.
        </p>
      </td>
    </tr>

    <!-- RESET BUTTON BAND -->
    <tr>
      <td style="background:#0b1523; padding: 40px 64px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center"
                style="background: linear-gradient(135deg, #0d1f38 0%, #091929 100%);
                       border-top: 1px solid rgba(0,212,255,0.4);
                       border-bottom: 1px solid rgba(0,212,255,0.4);
                       border-left: 4px solid #00d4ff;
                       border-right: 4px solid #00d4ff;
                       padding: 40px 24px;">
              <p style="font-size:10px; letter-spacing:4px; color:#4a7a9b;
                         text-transform:uppercase; margin-bottom:24px; font-weight:600;">
                Reset Your Password
              </p>
              <a href="${resetLink}"
                 style="display:inline-block;
                        font-family:'Orbitron',monospace;
                        font-size:14px;
                        font-weight:700;
                        letter-spacing:3px;
                        color:#060b14;
                        background: linear-gradient(135deg, #00d4ff 0%, #0099bb 100%);
                        padding: 16px 40px;
                        border-radius: 6px;
                        text-decoration: none;
                        text-transform: uppercase;
                        box-shadow: 0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.1);">
                RESET PASSWORD
              </a>
              <div style="height:2px; width:60%; margin:28px auto 0;
                           background:linear-gradient(90deg, transparent, #00d4ff, transparent);"></div>
              <p style="font-size:11px; color:#3a6a8a; margin-top:16px; line-height:1.6;">
                Or copy and paste this link into your browser:<br/>
                <span style="color:#4a8aaa; word-break:break-all;">${resetLink}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- WARNINGS -->
    <tr>
      <td style="background:#0b1523; padding: 0 64px 52px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:16px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width:32px; vertical-align:middle;"><span style="font-size:18px;">⏱</span></td>
                  <td style="font-size:14px; color:#7a9ab8; line-height:1.6; vertical-align:middle;">
                    This link <strong style="color:#a8c6e0;">expires in 1 hour</strong>.
                    Request a new one if it runs out.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width:32px; vertical-align:middle;"><span style="font-size:18px;">🔒</span></td>
                  <td style="font-size:14px; color:#7a9ab8; line-height:1.6; vertical-align:middle;">
                    If you did <strong style="color:#a8c6e0;">not request</strong> a password reset,
                    ignore this email — your account remains secure.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- DIVIDER -->
    <tr>
      <td style="background:#0b1523; padding:0; line-height:0; font-size:0;">
        <div style="height:1px; background:linear-gradient(90deg, transparent, rgba(0,212,255,0.35) 30%, rgba(0,212,255,0.35) 70%, transparent);"></div>
      </td>
    </tr>

    <!-- FOOTER BAND -->
    <tr>
      <td align="center"
          style="background: linear-gradient(160deg, #080f1c 0%, #060b14 100%);
                 padding: 40px 48px 40px;">
        <p style="font-family:'Orbitron',monospace; font-size:14px; font-weight:700;
                   letter-spacing:5px; color:#2a4a6a; margin-bottom:20px;">
          ◈ TRAXELON
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 24px;">
          <tr>
            <td style="padding:0 8px;">
              <div style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,212,255,0.2);
                          background:rgba(0,212,255,0.05);line-height:36px;text-align:center;font-size:15px;">⚡</div>
            </td>
            <td style="padding:0 8px;">
              <div style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,212,255,0.2);
                          background:rgba(0,212,255,0.05);line-height:36px;text-align:center;font-size:15px;">🛡</div>
            </td>
            <td style="padding:0 8px;">
              <div style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,212,255,0.2);
                          background:rgba(0,212,255,0.05);line-height:36px;text-align:center;font-size:15px;">🔍</div>
            </td>
          </tr>
        </table>
        <p style="font-size:12px; color:#1e3350; line-height:1.8; margin: 0 auto 10px;">
          This is an automated security email from Traxelon. If you did not request
          a password reset, please ignore this message — no action is required.
        </p>
        <p style="font-size:11px; color:#152840;">
          © ${new Date().getFullYear()} Traxelon · Law Enforcement Intelligence Tool
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
  `;

  try {
    await axios.post(
      BREVO_API_URL,
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: `Reset your Traxelon password`,
        htmlContent,
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10_000,
      }
    );
    console.log(`[Brevo] Password reset email sent to ${toEmail}`);
  } catch (err) {
    const status = err.response?.status;
    const brevoMsg = err.response?.data?.message || err.message;
    console.error(`[Brevo] HTTP ${status}:`, brevoMsg, JSON.stringify(err.response?.data || {}));
    throw new Error(`Brevo error (${status}): ${brevoMsg}`);
  }
}