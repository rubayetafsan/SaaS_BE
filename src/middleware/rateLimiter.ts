import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * General API rate limiter
 * 10,000 requests per hour
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication endpoints rate limiter
 * 100 requests per hour (stricter)
 */
export const authRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Guest user rate limiter
 * 20 requests per hour
 */
export const guestRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: 20,
  message: {
    success: false,
    message: 'Guest rate limit exceeded. Please upgrade your plan for higher limits.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Basic plan rate limiter
 * 100 requests per hour
 */
export const basicRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: 100,
  message: {
    success: false,
    message: 'Basic plan rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Pro plan rate limiter
 * 500 requests per hour
 */
export const proRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: 500,
  message: {
    success: false,
    message: 'Pro plan rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Enterprise plan rate limiter
 * 5000 requests per hour
 */
export const enterpriseRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: 5000,
  message: {
    success: false,
    message: 'Enterprise plan rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});