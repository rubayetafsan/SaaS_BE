import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const servicesRouter = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all active services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of services
 */
servicesRouter.get('/', async (_req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    
    // Parse allowedAlgorithms JSON
    const parsedServices = services.map((service: any) => ({
      ...service,
      allowedAlgorithms: JSON.parse(service.allowedAlgorithms),
    }));
    
    res.json({
      success: true,
      services: parsedServices,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch services',
    });
  }
});

// Other service routes can be added here
servicesRouter.post('/subscribe', (_req, res) => {
  res.json({ message: 'Service subscription - implement handler' });
});

servicesRouter.get('/my-subscriptions', (_req, res) => {
  res.json({ message: 'My subscriptions - implement handler' });
});