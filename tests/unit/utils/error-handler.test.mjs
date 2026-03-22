import { jest } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../../src/js/utils/error-handler.js';

describe('Error Handler Utility', () => {
  describe('getErrorMessage', () => {
    it('returns default error message for null or undefined error', () => {
      expect(getErrorMessage(null)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage(undefined)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });

    it('handles Firebase Auth errors', () => {
      expect(getErrorMessage({ code: 'auth/network-request-failed' })).toBe(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
      );
      expect(getErrorMessage({ code: 'auth/user-not-found' })).toBe('אנא התחבר למערכת כדי להמשיך.');
      expect(getErrorMessage({ code: 'auth/invalid-user-token' })).toBe(
        'אנא התחבר למערכת כדי להמשיך.',
      );
      expect(getErrorMessage({ code: 'auth/unknown-error' })).toBe(
        'בעיה באימות המשתמש. אנא התחבר שנית.',
      );
    });

    it('handles Firebase Firestore errors', () => {
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
      expect(getErrorMessage({ code: 'firestore/unknown-error' })).toBe(
        'שגיאה בשמירת הנתונים. אנא נסה שנית.',
      );
    });

    it('handles Firebase Storage errors', () => {
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
      expect(getErrorMessage({ code: 'storage/unknown-error' })).toBe(
        'שגיאה בהעלאת התמונה. אנא נסה שנית.',
      );
    });

    it('handles Network errors', () => {
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

    it('handles File size errors', () => {
      expect(getErrorMessage({ message: 'File is too large' })).toBe(
        'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
      );
      expect(getErrorMessage({ message: 'Maximum file size exceeded' })).toBe(
        'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
      );
    });

    it('returns generic fallback for unknown errors', () => {
      expect(getErrorMessage({ message: 'Unknown issue' })).toBe(
        'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.',
      );
      expect(getErrorMessage({})).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });
  });

  describe('showErrorModal', () => {
    let mockModal;

    beforeEach(() => {
      mockModal = {
        show: jest.fn(),
      };
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calls modalElement.show with correct translated message', () => {
      const error = { code: 'auth/user-not-found' };
      showErrorModal(mockModal, error);

      expect(mockModal.show).toHaveBeenCalledWith('אנא התחבר למערכת כדי להמשיך.', '', 'סגור');
    });

    it('logs error if modalElement is invalid or missing show method', () => {
      showErrorModal(null, { code: 'auth/user-not-found' });
      expect(console.error).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );

      showErrorModal({}, { code: 'auth/user-not-found' });
      expect(console.error).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('logs error details properly with structured object', () => {
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const error = {
        code: 'test/code',
        name: 'TestError',
        message: 'Test message',
        stack: 'Test stack trace',
      };

      logError(error, 'Test Context');

      expect(console.error).toHaveBeenCalledWith('[Error Handler]', {
        context: 'Test Context',
        code: 'test/code',
        name: 'TestError',
        message: 'Test message',
        stack: 'Test stack trace',
        timestamp: '2023-01-01T00:00:00.000Z',
      });
    });

    it('logs safely even with missing error properties', () => {
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      logError(null, 'Test Context');

      expect(console.error).toHaveBeenCalledWith('[Error Handler]', {
        context: 'Test Context',
        code: undefined,
        name: undefined,
        message: undefined,
        stack: undefined,
        timestamp: '2023-01-01T00:00:00.000Z',
      });
    });
  });
});
