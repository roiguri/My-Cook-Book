import { jest, describe, test, expect } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../../src/js/utils/error-handler.js';

describe('Error Handler Utility', () => {
  describe('getErrorMessage', () => {
    test('returns generic message for empty or null error', () => {
      expect(getErrorMessage(null)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage(undefined)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage({})).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });

    test('handles Firebase Auth errors', () => {
      expect(getErrorMessage({ code: 'auth/network-request-failed' })).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
      expect(getErrorMessage({ code: 'auth/user-not-found' })).toBe('אנא התחבר למערכת כדי להמשיך.');
      expect(getErrorMessage({ code: 'auth/invalid-user-token' })).toBe('אנא התחבר למערכת כדי להמשיך.');
      expect(getErrorMessage({ code: 'auth/invalid-credential' })).toBe('בעיה באימות המשתמש. אנא התחבר שנית.');
    });

    test('handles Firebase Firestore errors', () => {
      expect(getErrorMessage({ code: 'firestore/permission-denied' })).toBe('אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.');
      expect(getErrorMessage({ code: 'permission-denied' })).toBe('אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.');
      expect(getErrorMessage({ code: 'firestore/unavailable' })).toBe('שירות מסד הנתונים אינו זמין כרגע. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage({ code: 'firestore/deadline-exceeded' })).toBe('הפעולה נמשכת זמן רב מדי. אנא נסה שנית.');
      expect(getErrorMessage({ code: 'firestore/invalid-argument' })).toBe('שגיאה בשמירת הנתונים. אנא נסה שנית.');
    });

    test('handles Firebase Storage errors', () => {
      expect(getErrorMessage({ code: 'storage/unauthorized' })).toBe('אין לך הרשאה להעלות תמונות. אנא התחבר למערכת.');
      expect(getErrorMessage({ code: 'storage/quota-exceeded' })).toBe('חריגה ממכסת האחסון. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage({ code: 'storage/invalid-format' })).toBe('פורמט התמונה אינו נתמך. אנא בחר קובץ תמונה חוקי.');
      expect(getErrorMessage({ code: 'storage/object-not-found' })).toBe('התמונה לא נמצאה. אנא נסה להעלות תמונה אחרת.');
      expect(getErrorMessage({ code: 'storage/unknown' })).toBe('שגיאה בהעלאת התמונה. אנא נסה שנית.');
    });

    test('handles network errors by message', () => {
      expect(getErrorMessage({ message: 'Network request failed' })).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
      expect(getErrorMessage({ message: 'Failed to fetch' })).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
      expect(getErrorMessage({ code: 'NetworkError' })).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
    });

    test('handles file size errors by message', () => {
      expect(getErrorMessage({ message: 'File is too large' })).toBe('התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.');
      expect(getErrorMessage({ message: 'File size exceeds limit' })).toBe('התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.');
    });
  });

  describe('showErrorModal', () => {
    test('calls show method on modal element with correct message', () => {
      const mockModal = {
        show: jest.fn(),
      };

      const error = { code: 'auth/network-request-failed' };
      showErrorModal(mockModal, error);

      expect(mockModal.show).toHaveBeenCalledWith(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        '',
        'סגור'
      );
    });

    test('does nothing and logs error if modal element is invalid', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      showErrorModal(null, { code: 'error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid modal element provided to showErrorModal');

      showErrorModal({}, { code: 'error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid modal element provided to showErrorModal');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('logError', () => {
    test('logs error info with context and timestamp', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockDate = new Date('2023-01-01T12:00:00.000Z');

      jest.useFakeTimers().setSystemTime(mockDate);

      const error = {
        code: 'test-code',
        name: 'TestError',
        message: 'Test message',
        stack: 'Test stack trace',
      };

      logError(error, 'test-context');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Error Handler]', {
        context: 'test-context',
        code: 'test-code',
        name: 'TestError',
        message: 'Test message',
        stack: 'Test stack trace',
        timestamp: '2023-01-01T12:00:00.000Z',
      });

      consoleErrorSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
