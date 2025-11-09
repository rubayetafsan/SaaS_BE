import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { config } from '../../config/env';

export const stripeRouter = Router();

/**
 * @swagger
 * /api/stripe/config:
 *   get:
 *     summary: Get Stripe publishable key
 *     tags: [Stripe]
 */
stripeRouter.get('/config', (_req, res) => {
  res.json({
    publishableKey: config.STRIPE_PUBLISHABLE_KEY,
  });
});

/**
 * @swagger
 * /api/stripe/create-checkout-session:
 *   post:
 *     summary: Create Stripe checkout session
 *     tags: [Stripe]
 *     security:
 *       - BearerAuth: []
 */
stripeRouter.post('/create-checkout-session', authenticate, (_req, res) => {
  res.json({ message: 'Create checkout session - implement handler' });
});

/**
 * @swagger
 * /api/stripe/create-payment-intent:
 *   post:
 *     summary: Create payment intent
 *     tags: [Stripe]
 *     security:
 *       - BearerAuth: []
 */
stripeRouter.post('/create-payment-intent', authenticate, (_req, res) => {
  res.json({ message: 'Create payment intent - implement handler' });
});

/**
 * @swagger
 * /api/stripe/subscriptions:
 *   get:
 *     summary: Get user subscriptions
 *     tags: [Stripe]
 *     security:
 *       - BearerAuth: []
 */
stripeRouter.get('/subscriptions', authenticate, (_req, res) => {
  res.json({ message: 'Get subscriptions - implement handler' });
});

/**
 * @swagger
 * /api/stripe/subscriptions/:id/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Stripe]
 *     security:
 *       - BearerAuth: []
 */
stripeRouter.post('/subscriptions/:id/cancel', authenticate, (_req, res) => {
  res.json({ message: 'Cancel subscription - implement handler' });
});

/**
 * @swagger
 * /api/stripe/subscriptions/:id/resume:
 *   post:
 *     summary: Resume subscription
 *     tags: [Stripe]
 *     security:
 *       - BearerAuth: []
 */
stripeRouter.post('/subscriptions/:id/resume', authenticate, (_req, res) => {
  res.json({ message: 'Resume subscription - implement handler' });
});

/**
 * @swagger
 * /api/stripe/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Stripe]
 */
stripeRouter.post('/webhook', (_req, res) => {
  res.json({ message: 'Stripe webhook - implement handler' });
});