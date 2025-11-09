import nodemailer from 'nodemailer';
import { config } from '../config/env';

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  secure: config.EMAIL_SECURE,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD,
  },
});

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string
): Promise<void> {
  const verificationLinkUrl = `${config.BACKEND_URL}/api/auth/verify-email-link?token=${token}`;
  
  const mailOptions = {
    from: config.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email - SaaS Backend',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .code { background: #fff; padding: 15px; border: 2px dashed #667eea; border-radius: 5px; font-size: 24px; letter-spacing: 2px; text-align: center; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SaaS Backend!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}! 👋</h2>
            <p>Thank you for registering! Please verify your email address to activate your account.</p>
            
            <h3>Option 1: Click the button</h3>
            <a href="${verificationLinkUrl}" class="button">Verify Email Address</a>
            
            <h3>Option 2: Use this verification code</h3>
            <div class="code">${token.substring(0, 8).toUpperCase()}</div>
            
            <p><small>Or copy this link into your browser:</small></p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationLinkUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
              <p>&copy; 2025 SaaS Backend. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  await transporter.sendMail(mailOptions);
}

/**
 * Send 2FA enabled notification
 */
export async function send2FAEnabledEmail(
  email: string,
  username: string
): Promise<void> {
  const mailOptions = {
    from: config.EMAIL_FROM,
    to: email,
    subject: 'Two-Factor Authentication Enabled',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Two-Factor Authentication Enabled</h2>
          <p>Hi ${username},</p>
          <p>Two-factor authentication has been successfully enabled on your account.</p>
          <p>Your account is now more secure! You'll need to enter a code from your authenticator app each time you log in.</p>
          <p><strong>Important:</strong> Make sure you've saved your backup codes in a safe place.</p>
          <p>If you didn't enable this feature, please contact support immediately.</p>
          <hr>
          <p style="color: #999; font-size: 12px;">This is an automated security notification.</p>
        </div>
      </body>
      </html>
    `,
  };
  
  await transporter.sendMail(mailOptions);
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionEmail(
  email: string,
  username: string,
  serviceName: string,
  price: number
): Promise<void> {
  const mailOptions = {
    from: config.EMAIL_FROM,
    to: email,
    subject: `Subscription Confirmed - ${serviceName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🎉 Subscription Activated!</h2>
          <p>Hi ${username},</p>
          <p>Your subscription to <strong>${serviceName}</strong> has been confirmed.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Plan:</strong> ${serviceName}</p>
            <p><strong>Price:</strong> $${price}/month</p>
          </div>
          <p>You now have access to all features included in your plan!</p>
          <p>Thank you for your subscription! 🚀</p>
          <hr>
          <p style="color: #999; font-size: 12px;">Questions? Contact us at support@example.com</p>
        </div>
      </body>
      </html>
    `,
  };
  
  await transporter.sendMail(mailOptions);
}