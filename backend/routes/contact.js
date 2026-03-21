//routes/contact.js
import express from "express";
import axios from "axios";

const router = express.Router();

// Contact form endpoint
router.post("/send", async (req, res) => {
  try {
    const { form, captchaToken, attachment } = req.body;

    // 1. Verify hCaptcha server-side
    if (!captchaToken) {
  return res.status(400).json({ error: "Please complete the captcha." });
}

const captchaResponse = await axios.post(
  "https://hcaptcha.com/siteverify",
  new URLSearchParams({
    secret: process.env.HCAPTCHA_SECRET,
    response: captchaToken,
  }),
  { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
);

if (!captchaResponse.data.success) {
  return res.status(400).json({ error: "Invalid captcha. Please try again." });
}

    // 2. Prepare email payload
    const emailPayload = {
      sender: { 
        name: process.env.BREVO_SENDER_NAME,  
        email: process.env.BREVO_SENDER_EMAIL, 
      },
      to: [{ 
        email: "shravanu.k887@gmail.com", 
        name: "Traxelon Team",
      }],
      subject: `[Traxelon Contact] ${form.subject}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="border-bottom: 2px solid #00d4ff; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="color: #00d4ff; margin: 0; font-size: 20px; letter-spacing: 2px;">TRAXELON — CONTACT FORM SUBMISSION</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; width: 120px;">Full Name</td><td style="padding: 8px 0; color: #e2e8f0;">${form.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Badge ID</td><td style="padding: 8px 0; color: #e2e8f0;">${form.badge || "Not provided"}</td></tr>
            <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</td><td style="padding: 8px 0; color: #00d4ff;">${form.email}</td></tr>
            <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Subject</td><td style="padding: 8px 0; color: #e2e8f0;">${form.subject}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #0f172a; border-radius: 8px; border-left: 3px solid #00d4ff;">
            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Message</p>
            <p style="color: #e2e8f0; margin: 0; line-height: 1.6;">${form.message}</p>
          </div>
          ${attachment ? `<p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">📎 Attachment: ${attachment.name}</p>` : ""}
          <p style="color: #475569; font-size: 11px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">This message was sent via the Traxelon Contact Form. All activity is logged.</p>
        </div>
      `,
    };

    // Add attachment if present
    if (attachment) {
      emailPayload.attachment = [
        {
          content: attachment.content,
          name: attachment.name,
        },
      ];
    }

    // 3. Send email via Brevo
    const brevoResponse = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY, // Add this to your .env
        },
      }
    );

    res.json({ 
      success: true, 
      message: "Contact form submitted successfully",
      messageId: brevoResponse.data.messageId 
    });

  } catch (error) {
    console.error("Contact form error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to send message. Please try again later." 
    });
  }
});

export default router;