import { AlgorithmResult, SentimentAnalysisInput, SentimentAnalysisResult } from './types';

// Sentiment word lists
const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'love', 'best', 'perfect', 'beautiful', 'brilliant', 'outstanding', 'superb',
  'happy', 'joy', 'delighted', 'pleased', 'satisfied', 'thrilled', 'excited',
  'positive', 'nice', 'pleasant', 'lovely', 'fabulous', 'terrific', 'incredible',
  'extraordinary', 'exceptional', 'magnificent', 'marvelous', 'splendid', 'fun'
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate', 'dislike',
  'disappointing', 'disappointed', 'sad', 'angry', 'frustrated', 'annoyed',
  'unhappy', 'negative', 'problem', 'issue', 'fail', 'failed', 'wrong', 'broken',
  'useless', 'worthless', 'waste', 'terrible', 'disgusting', 'pathetic', 'ridiculous',
  'annoying', 'boring', 'dull', 'mediocre', 'inferior', 'subpar', 'inadequate'
];

const INTENSIFIERS = ['very', 'extremely', 'really', 'absolutely', 'totally', 'completely'];
const NEGATIONS = ['not', 'no', 'never', 'nothing', 'nowhere', 'neither', 'nobody', "n't"];

export async function sentimentAnalysis(input: SentimentAnalysisInput): Promise<AlgorithmResult> {
  const startTime = Date.now();
  
  try {
    const { text } = input;
    
    if (typeof text !== 'string') {
      return {
        success: false,
        error: 'Invalid input: text must be a string',
      };
    }
    
    if (text.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid input: text cannot be empty',
      };
    }
    
    // Normalize text
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return {
        success: false,
        error: 'Invalid input: text must contain words',
      };
    }
    
    let positiveScore = 0;
    let negativeScore = 0;
    let intensifierMultiplier = 1.0;
    let negationActive = false;
    
    // Analyze each word
    for (let i = 0; i < words.length; i++) {
      const currentWord = words[i];
      if (!currentWord) continue;
      
      const word = currentWord.replace(/[^\w]/g, ''); // Remove punctuation
      
      // Check for intensifiers
      if (INTENSIFIERS.includes(word)) {
        intensifierMultiplier = 1.5;
        continue;
      }
      
      // Check for negations
      if (NEGATIONS.some(neg => word.includes(neg))) {
        negationActive = true;
        continue;
      }
      
      // Score positive words
      if (POSITIVE_WORDS.includes(word)) {
        const score = 1 * intensifierMultiplier;
        if (negationActive) {
          negativeScore += score;
        } else {
          positiveScore += score;
        }
      }
      
      // Score negative words
      if (NEGATIVE_WORDS.includes(word)) {
        const score = 1 * intensifierMultiplier;
        if (negationActive) {
          positiveScore += score;
        } else {
          negativeScore += score;
        }
      }
      
      // Reset modifiers after each sentiment word
      if (POSITIVE_WORDS.includes(word) || NEGATIVE_WORDS.includes(word)) {
        intensifierMultiplier = 1.0;
        negationActive = false;
      }
    }
    
    // Calculate final sentiment
    const totalScore = positiveScore + negativeScore;
    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;
    
    if (totalScore === 0) {
      sentiment = 'neutral';
      score = 0;
    } else {
      const netScore = (positiveScore - negativeScore) / totalScore;
      
      if (netScore > 0.1) {
        sentiment = 'positive';
        score = Math.min(1, Math.abs(netScore));
      } else if (netScore < -0.1) {
        sentiment = 'negative';
        score = Math.min(1, Math.abs(netScore));
      } else {
        sentiment = 'neutral';
        score = 0;
      }
    }
    
    const result: SentimentAnalysisResult = {
      sentiment,
      score: Math.round(score * 100) / 100,
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