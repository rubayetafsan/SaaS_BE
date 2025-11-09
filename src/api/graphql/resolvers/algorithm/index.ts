import { Context } from '../../../../types/context';
import { dataAnalysis } from '../../../../algorithms/dataAnalysis';
import { textAnalysis } from '../../../../algorithms/textAnalysis';
import { mlPrediction } from '../../../../algorithms/mlPrediction';
import { sentimentAnalysis } from '../../../../algorithms/sentimentAnalysis';
import { timeSeriesAnalysis } from '../../../../algorithms/timeSeriesAnalysis';
import { linearRegression } from '../../../../algorithms/linearRegression';
import { recommendation } from '../../../../algorithms/recommendation';

// Map algorithm names to functions
const algorithmMap: Record<string, any> = {
  dataAnalysis,
  textAnalysis,
  mlPrediction,
  sentimentAnalysis,
  timeSeriesAnalysis,
  linearRegression,
  recommendation,
};

export const algorithmResolvers = {
  Mutation: {
    executeAlgorithm: async (
      _: any,
      { algorithmName, data }: { algorithmName: string; data: any },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      // Validate algorithm name
      if (!algorithmName || typeof algorithmName !== 'string') {
        return {
          success: false,
          error: 'Algorithm name is required',
        };
      }
      
      // Check if algorithm exists
      const algorithm = algorithmMap[algorithmName];
      if (!algorithm) {
        return {
          success: false,
          error: `Algorithm '${algorithmName}' not found. Available algorithms: ${Object.keys(algorithmMap).join(', ')}`,
        };
      }
      
      // Get user with subscriptions
      const userWithSubs = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { service: true },
          },
        },
      });
      
      if (!userWithSubs) {
        return {
          success: false,
          error: 'User not found',
        };
      }
      
      // Handle guest users
      if (userWithSubs.role === 'GUEST') {
        // Check if guest access has expired
        if (userWithSubs.guestAccessExpiresAt && userWithSubs.guestAccessExpiresAt < new Date()) {
          return {
            success: false,
            error: 'Your guest access has expired. Please renew your guest access or subscribe to a plan.',
          };
        }
        
        // Guests can only use dataAnalysis and textAnalysis
        const guestAllowedAlgorithms = ['dataAnalysis', 'textAnalysis'];
        if (!guestAllowedAlgorithms.includes(algorithmName)) {
          return {
            success: false,
            error: `As a guest user, you can only use: ${guestAllowedAlgorithms.join(', ')}. Please subscribe to access more algorithms.`,
          };
        }
        
        // Execute algorithm for guest
        return algorithm(data);
      }
      
      // For non-guest users, check subscription
      const activeSubscription = userWithSubs.subscriptions.find(
        (sub: any) => sub.status === 'ACTIVE'
      );
      
      if (!activeSubscription) {
        return {
          success: false,
          error: 'No active subscription found. Please subscribe to a plan to use algorithms.',
        };
      }
      
      // Check if algorithm is allowed in user's plan
      const allowedAlgorithms = JSON.parse(activeSubscription.service.allowedAlgorithms);
      
      if (!allowedAlgorithms.includes(algorithmName)) {
        return {
          success: false,
          error: `Algorithm '${algorithmName}' is not available in your ${activeSubscription.service.name}. Available algorithms: ${allowedAlgorithms.join(', ')}. Consider upgrading your plan.`,
        };
      }
      
      // Execute algorithm
      try {
        const result = await algorithm(data);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to execute algorithm',
        };
      }
    },
  },
};