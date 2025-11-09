import { AlgorithmResult, DataAnalysisInput, DataAnalysisResult } from './types';

export async function dataAnalysis(input: DataAnalysisInput): Promise<AlgorithmResult> {
  const startTime = Date.now();
  
  try {
    const { numbers } = input;
    
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return {
        success: false,
        error: 'Invalid input: numbers array is required and must not be empty',
      };
    }
    
    // Validate all elements are numbers
    if (!numbers.every(n => typeof n === 'number' && !isNaN(n))) {
      return {
        success: false,
        error: 'Invalid input: all elements must be valid numbers',
      };
    }
    
    // Calculate statistics
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    const average = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const count = numbers.length;
    
    // Calculate median
    const sorted = [...numbers].sort((a, b) => a - b);
    const midIndex1 = count / 2 - 1;
    const midIndex2 = count / 2;
    const midFloor = Math.floor(count / 2);
    
    let median: number;
    if (count % 2 === 0) {
      const val1 = sorted[midIndex1];
      const val2 = sorted[midIndex2];
      median = (val1 !== undefined && val2 !== undefined) ? (val1 + val2) / 2 : 0;
    } else {
      const val = sorted[midFloor];
      median = val !== undefined ? val : 0;
    }
    
    // Calculate standard deviation
    const variance = numbers.reduce((acc, n) => acc + Math.pow(n - average, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    const result: DataAnalysisResult = {
      sum: Math.round(sum * 100) / 100,
      average: Math.round(average * 100) / 100,
      min,
      max,
      count,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
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