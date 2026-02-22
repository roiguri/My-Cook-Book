import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../../src/js/utils/error-handler.js';

describe('Error Handler Utility', () => {
  describe('getErrorMessage', () => {
    test('returns default error message for no error', () => {
      expect(getErrorMessage(null)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage(undefined)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });

    test('handles Firebase Auth errors', () => {
      expect(getErrorMessage({ code: 'auth/network-request-failed' })).toBe(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
      );
      expect(getErrorMessage({ code: 'auth/user-not-found' })).toBe('אנא התחבר למערכת כדי להמשיך.');
      expect(getErrorMessage({ code: 'auth/invalid-user-token' })).toBe(
        'אנא התחבר למערכת כדי להמשיך.',
      );
      expect(getErrorMessage({ code: 'auth/other-error' })).toBe(
        'בעיה באימות המשתמש. אנא התחבר שנית.',
      );
    });

    test('handles Firebase Firestore errors', () => {
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
      expect(getErrorMessage({ code: 'firestore/other-error' })).toBe(
        'שגיאה בשמירת הנתונים. אנא נסה שנית.',
      );
    });

    test('handles Firebase Storage errors', () => {
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
      expect(getErrorMessage({ code: 'storage/other-error' })).toBe(
        'שגיאה בהעלאת התמונה. אנא נסה שנית.',
      );
    });

    test('handles Network errors', () => {
      expect(getErrorMessage({ message: 'Network error occurred' })).toBe(
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

    test('returns default error message for unknown errors', () => {
      expect(getErrorMessage({ code: 'unknown/error' })).toBe(
        'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.',
      );
      expect(getErrorMessage({ message: 'Some random error' })).toBe(
        'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.',
      );
    });
  });

  describe('showErrorModal', () => {
    let mockModal;
    let consoleErrorSpy;

    beforeEach(() => {
      mockModal = {
        show: jest.fn(),
      };
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('calls modal.show with correct message', () => {
      const error = { code: 'auth/user-not-found' };
      showErrorModal(mockModal, error);

      expect(mockModal.show).toHaveBeenCalledWith('אנא התחבר למערכת כדי להמשיך.', '', 'סגור');
    });

    test('logs error if modal element is invalid', () => {
      showErrorModal(null, { message: 'error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );

      showErrorModal({}, { message: 'error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );
    });
  });

  describe('logError', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('logs error details with context', () => {
      const error = {
        code: 'test/error',
        name: 'TestError',
        message: 'Something went wrong',
        stack: 'Stack trace...',
      };
      const context = 'test-context';

      logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Error Handler]',
        expect.objectContaining({
          context: 'test-context',
          code: 'test/error',
          name: 'TestError',
          message: 'Something went wrong',
          stack: 'Stack trace...',
          timestamp: expect.any(String),
        }),
      );
    });
  });
});
