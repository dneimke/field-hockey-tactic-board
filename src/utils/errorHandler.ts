/**
 * Centralized error handling utility
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Formats an error into a user-friendly message
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Logs an error with context
 */
export const logError = (error: unknown, context?: ErrorContext): void => {
  const errorMessage = formatErrorMessage(error);
  const contextStr = context
    ? ` [${context.component || 'Unknown'}${context.action ? `: ${context.action}` : ''}]`
    : '';

  console.error(`Error${contextStr}:`, errorMessage, error);

  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTrackingService(error, context);
  }
};

/**
 * Handles an error and returns a user-friendly message
 */
export const handleError = (error: unknown, context?: ErrorContext): string => {
  logError(error, context);
  return formatErrorMessage(error);
};

/**
 * Creates an error handler function for a specific context
 */
export const createErrorHandler = (context: ErrorContext) => {
  return (error: unknown): string => {
    return handleError(error, context);
  };
};

/**
 * Wraps an async function with error handling
 */
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext,
): ((...args: T) => Promise<R | null>) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };
};

