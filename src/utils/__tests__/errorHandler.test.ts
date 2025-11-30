import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatErrorMessage,
  logError,
  handleError,
  createErrorHandler,
  withErrorHandling,
} from '../errorHandler';

describe('errorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('formatErrorMessage', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      expect(formatErrorMessage(error)).toBe('Test error');
    });

    it('should format string errors', () => {
      expect(formatErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error types', () => {
      expect(formatErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(formatErrorMessage(123)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      logError(error, { component: 'TestComponent', action: 'testAction' });
      expect(console.error).toHaveBeenCalled();
    });

    it('should log error without context', () => {
      const error = new Error('Test error');
      logError(error);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('handleError', () => {
    it('should return formatted error message', () => {
      const error = new Error('Test error');
      const message = handleError(error, { component: 'Test' });
      expect(message).toBe('Test error');
    });
  });

  describe('createErrorHandler', () => {
    it('should create error handler with context', () => {
      const handler = createErrorHandler({ component: 'TestComponent' });
      const error = new Error('Test error');
      const message = handler(error);
      expect(message).toBe('Test error');
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap async function and return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = withErrorHandling(fn);
      const result = await wrapped('arg1', 'arg2');
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should return null on error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrapped = withErrorHandling(fn, { component: 'Test' });
      const result = await wrapped();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});

