import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config/env';

const prisma = new PrismaClient();
export const healthRouter = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns system health status and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 */
healthRouter.get('/', async (_req, res) => {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'connected';
    const dbResponseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: config.NODE_ENV,
      version: '1.0.0',
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`,
      },
      endpoints: {
        graphql: `${config.API_URL}/graphql`,
        health: `${config.API_URL}/health`,
        docs: config.NODE_ENV === 'development' ? `${config.API_URL}/docs` : undefined,
        api: {
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            verifyEmail: 'GET /api/auth/verify-email-link?token={token}',
            '2fa': {
              setup: 'POST /api/auth/2fa/setup',
              enable: 'POST /api/auth/2fa/enable',
              disable: 'POST /api/auth/2fa/disable',
            },
          },
          services: {
            list: 'GET /api/services',
            subscribe: 'POST /api/services/subscribe',
            mySubscriptions: 'GET /api/services/my-subscriptions',
          },
          apiKeys: {
            list: 'GET /api/api-keys',
            create: 'POST /api/api-keys/create',
            revoke: 'POST /api/api-keys/:id/revoke',
            delete: 'DELETE /api/api-keys/:id',
          },
          algorithms: {
            execute: 'POST /api/algorithms/execute',
          },
          users: {
            list: 'GET /api/users (Admin/Owner)',
            get: 'GET /api/users/:id',
            updateRole: 'PUT /api/users/:id/role (Admin/Owner)',
            delete: 'DELETE /api/users/:id (Admin/Owner)',
            renewGuest: 'POST /api/users/guest/renew',
          },
          stripe: {
            config: 'GET /api/stripe/config',
            checkout: 'POST /api/stripe/create-checkout-session',
            webhook: 'POST /api/stripe/webhook',
          },
        },
      },
      availableAlgorithms: [
        'dataAnalysis',
        'textAnalysis',
        'mlPrediction',
        'sentimentAnalysis',
        'timeSeriesAnalysis',
        'linearRegression',
        'recommendation',
      ],
      serviceTiers: [
        {
          name: 'Guest Access',
          price: 0,
          algorithms: 2,
          rateLimit: '20/hour',
        },
        {
          name: 'Basic Plan',
          price: 9.99,
          algorithms: 2,
          rateLimit: '100/hour',
        },
        {
          name: 'Pro Plan',
          price: 29.99,
          algorithms: 5,
          rateLimit: '500/hour',
        },
        {
          name: 'Enterprise Plan',
          price: 99.99,
          algorithms: 7,
          rateLimit: '5000/hour',
        },
      ],
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      message: error.message,
    });
  }
});