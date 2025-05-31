/**
 * Simple error logging utility for the application.
 * This can be expanded to send errors to external logging services.
 */

// Constants for error types
export const ERROR_TYPES = {
  DATABASE: 'database_error',
  VALIDATION: 'validation_error',
  AUTHORIZATION: 'authorization_error',
  NETWORK: 'network_error',
  UNKNOWN: 'unknown_error',
}

// Interface for structured error logging
export interface ErrorLogData {
  type?: string;
  message?: string;
  code?: string;
  timestamp?: string;
  details?: string | Record<string, any>;
  stack?: string;
  hint?: string;
  attempt?: number;
  retryInfo?: string;
  [key: string]: any;
}

// Main error logger function
export function logError(
  error: Error | unknown,
  type: string = ERROR_TYPES.UNKNOWN,
  details?: Record<string, any>
): ErrorLogData {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  
  const logData: ErrorLogData = {
    type,
    message: errorObj.message,
    timestamp: new Date().toISOString(),
    stack: errorObj.stack,
    details,
  }

  // Add any additional error properties
  if (error && typeof error === 'object' && 'code' in error) {
    logData.code = String((error as any).code)
  }

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${type.toUpperCase()}] ${errorObj.message}`, {
      ...logData,
      timestamp: new Date(logData.timestamp || '').toLocaleString(),
    })
  } else {
    // In production, we could send errors to a monitoring service
    // Example: sendToErrorMonitoring(logData)
    console.error(`[${type.toUpperCase()}] ${errorObj.message}`)
  }

  return logData
}

// Log database errors with additional context
export function logDatabaseError(error: unknown, data: ErrorLogData = {}): ErrorLogData {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const logData: ErrorLogData = {
    type: ERROR_TYPES.DATABASE,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    stack: errorStack,
    ...data
  };
  
  // Format the error message with additional context
  const formattedMessage = [
    `[DATABASE ERROR] ${errorMessage}`,
    data.code ? `Code: ${data.code}` : null,
    data.details ? `Details: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : null,
    data.hint ? `Hint: ${data.hint}` : null,
    data.attempt ? `Attempt: ${data.attempt}` : null,
    data.retryInfo ? `Retry: ${data.retryInfo}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
  
  console.error(formattedMessage);
  if (errorStack) {
    console.error(errorStack);
  }
  
  return logData;
}

// Helper for network errors
export function logNetworkError(error: unknown, details?: Record<string, any>) {
  return logError(error, ERROR_TYPES.NETWORK, details)
}

// Helper for validation errors
export function logValidationError(error: unknown, details?: Record<string, any>) {
  return logError(error, ERROR_TYPES.VALIDATION, details)
}

// Helper for authentication errors
export function logAuthError(error: unknown, details?: Record<string, any>) {
  return logError(error, ERROR_TYPES.AUTHORIZATION, details)
} 