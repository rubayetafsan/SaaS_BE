import { AlgorithmResult, TextAnalysisInput, TextAnalysisResult } from './types';

export async function textAnalysis(input: TextAnalysisInput): Promise<AlgorithmResult> {
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
    
    // Count words (split by whitespace and filter empty strings)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Count characters (excluding leading/trailing whitespace)
    const characterCount = text.trim().length;
    
    // Count sentences (split by .!?)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    
    // Calculate average word length
    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const averageWordLength = wordCount > 0 
      ? Math.round((totalWordLength / wordCount) * 100) / 100 
      : 0;
    
    const result: TextAnalysisResult = {
      wordCount,
      characterCount,
      sentenceCount,
      averageWordLength,
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