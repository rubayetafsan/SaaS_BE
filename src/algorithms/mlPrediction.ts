import { AlgorithmResult, MLPredictionInput, MLPredictionResult } from './types';

export async function mlPrediction(input: MLPredictionInput): Promise<AlgorithmResult> {
  const startTime = Date.now();
  
  try {
    const { features, weights } = input;
    
    // Validate inputs
    if (!Array.isArray(features) || !Array.isArray(weights)) {
      return {
        success: false,
        error: 'Invalid input: features and weights must be arrays',
      };
    }
    
    if (features.length === 0 || weights.length === 0) {
      return {
        success: false,
        error: 'Invalid input: features and weights cannot be empty',
      };
    }
    
    if (features.length !== weights.length) {
      return {
        success: false,
        error: 'Invalid input: features and weights must have the same length',
      };
    }
    
    // Validate all elements are numbers
    if (!features.every(f => typeof f === 'number' && !isNaN(f))) {
      return {
        success: false,
        error: 'Invalid input: all features must be valid numbers',
      };
    }
    
    if (!weights.every(w => typeof w === 'number' && !isNaN(w))) {
      return {
        success: false,
        error: 'Invalid input: all weights must be valid numbers',
      };
    }
    
    // Calculate weighted sum (linear model)
    const prediction = features.reduce((sum, feature, index) => {
      const weight = weights[index];
      return sum + (weight !== undefined ? feature * weight : 0);
    }, 0);
    
    // Calculate confidence based on weight distribution and feature values
    const weightSum = weights.reduce((sum, w) => sum + Math.abs(w), 0);
    const normalizedWeights = weights.map(w => Math.abs(w) / weightSum);
    
    // Confidence is higher when weights are well-distributed and features are normalized
    const featureVariance = calculateVariance(features);
    const weightEntropy = calculateEntropy(normalizedWeights);
    
    // Confidence score between 0 and 1
    let confidence = Math.min(0.95, (weightEntropy * 0.6) + (1 / (1 + featureVariance)) * 0.4);
    confidence = Math.max(0.3, confidence); // Minimum confidence of 0.3
    
    const result: MLPredictionResult = {
      prediction: Math.round(prediction * 1000) / 1000,
      confidence: Math.round(confidence * 100) / 100,
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      result,
      executionTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Algorithm execution failed',
      executionTime: Date.now() - startTime,
    };
  }
}

// Helper function to calculate variance
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

// Helper function to calculate entropy (for weight distribution)
function calculateEntropy(probabilities: number[]): number {
  return -probabilities.reduce((sum, p) => {
    if (p === 0) return sum;
    return sum + (p * Math.log2(p));
  }, 0) / Math.log2(probabilities.length);
}