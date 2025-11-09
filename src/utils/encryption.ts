import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(config.ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;

/**
 * Encrypt data using AES-256-CBC
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data using AES-256-CBC
 */
export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = parts.join(':');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      result += characters[byte % characters.length];
    }
  }
  
  return result;
}