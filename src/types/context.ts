import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';

export const prisma = new PrismaClient();

export interface Context {
  req: Request;
  res: Response;
  user?: JWTPayload & { id: string };
  prisma: PrismaClient;
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  const context: Context = {
    req,
    res,
    prisma,
  };
  
  // Try to authenticate user from Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      context.user = { ...payload, id: payload.userId };
    } catch (error) {
      // Continue without authentication
    }
  }
  
  return context;
}