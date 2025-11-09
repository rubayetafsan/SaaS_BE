import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: JWTPayload & { id: string };
}

/**
 * Verify JWT token middleware
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isEmailVerified: true },
    });
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource',
      });
      return;
    }
    
    req.user = { ...payload, id: payload.userId };
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid token',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      req.user = { ...payload, id: payload.userId };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}