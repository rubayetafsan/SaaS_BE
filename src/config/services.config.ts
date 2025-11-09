// Single Source of Truth for Service Tiers

export interface ServiceTier {
  name: string;
  description: string;
  price: number;
  allowedAlgorithms: string[];
  rateLimit: number;
  ratePeriod: number; // in seconds
  stripePriceId?: string;
}

export const SERVICE_TIERS: Record<string, ServiceTier> = {
  GUEST: {
    name: 'Guest Access',
    description: 'Limited access for guest users - renews every 5 hours',
    price: 0,
    allowedAlgorithms: ['dataAnalysis', 'textAnalysis'],
    rateLimit: 20,
    ratePeriod: 3600, // 1 hour
  },
  BASIC: {
    name: 'Basic Plan',
    description: 'Access to basic algorithms with standard rate limits',
    price: 9.99,
    allowedAlgorithms: ['dataAnalysis', 'textAnalysis'],
    rateLimit: 100,
    ratePeriod: 3600,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
  },
  PRO: {
    name: 'Pro Plan',
    description: 'Access to advanced ML and analysis algorithms',
    price: 29.99,
    allowedAlgorithms: [
      'dataAnalysis',
      'textAnalysis',
      'mlPrediction',
      'sentimentAnalysis',
      'timeSeriesAnalysis',
    ],
    rateLimit: 500,
    ratePeriod: 3600,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    description: 'Full access to all algorithms with highest rate limits',
    price: 99.99,
    allowedAlgorithms: [
      'dataAnalysis',
      'textAnalysis',
      'mlPrediction',
      'sentimentAnalysis',
      'timeSeriesAnalysis',
      'recommendation',
      'linearRegression',
    ],
    rateLimit: 5000,
    ratePeriod: 3600,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
};

export const GUEST_ACCESS_DURATION = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
export const TRUSTED_DEVICE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const AVAILABLE_ALGORITHMS = [
  'dataAnalysis',
  'textAnalysis',
  'mlPrediction',
  'sentimentAnalysis',
  'timeSeriesAnalysis',
  'recommendation',
  'linearRegression',
] as const;

export type AlgorithmName = typeof AVAILABLE_ALGORITHMS[number];