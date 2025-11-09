import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  API_URL: process.env.API_URL || 'http://localhost:4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,

  // Owner Account
  OWNER_USERNAME: process.env.OWNER_USERNAME || 'owner',
  OWNER_EMAIL: process.env.OWNER_EMAIL || 'owner@onesaas.de',
  OWNER_PASSWORD: process.env.OWNER_PASSWORD || 'OneSaaS@2025',

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '465', 10),
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD!,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 3600000, // 1 hour
  RATE_LIMIT_MAX_REQUESTS: 10000,
  AUTH_RATE_LIMIT_MAX: 100,
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}