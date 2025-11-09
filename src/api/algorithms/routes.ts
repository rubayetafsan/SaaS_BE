import { Router } from 'express';
import { authenticateApiKey, ApiKeyRequest } from '../../middleware/apiKeyAuth';
import { validate, schemas } from '../../middleware/validate';
import { dataAnalysis } from '../../algorithms/dataAnalysis';
import { textAnalysis } from '../../algorithms/textAnalysis';
import { mlPrediction } from '../../algorithms/mlPrediction';
import { sentimentAnalysis } from '../../algorithms/sentimentAnalysis';
import { timeSeriesAnalysis } from '../../algorithms/timeSeriesAnalysis';
import { linearRegression } from '../../algorithms/linearRegression';
import { recommendation } from '../../algorithms/recommendation';

export const algorithmsRouter = Router();

// Map algorithm names to their functions
const algorithmMap: Record<string, any> = {
  dataAnalysis,
  textAnalysis,
  mlPrediction,
  sentimentAnalysis,
  timeSeriesAnalysis,
  linearRegression,
  recommendation,
};

/**
 * @swagger
 * /api/algorithms/execute:
 *   post:
 *     summary: Execute an algorithm
 *     description: Execute a specific algorithm with provided data
 *     tags: [Algorithms]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - algorithmName
 *               - data
 *             properties:
 *               algorithmName:
 *                 type: string
 *                 enum: [dataAnalysis, textAnalysis, mlPrediction, sentimentAnalysis, timeSeriesAnalysis, linearRegression, recommendation]
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Algorithm executed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid or missing API key
 *       403:
 *         description: Algorithm not available in your plan
 */
algorithmsRouter.post(
  '/execute',
  authenticateApiKey,
  validate(schemas.executeAlgorithm),
  async (req: ApiKeyRequest, res) => {
    try {
      const { algorithmName, data } = req.body;
      
      // Get algorithm function
      const algorithm = algorithmMap[algorithmName];
      
      if (!algorithm) {
        res.status(404).json({
          success: false,
          message: `Algorithm '${algorithmName}' not found`,
          availableAlgorithms: Object.keys(algorithmMap),
        });
        return;
      }
      
      // Check user permissions
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      
      // Handle guest users
      if (req.user.role === 'GUEST') {
        const guestAllowedAlgorithms = ['dataAnalysis', 'textAnalysis'];
        
        // Check guest access expiry
        if (req.user.guestAccessExpiresAt && req.user.guestAccessExpiresAt < new Date()) {
          res.status(403).json({
            success: false,
            message: 'Your guest access has expired. Please renew your access or subscribe to a plan.',
          });
          return;
        }
        
        if (!guestAllowedAlgorithms.includes(algorithmName)) {
          res.status(403).json({
            success: false,
            message: `Guest users can only access: ${guestAllowedAlgorithms.join(', ')}`,
            availableAlgorithms: guestAllowedAlgorithms,
            upgrade: 'Subscribe to access more algorithms',
          });
          return;
        }
        
        // Execute algorithm for guest
        const result = await algorithm(data);
        res.json(result);
        return;
      }
      
      // For subscribed users, check their active subscription
      const activeSubscription = req.user.subscriptions.find(
        (sub: any) => sub.status === 'ACTIVE'
      );
      
      if (!activeSubscription) {
        res.status(403).json({
          success: false,
          message: 'No active subscription found. Please subscribe to a plan to use algorithms.',
        });
        return;
      }
      
      // Check if algorithm is allowed in user's plan
      const allowedAlgorithms = JSON.parse(activeSubscription.service.allowedAlgorithms);
      
      if (!allowedAlgorithms.includes(algorithmName)) {
        res.status(403).json({
          success: false,
          message: `Algorithm '${algorithmName}' is not available in your ${activeSubscription.service.name}`,
          availableAlgorithms: allowedAlgorithms,
          currentPlan: activeSubscription.service.name,
          suggestion: 'Upgrade your plan to access more algorithms',
        });
        return;
      }
      
      // Execute algorithm
      const result = await algorithm(data);
      res.json(result);
      
    } catch (error: any) {
      console.error('Algorithm execution error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute algorithm',
      });
    }
  }
);

/**
 * @swagger
 * /api/algorithms/list:
 *   get:
 *     summary: List all available algorithms
 *     description: Get a list of all available algorithms with descriptions
 *     tags: [Algorithms]
 *     responses:
 *       200:
 *         description: List of algorithms
 */
algorithmsRouter.get('/list', (_req, res) => {
  res.json({
    success: true,
    algorithms: [
      {
        name: 'dataAnalysis',
        description: 'Statistical analysis of numerical data (sum, average, min, max, median, stdDev)',
        requiredInput: { numbers: 'number[]' },
        availableIn: ['Guest', 'Basic', 'Pro', 'Enterprise'],
      },
      {
        name: 'textAnalysis',
        description: 'Text analysis (word count, character count, sentence count, average word length)',
        requiredInput: { text: 'string' },
        availableIn: ['Guest', 'Basic', 'Pro', 'Enterprise'],
      },
      {
        name: 'mlPrediction',
        description: 'Machine learning prediction using weighted features',
        requiredInput: { features: 'number[]', weights: 'number[]' },
        availableIn: ['Pro', 'Enterprise'],
      },
      {
        name: 'sentimentAnalysis',
        description: 'Analyze sentiment of text (positive, negative, neutral)',
        requiredInput: { text: 'string' },
        availableIn: ['Pro', 'Enterprise'],
      },
      {
        name: 'timeSeriesAnalysis',
        description: 'Time series trend analysis and forecasting',
        requiredInput: { values: 'number[]', periods: 'number' },
        availableIn: ['Pro', 'Enterprise'],
      },
      {
        name: 'linearRegression',
        description: 'Linear regression analysis (slope, intercept, R-squared)',
        requiredInput: { x: 'number[]', y: 'number[]' },
        availableIn: ['Enterprise'],
      },
      {
        name: 'recommendation',
        description: 'Item recommendation based on user preferences',
        requiredInput: { userPreferences: 'number[]', itemFeatures: 'number[][]', topN: 'number' },
        availableIn: ['Enterprise'],
      },
    ],
  });
});