// services/emailService.js
const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Initializes and returns a Nodemailer transporter.
 * If SMTP credentials exist in .env (e.g. EMAIL_USER & EMAIL_PASS), uses them.
 * Otherwise, generates an ephemeral Ethereal test inbox for free instant testing.
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = process.env.EMAIL_PORT || process.env.SMTP_PORT || 587;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
    console.log(`📧 Configured Nodemailer with active SMTP user: ${user}`);
    return cachedTransporter;
  }

  // Free Fallback: Create Ethereal test account (zero configuration required)
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`📧 [Ethereal Email] Initialized free test inbox: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn('⚠️ Could not create Ethereal test account, using JSON fallback transporter', err.message);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return cachedTransporter;
  }
}

/**
 * Sends a password reset OTP email with Ayurvedic styling.
 */
async function sendOTPEmail(toEmail, firstName, otp) {
  const transporter = await getTransporter();
  const senderAddress = process.env.EMAIL_FROM || '"JeevanHub Healthcare" <no-reply@jeevanhub.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f4eb; margin: 0; padding: 24px; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2ddd3; }
        .logo-badge { width: 52px; height: 52px; border-radius: 16px; background-color: #4a5c28; text-align: center; line-height: 52px; font-size: 24px; color: #f8f4eb; margin: 0 auto 16px; }
        .title { color: #2d3818; text-align: center; font-size: 22px; font-weight: 800; margin: 0 0 6px; }
        .subtitle { color: #6b6355; text-align: center; font-size: 13px; margin: 0 0 24px; }
        .otp-box { background-color: #eef2e3; border: 2px dashed #556b2f; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-number { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2d3818; font-family: monospace; }
        .text { color: #3d372e; font-size: 14px; line-height: 22px; margin: 12px 0; }
        .warning { color: #b45309; font-size: 12px; background: #fffbeb; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #f59e0b; margin-top: 20px; }
        .footer { text-align: center; font-size: 11px; color: #8c8273; margin-top: 28px; border-top: 1px solid #eef2e3; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo-badge">🌿</div>
        <h1 class="title">JeevanHub</h1>
        <p class="subtitle">Pure Ayurveda • Modern Healthcare</p>
        
        <p class="text">Namaste <strong>${firstName || 'Valued User'}</strong>,</p>
        <p class="text">We received a request to reset the password for your JeevanHub account. Use the verification code below to proceed:</p>
        
        <div class="otp-box">
          <div class="otp-number">${otp}</div>
        </div>
        
        <p class="text">This code is valid for <strong>15 minutes</strong>. If you did not request this password reset, please ignore this email and your account will remain secure.</p>
        
        <div class="warning">
          ⚠️ For your security, never share this OTP with anyone, including JeevanHub staff.
        </div>
        
        <div class="footer">
          © ${new Date().getFullYear()} JeevanHub Ayurvedic Healthcare Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: senderAddress,
    to: toEmail,
    subject: `Your JeevanHub Password Reset OTP: ${otp}`,
    text: `Namaste ${firstName || 'User'},\n\nYour JeevanHub password reset OTP is: ${otp}\n\nThis OTP is valid for 15 minutes.\n\nPure Ayurveda • Modern Healthcare`,
    html: htmlContent,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`\n========================================`);
  console.log(`✉️  [PASSWORD RESET OTP EMAIL DISPATCHED]`);
  console.log(`   To:          ${toEmail}`);
  console.log(`   OTP:         ${otp}`);
  if (previewUrl) {
    console.log(`   Preview URL: ${previewUrl}`);
  }
  console.log(`========================================\n`);

  return { info, previewUrl };
}

module.exports = {
  sendOTPEmail,
};
