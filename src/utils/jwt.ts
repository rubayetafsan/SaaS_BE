import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { encrypt, decrypt } from './encryption';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate access token with encrypted payload
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const encryptedPayload = encrypt(JSON.stringify(payload));
  
  return jwt.sign(
    { data: encryptedPayload },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const encryptedPayload = encrypt(JSON.stringify(payload));
  
  return jwt.sign(
    { data: encryptedPayload },
    config.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as { data: string };
    const decryptedData = decrypt(decoded.data);
    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as { data: string };
    const decryptedData = decrypt(decoded.data);
    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as { data: string } | null;
    if (!decoded) return null;
    
    const decryptedData = decrypt(decoded.data);
    return JSON.parse(decryptedData);
  } catch (error) {
    return null;
  }
}