import { Request, Response, NextFunction } from 'express';
import { z, ZodType, ZodError } from 'zod';

/**
 * Middleware to validate request body against a Zod schema
 */
export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
        });
      }
    }
  };
}

/**
 * Middleware to validate query parameters
 */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
        });
      }
    }
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Registration
  register: z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8).max(100),
  }),
  
  // Login
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string(),
    twoFactorCode: z.string().optional(),
  }),
  
  // Email verification
  verifyEmail: z.object({
    token: z.string().min(10),
  }),
  
  // 2FA setup
  enable2FA: z.object({
    token: z.string().length(6, '2FA code must be 6 digits'),
  }),
  
  // API key creation
  createApiKey: z.object({
    name: z.string().min(1).max(100),
  }),
  
  // Algorithm execution
  executeAlgorithm: z.object({
    algorithmName: z.string().min(1),
    data: z.any(),
  }),
  
  // Subscription
  subscribeToService: z.object({
    serviceId: z.string().min(1),
  }),
  
  // Update role
  updateUserRole: z.object({
    userId: z.string().min(1),
    role: z.enum(['OWNER', 'ADMIN', 'MAINTAINER', 'SUBSCRIBED_USER', 'GUEST']),
  }),
};