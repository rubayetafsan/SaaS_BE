import { AlgorithmResult, RecommendationInput, RecommendationResult } from './types';

export async function recommendation(input: RecommendationInput): Promise<AlgorithmResult> {
  const startTime = Date.now();
  
  try {
    const { userPreferences, itemFeatures, topN } = input;
    
    // Validate inputs
    if (!Array.isArray(userPreferences) || userPreferences.length === 0) {
      return {
        success: false,
        error: 'Invalid input: userPreferences must be a non-empty array',
      };
    }
    
    if (!Array.isArray(itemFeatures) || itemFeatures.length === 0) {
      return {
        success: false,
        error: 'Invalid input: itemFeatures must be a non-empty array',
      };
    }
    
    if (!userPreferences.every(p => typeof p === 'number' && !isNaN(p))) {
      return {
        success: false,
        error: 'Invalid input: all user preferences must be valid numbers',
      };
    }
    
    if (!itemFeatures.every(item => Array.isArray(item) && item.every(f => typeof f === 'number' && !isNaN(f)))) {
      return {
        success: false,
        error: 'Invalid input: all item features must be arrays of valid numbers',
      };
    }
    
    // Validate feature dimensions match
    const featureDimension = userPreferences.length;
    if (!itemFeatures.every(item => item.length === featureDimension)) {
      return {
        success: false,
        error: `Invalid input: all items must have ${featureDimension} features to match user preferences`,
      };
    }
    
    if (typeof topN !== 'number' || topN < 1 || topN > itemFeatures.length) {
      return {
        success: false,
        error: `Invalid input: topN must be between 1 and ${itemFeatures.length}`,
      };
    }
    
    // Calculate similarity scores for each item using cosine similarity
    const scores = itemFeatures.map((features, index) => {
      const score = calculateCosineSimilarity(userPreferences, features);
      return { itemIndex: index, score };
    });
    
    // Sort by score (descending) and take top N
    scores.sort((a, b) => b.score - a.score);
    const recommendations = scores.slice(0, topN).map(item => ({
      itemIndex: item.itemIndex,
      score: Math.round(item.score * 1000) / 1000,
    }));
    
    const result: RecommendationResult = {
      recommendations,
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

// Calculate cosine similarity between two vectors
function calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
  // Calculate dot product
  const dotProduct = vector1.reduce((sum, val, i) => {
    const v2 = vector2[i];
    return sum + (v2 !== undefined ? val * v2 : 0);
  }, 0);
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + (val * val), 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + (val * val), 0));
  
  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  // Cosine similarity
  return dotProduct / (magnitude1 * magnitude2);
}