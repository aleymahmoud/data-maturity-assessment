// src/lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp-relay.brevo.com
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // false for port 587
  auth: {
    user: process.env.SMTP_USER, // Your Brevo email
    pass: process.env.SMTP_PASSWORD, // Your Brevo SMTP key
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function generatePasswordResetEmail(resetUrl: string, username: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - ClientPlus</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #2563eb;">
        <h1 style="color: #2563eb; margin-bottom: 20px;">ClientPlus Password Reset</h1>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>We received a request to reset your password for your ClientPlus account. If you didn't request this, please ignore this email.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Your Password
          </a>
        </div>
        
        <p><strong>Security Information:</strong></p>
        <ul style="color: #666;">
          <li>This link will expire in 15 minutes</li>
          <li>This link can only be used once</li>
          <li>If the link doesn't work, copy and paste this URL into your browser: <br>
              <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; word-break: break-all;">${resetUrl}</code>
          </li>
        </ul>
        
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e5e7eb;">
        
        <p style="color: #666; font-size: 14px;">
          If you didn't request this password reset, please contact your administrator immediately.
          <br><br>
          Best regards,<br>
          ClientPlus Team
        </p>
      </div>
    </body>
    </html>
  `;
}