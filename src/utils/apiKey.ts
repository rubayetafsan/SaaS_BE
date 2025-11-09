import crypto from 'crypto';
import { hashData } from './encryption';

/**
 * Generate a secure API key
 * Format: sk_live_{64_random_hex_characters}
 */
export function generateApiKey(): {
  key: string;
  keyHash: string;
  keyPrefix: string;
} {
  // Generate 32 random bytes (will be 64 hex characters)
  const randomBytes = crypto.randomBytes(32);
  const randomHex = randomBytes.toString('hex');
  
  // Create key with standard format
  const key = `sk_live_${randomHex}`;
  
  // Hash the key for storage (one-way hash)
  const keyHash = hashData(key);
  
  // Create display prefix (first 15 characters + ...)
  const keyPrefix = `${key.substring(0, 15)}...`;
  
  return { key, keyHash, keyPrefix };
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Must start with sk_live_ and have exactly 64 hex characters after
  const pattern = /^sk_live_[a-f0-9]{64}$/;
  return pattern.test(key);
}

/**
 * Extract key prefix for display
 */
export function getKeyPrefix(key: string): string {
  return `${key.substring(0, 15)}...`;
}

/**
 * Generate test API key (for development)
 */
export function generateTestApiKey(): {
  key: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomBytes = crypto.randomBytes(32);
  const randomHex = randomBytes.toString('hex');
  
  const key = `sk_test_${randomHex}`;
  const keyHash = hashData(key);
  const keyPrefix = `${key.substring(0, 16)}...`;
  
  return { key, keyHash, keyPrefix };
}