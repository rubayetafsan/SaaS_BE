import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { hashData } from '../utils/encryption';

/**
 * Generate 2FA secret for user
 */
export function generate2FASecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code for 2FA setup
 */
export async function generate2FAQRCode(
  email: string,
  secret: string,
  appName: string = 'SaaS Backend'
): Promise<string> {
  const otpauth = authenticator.keyuri(email, appName, secret);
  return QRCode.toDataURL(otpauth);
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate backup codes (10 codes, 8 characters each)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => hashData(code));
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const codeHash = hashData(code);
  return hashedCodes.indexOf(codeHash);
}

/**
 * Remove used backup code
 */
export function removeBackupCode(hashedCodes: string[], index: number): string[] {
  const newCodes = [...hashedCodes];
  newCodes.splice(index, 1);
  return newCodes;
}

/**
 * Check if backup codes are running low
 */
export function areBackupCodesLow(hashedCodes: string[], threshold: number = 3): boolean {
  return hashedCodes.length <= threshold;
}