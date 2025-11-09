export interface AlgorithmResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime?: number;
}

export interface AlgorithmInput {
  algorithmName: string;
  data: any;
}

export type AlgorithmFunction = (data: any) => Promise<AlgorithmResult> | AlgorithmResult;

// Data Analysis
export interface DataAnalysisInput {
  numbers: number[];
}

export interface DataAnalysisResult {
  sum: number;
  average: number;
  min: number;
  max: number;
  count: number;
  median?: number;
  stdDev?: number;
}

// Text Analysis
export interface TextAnalysisInput {
  text: string;
}

export interface TextAnalysisResult {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  averageWordLength?: number;
}

// ML Prediction
export interface MLPredictionInput {
  features: number[];
  weights: number[];
}

export interface MLPredictionResult {
  prediction: number;
  confidence: number;
}

// Sentiment Analysis
export interface SentimentAnalysisInput {
  text: string;
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
}

// Time Series Analysis
export interface TimeSeriesInput {
  values: number[];
  periods: number;
}

export interface TimeSeriesResult {
  trend: 'increasing' | 'decreasing' | 'stable';
  forecast: number[];
}

// Linear Regression
export interface LinearRegressionInput {
  x: number[];
  y: number[];
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  equation: string;
  rSquared?: number;
}

// Recommendation
export interface RecommendationInput {
  userPreferences: number[];
  itemFeatures: number[][];
  topN: number;
}

export interface RecommendationResult {
  recommendations: Array<{
    itemIndex: number;
    score: number;
  }>;
}