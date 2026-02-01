import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../../src/js/utils/error-handler.js';

describe('Error Handler Utility', () => {
  describe('getErrorMessage', () => {
    test('returns generic error for null/undefined input', () => {
      expect(getErrorMessage(null)).toContain('אירעה שגיאה לא צפויה');
      expect(getErrorMessage(undefined)).toContain('אירעה שגיאה לא צפויה');
    });

    // Firebase Auth
    test('handles auth/network-request-failed', () => {
      const error = { code: 'auth/network-request-failed' };
      expect(getErrorMessage(error)).toContain('בעיית חיבור לאינטרנט');
    });

    test('handles auth/user-not-found', () => {
      const error = { code: 'auth/user-not-found' };
      expect(getErrorMessage(error)).toContain('אנא התחבר למערכת');
    });

    test('handles generic auth errors', () => {
      const error = { code: 'auth/unknown-error' };
      expect(getErrorMessage(error)).toContain('בעיה באימות המשתמש');
    });

    // Firebase Firestore
    test('handles firestore/permission-denied', () => {
      const error = { code: 'firestore/permission-denied' };
      expect(getErrorMessage(error)).toContain('אין לך הרשאה');
    });

    test('handles firestore/unavailable', () => {
      const error = { code: 'firestore/unavailable' };
      expect(getErrorMessage(error)).toContain('שירות מסד הנתונים אינו זמין');
    });

    test('handles firestore/deadline-exceeded', () => {
      const error = { code: 'firestore/deadline-exceeded' };
      expect(getErrorMessage(error)).toContain('הפעולה נמשכת זמן רב מדי');
    });

    test('handles generic firestore errors', () => {
      const error = { code: 'firestore/unknown' };
      expect(getErrorMessage(error)).toContain('שגיאה בשמירת הנתונים');
    });

    // Firebase Storage
    test('handles storage/unauthorized', () => {
      const error = { code: 'storage/unauthorized' };
      expect(getErrorMessage(error)).toContain('אין לך הרשאה');
    });

    test('handles storage/quota-exceeded', () => {
      const error = { code: 'storage/quota-exceeded' };
      expect(getErrorMessage(error)).toContain('חריגה ממכסת האחסון');
    });

    test('handles storage/invalid-format', () => {
      const error = { code: 'storage/invalid-format' };
      expect(getErrorMessage(error)).toContain('פורמט התמונה אינו נתמך');
    });

    test('handles storage/object-not-found', () => {
      const error = { code: 'storage/object-not-found' };
      expect(getErrorMessage(error)).toContain('התמונה לא נמצאה');
    });

    test('handles generic storage errors', () => {
      const error = { code: 'storage/unknown' };
      expect(getErrorMessage(error)).toContain('שגיאה בהעלאת התמונה');
    });

    // Network Errors
    test('handles network errors by message content', () => {
      const error = { message: 'Network error occurred' };
      expect(getErrorMessage(error)).toContain('בעיית חיבור לאינטרנט');
    });

    test('handles fetch errors by message content', () => {
      const error = { message: 'Failed to fetch' };
      expect(getErrorMessage(error)).toContain('בעיית חיבור לאינטרנט');
    });

    // File Size Errors
    test('handles file size errors', () => {
      const error = { message: 'File size error' };
      expect(getErrorMessage(error)).toContain('התמונה גדולה מדי');
    });

    test('handles file large errors', () => {
      const error = { message: 'File is too large' };
      expect(getErrorMessage(error)).toContain('התמונה גדולה מדי');
    });

    // Generic Fallback
    test('returns fallback for unknown error', () => {
      const error = { message: 'Something went wrong', code: 'unknown' };
      expect(getErrorMessage(error)).toContain('אירעה שגיאה לא צפויה');
    });
  });

  describe('showErrorModal', () => {
    test('calls show on modal element with correct message', () => {
      const mockModal = { show: jest.fn() };
      const error = { code: 'auth/user-not-found' };

      showErrorModal(mockModal, error);

      expect(mockModal.show).toHaveBeenCalledWith(
        expect.stringContaining('אנא התחבר למערכת'),
        '',
        'סגור',
      );
    });

    test('handles invalid modal element safely', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      showErrorModal(null, {});
      showErrorModal({}, {}); // No show method

      expect(consoleSpy).toHaveBeenCalledWith('Invalid modal element provided to showErrorModal');
      consoleSpy.mockRestore();
    });
  });

  describe('logError', () => {
    test('logs error details to console.error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = {
        code: 'test/error',
        message: 'Test error message',
        name: 'TestError',
        stack: 'Error stack',
      };
      const context = 'test-context';

      logError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Error Handler]',
        expect.objectContaining({
          context: 'test-context',
          code: 'test/error',
          message: 'Test error message',
          name: 'TestError',
          stack: 'Error stack',
        }),
      );

      consoleSpy.mockRestore();
    });
  });
});
