import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../../src/js/utils/error-handler.js';

describe('Error Handler Utility', () => {
  describe('getErrorMessage', () => {
    test('returns generic message for null/undefined error', () => {
      const genericMsg = 'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.';
      expect(getErrorMessage(null)).toBe(genericMsg);
      expect(getErrorMessage(undefined)).toBe(genericMsg);
    });

    describe('Firebase Authentication errors', () => {
      test('handles network request failed', () => {
        expect(getErrorMessage({ code: 'auth/network-request-failed' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
      });

      test('handles user not found', () => {
        expect(getErrorMessage({ code: 'auth/user-not-found' })).toBe(
          'אנא התחבר למערכת כדי להמשיך.',
        );
      });

      test('handles invalid user token', () => {
        expect(getErrorMessage({ code: 'auth/invalid-user-token' })).toBe(
          'אנא התחבר למערכת כדי להמשיך.',
        );
      });

      test('handles default auth errors', () => {
        expect(getErrorMessage({ code: 'auth/something-else' })).toBe(
          'בעיה באימות המשתמש. אנא התחבר שנית.',
        );
      });
    });

    describe('Firebase Firestore errors', () => {
      test('handles permission denied (firestore prefix)', () => {
        expect(getErrorMessage({ code: 'firestore/permission-denied' })).toBe(
          'אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.',
        );
      });

      test('handles permission denied (no prefix)', () => {
        expect(getErrorMessage({ code: 'permission-denied' })).toBe(
          'אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.',
        );
      });

      test('handles unavailable', () => {
        expect(getErrorMessage({ code: 'firestore/unavailable' })).toBe(
          'שירות מסד הנתונים אינו זמין כרגע. אנא נסה שנית מאוחר יותר.',
        );
      });

      test('handles deadline exceeded', () => {
        expect(getErrorMessage({ code: 'firestore/deadline-exceeded' })).toBe(
          'הפעולה נמשכת זמן רב מדי. אנא נסה שנית.',
        );
      });

      test('handles default firestore errors', () => {
        expect(getErrorMessage({ code: 'firestore/unknown' })).toBe(
          'שגיאה בשמירת הנתונים. אנא נסה שנית.',
        );
      });
    });

    describe('Firebase Storage errors', () => {
      test('handles unauthorized', () => {
        expect(getErrorMessage({ code: 'storage/unauthorized' })).toBe(
          'אין לך הרשאה להעלות תמונות. אנא התחבר למערכת.',
        );
      });

      test('handles quota exceeded', () => {
        expect(getErrorMessage({ code: 'storage/quota-exceeded' })).toBe(
          'חריגה ממכסת האחסון. אנא נסה שנית מאוחר יותר.',
        );
      });

      test('handles invalid format', () => {
        expect(getErrorMessage({ code: 'storage/invalid-format' })).toBe(
          'פורמט התמונה אינו נתמך. אנא בחר קובץ תמונה חוקי.',
        );
      });

      test('handles object not found', () => {
        expect(getErrorMessage({ code: 'storage/object-not-found' })).toBe(
          'התמונה לא נמצאה. אנא נסה להעלות תמונה אחרת.',
        );
      });

      test('handles default storage errors', () => {
        expect(getErrorMessage({ code: 'storage/unknown' })).toBe(
          'שגיאה בהעלאת התמונה. אנא נסה שנית.',
        );
      });
    });

    describe('Network errors', () => {
      test('handles network error in message', () => {
        expect(getErrorMessage({ message: 'Network error occurred' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
      });

      test('handles fetch error in message', () => {
        expect(getErrorMessage({ message: 'Failed to fetch' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
      });

      test('handles NetworkError in code', () => {
        expect(getErrorMessage({ code: 'NetworkError' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
      });
    });

    describe('File size errors', () => {
      test('handles file size error', () => {
        expect(getErrorMessage({ message: 'File size too large' })).toBe(
          'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
        );
      });

      test('handles file large error', () => {
        expect(getErrorMessage({ message: 'File is too large' })).toBe(
          'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
        );
      });
    });

    test('returns generic fallback for unknown errors', () => {
      expect(getErrorMessage({ code: 'unknown', message: 'something weird' })).toBe(
        'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.',
      );
    });
  });

  describe('showErrorModal', () => {
    test('calls modal.show with correct message', () => {
      const mockModal = { show: jest.fn() };
      const error = { code: 'auth/user-not-found' };

      showErrorModal(mockModal, error);

      expect(mockModal.show).toHaveBeenCalledWith('אנא התחבר למערכת כדי להמשיך.', '', 'סגור');
    });

    test('logs error if modal is invalid', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      showErrorModal(null, {});
      expect(consoleSpy).toHaveBeenCalledWith('Invalid modal element provided to showErrorModal');

      showErrorModal({}, {});
      expect(consoleSpy).toHaveBeenCalledWith('Invalid modal element provided to showErrorModal');

      consoleSpy.mockRestore();
    });
  });

  describe('logError', () => {
    test('logs error details to console.error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = {
        code: 'test/code',
        name: 'TestError',
        message: 'Test message',
        stack: 'Test stack',
      };
      const context = 'test-context';

      logError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Error Handler]',
        expect.objectContaining({
          context: 'test-context',
          code: 'test/code',
          name: 'TestError',
          message: 'Test message',
          stack: 'Test stack',
          timestamp: expect.any(String),
        }),
      );

      consoleSpy.mockRestore();
    });
  });
});
