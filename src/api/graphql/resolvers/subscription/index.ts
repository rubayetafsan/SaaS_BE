import { Context } from '../../../../types/context';
import { sendSubscriptionEmail } from '../../../../services/emailService';

export const subscriptionResolvers = {
  Query: {
    mySubscriptions: async (_: any, __: any, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id },
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      });
      
      // Parse allowedAlgorithms JSON
      return subscriptions.map((sub: any) => ({
        ...sub,
        service: {
          ...sub.service,
          allowedAlgorithms: JSON.parse(sub.service.allowedAlgorithms),
        },
      }));
    },
    
    mySubscriptionHistory: async (_: any, __: any, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id },
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      });
      
      const parsedSubscriptions = subscriptions.map((sub: any) => ({
        ...sub,
        service: {
          ...sub.service,
          allowedAlgorithms: JSON.parse(sub.service.allowedAlgorithms),
        },
      }));
      
      const total = subscriptions.length;
      const active = subscriptions.filter((s: any) => s.status === 'ACTIVE').length;
      const cancelled = subscriptions.filter((s: any) => s.status === 'CANCELLED').length;
      const expired = subscriptions.filter((s: any) => s.status === 'EXPIRED').length;
      
      return {
        total,
        active,
        cancelled,
        expired,
        subscriptions: parsedSubscriptions,
      };
    },
  },
  
  Mutation: {
    subscribeToService: async (
      _: any,
      { serviceId }: { serviceId: string },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      
      if (!service) throw new Error('Service not found');
      
      if (!service.isActive) {
        throw new Error('This service is not currently available');
      }
      
      // Check for existing active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE',
        },
        include: { service: true },
      });
      
      if (existingSubscription) {
        throw new Error(`You already have an active ${existingSubscription.service.name} subscription. Please cancel it before subscribing to a new plan.`);
      }
      
      // Create subscription (in real app, this would be done after Stripe payment)
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          serviceId,
          status: 'ACTIVE',
          startDate: new Date(),
          paymentMethod: 'manual', // In production, this comes from Stripe
        },
        include: { service: true },
      });
      
      // Update user role if they were a guest
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (dbUser?.role === 'GUEST') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'SUBSCRIBED_USER',
            guestAccessExpiresAt: null,
          },
        });
      }
      
      // Send confirmation email
      if (dbUser) {
        try {
          await sendSubscriptionEmail(
            dbUser.email,
            dbUser.username,
            service.name,
            service.price
          );
        } catch (error) {
          console.error('Failed to send subscription email:', error);
        }
      }
      
      return {
        ...subscription,
        service: {
          ...subscription.service,
          allowedAlgorithms: JSON.parse(subscription.service.allowedAlgorithms),
        },
      };
    },
    
    cancelSubscription: async (
      _: any,
      { subscriptionId }: { subscriptionId: string },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { service: true },
      });
      
      if (!subscription) throw new Error('Subscription not found');
      
      // Check permissions - users can cancel their own, admins can cancel any
      if (subscription.userId !== user.id && !['OWNER', 'ADMIN', 'MAINTAINER'].includes(user.role)) {
        throw new Error('Insufficient permissions to cancel this subscription');
      }
      
      if (subscription.status !== 'ACTIVE') {
        throw new Error('Subscription is not active');
      }
      
      // Cancel subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: { service: true },
      });
      
      // If user has no other active subscriptions, downgrade to guest
      const otherActiveSubscriptions = await prisma.subscription.count({
        where: {
          userId: subscription.userId,
          status: 'ACTIVE',
          id: { not: subscriptionId },
        },
      });
      
      if (otherActiveSubscriptions === 0) {
        const fiveHoursFromNow = new Date(Date.now() + 5 * 60 * 60 * 1000);
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            role: 'GUEST',
            guestAccessExpiresAt: fiveHoursFromNow,
          },
        });
      }
      
      return {
        ...updatedSubscription,
        service: {
          ...updatedSubscription.service,
          allowedAlgorithms: JSON.parse(updatedSubscription.service.allowedAlgorithms),
        },
      };
    },
  },
};