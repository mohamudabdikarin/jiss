// filepath: server/src/services/emailService.js
const nodemailer = require('nodemailer');
const { env } = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10) || 587,
    secure: env.SMTP_SECURE === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
  return transporter;
};

const sendMail = async ({ to, subject, text, html, cc }) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Email not configured — in development, check server logs for the code');
    return { sent: false, message: 'Email not configured' };
  }
  const from = env.EMAIL_FROM || env.SMTP_USER || 'noreply@ijcds.local';
  await transport.sendMail({ from, to, subject, text, html, cc });
  return { sent: true };
};

const sendPasswordResetCode = async (email, code, appName = 'IJCDS Admin') => {
  const transport = getTransporter();
  if (!transport) {
    console.log(`\n📧 [DEV] Password reset code for ${email}: ${code}\n`);
    return { sent: false };
  }
  const subject = `Password Reset Code - ${appName}`;
  const text = `Your password reset code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset</h2>
      <p>You requested a password reset for your ${appName} account.</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #003366;">${code}</p>
      <p style="color: #666; font-size: 14px;">This code expires in 15 minutes.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  const cc = env.ADMIN_EMAIL_CC ? env.ADMIN_EMAIL_CC.split(',').map(e => e.trim()).filter(Boolean) : undefined;
  return sendMail({ to: email, subject, text, html, cc });
};


module.exports = { sendMail, sendPasswordResetCode, getTransporter };
