import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../../src/js/utils/error-handler.js';

describe('Error Handler Utility', () => {
  describe('getErrorMessage', () => {
    test('returns generic message for null or undefined error', () => {
      expect(getErrorMessage(null)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage(undefined)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });

    test('handles Auth errors', () => {
      expect(getErrorMessage({ code: 'auth/network-request-failed' })).toBe(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
      );
      expect(getErrorMessage({ code: 'auth/user-not-found' })).toBe('אנא התחבר למערכת כדי להמשיך.');
      expect(getErrorMessage({ code: 'auth/invalid-user-token' })).toBe(
        'אנא התחבר למערכת כדי להמשיך.',
      );
      expect(getErrorMessage({ code: 'auth/some-other-error' })).toBe(
        'בעיה באימות המשתמש. אנא התחבר שנית.',
      );
    });

    test('handles Firestore errors', () => {
      expect(getErrorMessage({ code: 'firestore/permission-denied' })).toBe(
        'אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.',
      );
      expect(getErrorMessage({ code: 'permission-denied' })).toBe(
        'אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.',
      );
      expect(getErrorMessage({ code: 'firestore/unavailable' })).toBe(
        'שירות מסד הנתונים אינו זמין כרגע. אנא נסה שנית מאוחר יותר.',
      );
      expect(getErrorMessage({ code: 'firestore/deadline-exceeded' })).toBe(
        'הפעולה נמשכת זמן רב מדי. אנא נסה שנית.',
      );
      expect(getErrorMessage({ code: 'firestore/some-other-error' })).toBe(
        'שגיאה בשמירת הנתונים. אנא נסה שנית.',
      );
    });

    test('handles Storage errors', () => {
      expect(getErrorMessage({ code: 'storage/unauthorized' })).toBe(
        'אין לך הרשאה להעלות תמונות. אנא התחבר למערכת.',
      );
      expect(getErrorMessage({ code: 'storage/quota-exceeded' })).toBe(
        'חריגה ממכסת האחסון. אנא נסה שנית מאוחר יותר.',
      );
      expect(getErrorMessage({ code: 'storage/invalid-format' })).toBe(
        'פורמט התמונה אינו נתמך. אנא בחר קובץ תמונה חוקי.',
      );
      expect(getErrorMessage({ code: 'storage/object-not-found' })).toBe(
        'התמונה לא נמצאה. אנא נסה להעלות תמונה אחרת.',
      );
      expect(getErrorMessage({ code: 'storage/some-other-error' })).toBe(
        'שגיאה בהעלאת התמונה. אנא נסה שנית.',
      );
    });

    test('handles Network errors', () => {
      expect(getErrorMessage({ message: 'Network request failed' })).toBe(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
      );
      expect(getErrorMessage({ message: 'Failed to fetch' })).toBe(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
      );
      expect(getErrorMessage({ code: 'NetworkError' })).toBe(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
      );
    });

    test('handles File size errors', () => {
      expect(getErrorMessage({ message: 'File size too large' })).toBe(
        'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
      );
      expect(getErrorMessage({ message: 'File is too large' })).toBe(
        'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
      );
    });

    test('returns generic message for unknown errors', () => {
      expect(getErrorMessage({ message: 'Something went wrong' })).toBe(
        'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.',
      );
      expect(getErrorMessage({})).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });
  });

  describe('showErrorModal', () => {
    test('calls modal.show with correct message', () => {
      const mockModal = { show: jest.fn() };
      const error = { code: 'auth/user-not-found' };

      showErrorModal(mockModal, error, 'login');

      expect(mockModal.show).toHaveBeenCalledWith('אנא התחבר למערכת כדי להמשיך.', '', 'סגור');
    });

    test('logs error if modal element is invalid', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      showErrorModal(null, new Error('test'));
      expect(consoleSpy).toHaveBeenCalledWith('Invalid modal element provided to showErrorModal');

      showErrorModal({}, new Error('test'));
      expect(consoleSpy).toHaveBeenCalledWith('Invalid modal element provided to showErrorModal');

      consoleSpy.mockRestore();
    });
  });

  describe('logError', () => {
    test('logs error details to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      error.code = 'test-code';

      // Mock Date to ensure consistent timestamp check if needed,
      // but simplistic check is probably enough.
      const realDate = Date;
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
      };

      logError(error, 'test-context');

      expect(consoleSpy).toHaveBeenCalledWith('[Error Handler]', {
        context: 'test-context',
        code: 'test-code',
        name: 'Error',
        message: 'Test error',
        stack: expect.any(String),
        timestamp: '2023-01-01T00:00:00.000Z',
      });

      global.Date = realDate;
      consoleSpy.mockRestore();
    });
  });
});
