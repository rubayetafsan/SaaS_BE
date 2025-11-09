import { AlgorithmResult, LinearRegressionInput, LinearRegressionResult } from './types';

export async function linearRegression(input: LinearRegressionInput): Promise<AlgorithmResult> {
  const startTime = Date.now();
  
  try {
    const { x, y } = input;
    
    // Validate inputs
    if (!Array.isArray(x) || !Array.isArray(y)) {
      return {
        success: false,
        error: 'Invalid input: x and y must be arrays',
      };
    }
    
    if (x.length === 0 || y.length === 0) {
      return {
        success: false,
        error: 'Invalid input: x and y cannot be empty',
      };
    }
    
    if (x.length !== y.length) {
      return {
        success: false,
        error: 'Invalid input: x and y must have the same length',
      };
    }
    
    if (x.length < 2) {
      return {
        success: false,
        error: 'Invalid input: at least 2 data points required',
      };
    }
    
    if (!x.every(val => typeof val === 'number' && !isNaN(val))) {
      return {
        success: false,
        error: 'Invalid input: all x values must be valid numbers',
      };
    }
    
    if (!y.every(val => typeof val === 'number' && !isNaN(val))) {
      return {
        success: false,
        error: 'Invalid input: all y values must be valid numbers',
      };
    }
    
    const n = x.length;
    
    // Calculate sums
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => {
      const yVal = y[i];
      return sum + (yVal !== undefined ? val * yVal : 0);
    }, 0);
    const sumXX = x.reduce((sum, val) => sum + (val * val), 0);
    
    // Calculate slope (m) and intercept (b) for y = mx + b
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared (coefficient of determination)
    const meanY = sumY / n;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const ssResidual = y.reduce((sum, val, i) => {
      const xVal = x[i];
      if (xVal !== undefined) {
        const predicted = slope * xVal + intercept;
        return sum + Math.pow(val - predicted, 2);
      }
      return sum;
    }, 0);
    
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
    
    // Format equation
    const slopeStr = slope >= 0 ? slope.toFixed(2) : slope.toFixed(2);
    const interceptStr = intercept >= 0 ? `+ ${intercept.toFixed(2)}` : `- ${Math.abs(intercept).toFixed(2)}`;
    const equation = `y = ${slopeStr}x ${interceptStr}`;
    
    const result: LinearRegressionResult = {
      slope: Math.round(slope * 100) / 100,
      intercept: Math.round(intercept * 100) / 100,
      equation,
      rSquared: Math.round(rSquared * 10000) / 10000,
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