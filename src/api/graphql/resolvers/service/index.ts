import { Context } from '../../../../types/context';

export const serviceResolvers = {
  Query: {
    // Get all active services (public endpoint)
    services: async (_: any, __: any, { prisma }: Context) => {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
      
      // Parse JSON allowedAlgorithms field
      return services.map((service: any) => ({
        ...service,
        allowedAlgorithms: JSON.parse(service.allowedAlgorithms),
      }));
    },
  },
};