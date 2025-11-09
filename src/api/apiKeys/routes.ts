import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

export const apiKeysRouter = Router();

// All API key routes require authentication
apiKeysRouter.use(authenticate);

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: List user's API keys
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 */
apiKeysRouter.get('/', (_req, res) => {
  res.json({ message: 'List API keys - implement handler' });
});

/**
 * @swagger
 * /api/api-keys/create:
 *   post:
 *     summary: Create new API key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 */
apiKeysRouter.post('/create', (_req, res) => {
  res.json({ message: 'Create API key - implement handler' });
});

/**
 * @swagger
 * /api/api-keys/:id/revoke:
 *   post:
 *     summary: Revoke API key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 */
apiKeysRouter.post('/:id/revoke', (_req, res) => {
  res.json({ message: 'Revoke API key - implement handler' });
});

/**
 * @swagger
 * /api/api-keys/:id:
 *   delete:
 *     summary: Delete API key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 */
apiKeysRouter.delete('/:id', (_req, res) => {
  res.json({ message: 'Delete API key - implement handler' });
});