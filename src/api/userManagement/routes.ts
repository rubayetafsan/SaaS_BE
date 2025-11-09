import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleAuth';

export const userManagementRouter = Router();

// All routes require authentication
userManagementRouter.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (Admin/Owner only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
userManagementRouter.get('/', requireRole('ADMIN', 'OWNER'), (_req, res) => {
  res.json({ message: 'List users - implement handler' });
});

/**
 * @swagger
 * /api/users/:id:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
userManagementRouter.get('/:id', (_req, res) => {
  res.json({ message: 'Get user - implement handler' });
});

/**
 * @swagger
 * /api/users/:id/role:
 *   put:
 *     summary: Update user role (Admin/Owner only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
userManagementRouter.put('/:id/role', requireRole('ADMIN', 'OWNER'), (_req, res) => {
  res.json({ message: 'Update user role - implement handler' });
});

/**
 * @swagger
 * /api/users/:id:
 *   delete:
 *     summary: Delete user (Admin/Owner only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
userManagementRouter.delete('/:id', requireRole('ADMIN', 'OWNER'), (_req, res) => {
  res.json({ message: 'Delete user - implement handler' });
});

/**
 * @swagger
 * /api/users/guest/renew:
 *   post:
 *     summary: Renew guest access
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
userManagementRouter.post('/guest/renew', (_req, res) => {
  res.json({ message: 'Renew guest access - implement handler' });
});