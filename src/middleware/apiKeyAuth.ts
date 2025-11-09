import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashData } from '../utils/encryption';
import { isValidApiKeyFormat } from '../utils/apiKey';

const prisma = new PrismaClient();

// Type for user with subscriptions
type UserWithSubscriptions = {
  id: string;
  username: string;
  email: string;
  encryptedEmail: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  backupCodes: string | null;
  guestAccessExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  subscriptions: Array<{
    id: string;
    userId: string;
    serviceId: string;
    status: string;
    startDate: Date;
    expiresAt: Date | null;
    cancelledAt: Date | null;
    renewCount: number;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    paymentMethod: string | null;
    createdAt: Date;
    updatedAt: Date;
    service: {
      id: string;
      name: string;
      description: string;
      price: number;
      allowedAlgorithms: string;
      rateLimit: number;
      ratePeriod: number;
      stripePriceId: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
};

export interface ApiKeyRequest extends Request {
  userId?: string;
  apiKeyId?: string;
  user?: UserWithSubscriptions;
}

/**
 * Middleware to authenticate API key from X-API-Key header
 */
export async function authenticateApiKey(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key is required. Include it in the X-API-Key header.',
      });
      return;
    }
    
    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key format. API keys should start with sk_live_ followed by 64 hexadecimal characters.',
      });
      return;
    }
    
    // Hash the API key to look it up in database
    const keyHash = hashData(apiKey);
    
    // Find the API key in database
    const key = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { service: true },
            },
          },
        },
      },
    });
    
    if (!key) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key. Please check your key and try again.',
      });
      return;
    }
    
    // Check if key is revoked
    if (key.isRevoked) {
      res.status(401).json({
        success: false,
        message: 'This API key has been revoked. Please create a new one.',
      });
      return;
    }
    
    // Check if key has expired
    if (key.expiresAt && key.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        message: 'This API key has expired. Please create a new one.',
      });
      return;
    }
    
    // Check if user still exists and is verified
    if (!key.user) {
      res.status(401).json({
        success: false,
        message: 'User associated with this API key not found.',
      });
      return;
    }
    
    if (!key.user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email before using API keys.',
      });
      return;
    }
    
    // Update API key usage statistics (async, don't wait)
    prisma.apiKey
      .update({
        where: { id: key.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 },
        },
      })
      .catch((err: any) => console.error('Failed to update API key usage:', err));
    
    // Attach user and key info to request
    req.userId = key.userId;
    req.apiKeyId = key.id;
    req.user = key.user;
    
    next();
  } catch (error: any) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
}

/**
 * Middleware to check if user has permission for specific algorithm
 */
export function requireAlgorithmAccess(algorithmName: string) {
  return async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      
      // Handle guest users
      if (req.user.role === 'GUEST') {
        const guestAllowedAlgorithms = ['dataAnalysis', 'textAnalysis'];
        
        // Check guest access expiry
        if (req.user.guestAccessExpiresAt && req.user.guestAccessExpiresAt < new Date()) {
          res.status(403).json({
            success: false,
            message: 'Your guest access has expired. Please renew or subscribe.',
          });
          return;
        }
        
        if (!guestAllowedAlgorithms.includes(algorithmName)) {
          res.status(403).json({
            success: false,
            message: `Guest users can only access: ${guestAllowedAlgorithms.join(', ')}. Please subscribe for more algorithms.`,
            availableAlgorithms: guestAllowedAlgorithms,
          });
          return;
        }
        
        next();
        return;
      }
      
      // For subscribed users, check their plan
      const activeSubscription = req.user.subscriptions.find(
        sub => sub.status === 'ACTIVE'
      );
      
      if (!activeSubscription) {
        res.status(403).json({
          success: false,
          message: 'No active subscription. Please subscribe to use this algorithm.',
        });
        return;
      }
      
      // Check if algorithm is allowed in subscription
      const allowedAlgorithms = JSON.parse(activeSubscription.service.allowedAlgorithms);
      
      if (!allowedAlgorithms.includes(algorithmName)) {
        res.status(403).json({
          success: false,
          message: `Algorithm '${algorithmName}' is not available in your plan.`,
          availableAlgorithms: allowedAlgorithms,
          currentPlan: activeSubscription.service.name,
        });
        return;
      }
      
      next();
    } catch (error: any) {
      console.error('Algorithm access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify algorithm access',
      });
    }
  };
}