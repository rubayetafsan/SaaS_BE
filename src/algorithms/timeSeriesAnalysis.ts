import { AlgorithmResult, TimeSeriesInput, TimeSeriesResult } from './types';

export async function timeSeriesAnalysis(input: TimeSeriesInput): Promise<AlgorithmResult> {
  const startTime = Date.now();
  
  try {
    const { values, periods } = input;
    
    // Validate inputs
    if (!Array.isArray(values) || values.length === 0) {
      return {
        success: false,
        error: 'Invalid input: values must be a non-empty array',
      };
    }
    
    if (values.length < 3) {
      return {
        success: false,
        error: 'Invalid input: at least 3 data points required for time series analysis',
      };
    }
    
    if (!values.every(v => typeof v === 'number' && !isNaN(v))) {
      return {
        success: false,
        error: 'Invalid input: all values must be valid numbers',
      };
    }
    
    if (typeof periods !== 'number' || periods < 1 || periods > 10) {
      return {
        success: false,
        error: 'Invalid input: periods must be a number between 1 and 10',
      };
    }
    
    // Calculate trend
    const trend = calculateTrend(values);
    
    // Generate forecast using simple exponential smoothing
    const forecast = generateForecast(values, periods);
    
    const result: TimeSeriesResult = {
      trend,
      forecast: forecast.map(v => Math.round(v * 100) / 100),
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

// Calculate overall trend (increasing, decreasing, or stable)
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  // Calculate linear regression slope
  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = indices.reduce((sum, x, i) => {
    const value = values[i];
    return sum + (value !== undefined ? x * value : 0);
  }, 0);
  const sumXX = indices.reduce((sum, x) => sum + (x * x), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Determine trend based on slope
  const threshold = 0.1; // Sensitivity threshold
  
  if (slope > threshold) {
    return 'increasing';
  } else if (slope < -threshold) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

// Generate forecast using exponential smoothing
function generateForecast(values: number[], periods: number): number[] {
  const alpha = 0.3; // Smoothing factor
  
  // Calculate initial level (average of first few points)
  let level = values.slice(0, 3).reduce((sum, v) => sum + v, 0) / 3;
  
  // Calculate initial trend
  let trend = 0;
  for (let i = 1; i < Math.min(4, values.length); i++) {
    const current = values[i];
    const previous = values[i - 1];
    if (current !== undefined && previous !== undefined) {
      trend += (current - previous);
    }
  }
  trend /= Math.min(3, values.length - 1);
  
  // Apply Holt's linear exponential smoothing to existing data
  const beta = 0.1; // Trend smoothing factor
  
  for (let i = 0; i < values.length; i++) {
    const currentValue = values[i];
    if (currentValue !== undefined) {
      const prevLevel = level;
      level = alpha * currentValue + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }
  }
  
  // Generate forecast
  const forecast: number[] = [];
  for (let i = 1; i <= periods; i++) {
    forecast.push(level + i * trend);
  }
  
  return forecast;
}