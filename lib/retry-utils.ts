/**
 * Retry utility for handling temporary failures with automatic retries
 */

type RetryOptions = {
  maxRetries?: number;
  delay?: number;
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: unknown) => boolean;
};

/**
 * Execute a query with retry logic
 * 
 * @param fn Function to execute
 * @param options Retry options
 * @returns Result of the query
 */
export async function retryQuery<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    onRetry = () => {},
    shouldRetry = () => true,
  } = options;
  
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // If we've exceeded max retries or shouldn't retry this error, throw
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Call the onRetry callback with the error and attempt number
      if (error instanceof Error) {
        onRetry(error, attempt);
      } else {
        onRetry(new Error(String(error)), attempt);
        }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

/**
 * Determine if an error should be retried based on its type or properties
 * 
 * @param error The error to check
 * @returns Boolean indicating if the error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors are often temporary and should be retried
  if (error instanceof TypeError && error.message.includes('network')) {
    return true;
  }
  
  // Database connection errors may be temporary
  if (
    error &&
    typeof error === 'object' &&
    'code' in error
  ) {
    const code = String((error as any).code);
    
    // List of error codes that are typically temporary and can be retried
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'PGRST301', // Supabase connection issues
      '08006',    // PostgreSQL connection failure
      '57P01',    // PostgreSQL admin shutdown
      '40001',    // PostgreSQL serialization failure
    ];
    
    return retryableCodes.includes(code);
  }
  
  // By default, don't retry
  return false;
} 