import { jest } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../src/js/utils/error-handler.js';

describe('Error Handler Utility', () => {
  describe('getErrorMessage', () => {
    it('should return default message for null/undefined error', () => {
      expect(getErrorMessage(null)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage(undefined)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });

    describe('Firebase Authentication errors', () => {
      it('should handle network request failed', () => {
        expect(getErrorMessage({ code: 'auth/network-request-failed' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
      });

      it('should handle user not found / invalid token', () => {
        expect(getErrorMessage({ code: 'auth/user-not-found' })).toBe(
          'אנא התחבר למערכת כדי להמשיך.',
        );
        expect(getErrorMessage({ code: 'auth/invalid-user-token' })).toBe(
          'אנא התחבר למערכת כדי להמשיך.',
        );
      });

      it('should handle generic auth error', () => {
        expect(getErrorMessage({ code: 'auth/some-other-error' })).toBe(
          'בעיה באימות המשתמש. אנא התחבר שנית.',
        );
      });
    });

    describe('Firebase Firestore errors', () => {
      it('should handle permission denied', () => {
        expect(getErrorMessage({ code: 'firestore/permission-denied' })).toBe(
          'אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.',
        );
        expect(getErrorMessage({ code: 'permission-denied' })).toBe(
          'אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.',
        );
      });

      it('should handle unavailable', () => {
        expect(getErrorMessage({ code: 'firestore/unavailable' })).toBe(
          'שירות מסד הנתונים אינו זמין כרגע. אנא נסה שנית מאוחר יותר.',
        );
      });

      it('should handle deadline exceeded', () => {
        expect(getErrorMessage({ code: 'firestore/deadline-exceeded' })).toBe(
          'הפעולה נמשכת זמן רב מדי. אנא נסה שנית.',
        );
      });

      it('should handle generic firestore error', () => {
        expect(getErrorMessage({ code: 'firestore/unknown' })).toBe(
          'שגיאה בשמירת הנתונים. אנא נסה שנית.',
        );
      });
    });

    describe('Firebase Storage errors', () => {
      it('should handle unauthorized', () => {
        expect(getErrorMessage({ code: 'storage/unauthorized' })).toBe(
          'אין לך הרשאה להעלות תמונות. אנא התחבר למערכת.',
        );
      });

      it('should handle quota exceeded', () => {
        expect(getErrorMessage({ code: 'storage/quota-exceeded' })).toBe(
          'חריגה ממכסת האחסון. אנא נסה שנית מאוחר יותר.',
        );
      });

      it('should handle invalid format', () => {
        expect(getErrorMessage({ code: 'storage/invalid-format' })).toBe(
          'פורמט התמונה אינו נתמך. אנא בחר קובץ תמונה חוקי.',
        );
      });

      it('should handle object not found', () => {
        expect(getErrorMessage({ code: 'storage/object-not-found' })).toBe(
          'התמונה לא נמצאה. אנא נסה להעלות תמונה אחרת.',
        );
      });

      it('should handle generic storage error', () => {
        expect(getErrorMessage({ code: 'storage/unknown' })).toBe(
          'שגיאה בהעלאת התמונה. אנא נסה שנית.',
        );
      });
    });

    describe('Network errors', () => {
      it('should handle network message errors', () => {
        expect(getErrorMessage({ message: 'Network error occurred' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
        expect(getErrorMessage({ message: 'Failed to fetch data' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
      });

      it('should handle NetworkError code', () => {
        expect(getErrorMessage({ code: 'NetworkError' })).toBe(
          'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        );
      });
    });

    describe('File size errors', () => {
      it('should handle file size errors based on message', () => {
        expect(getErrorMessage({ message: 'File is too large' })).toBe(
          'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
        );
        expect(getErrorMessage({ message: 'Exceeds maximum file size' })).toBe(
          'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.',
        );
      });
    });

    it('should return generic fallback for unknown errors', () => {
      expect(getErrorMessage({ code: 'unknown/error', message: 'Something went wrong' })).toBe(
        'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.',
      );
      expect(getErrorMessage({})).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });
  });

  describe('showErrorModal', () => {
    let mockConsoleError;

    beforeEach(() => {
      mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      mockConsoleError.mockRestore();
    });

    it('should call modalElement.show with correct parameters', () => {
      const modalElement = {
        show: jest.fn(),
      };
      const error = { code: 'auth/user-not-found' };

      showErrorModal(modalElement, error);

      expect(modalElement.show).toHaveBeenCalledWith('אנא התחבר למערכת כדי להמשיך.', '', 'סגור');
    });

    it('should log an error and not crash if modalElement is invalid', () => {
      showErrorModal(null, new Error('Test'));
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );

      showErrorModal({}, new Error('Test'));
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );
    });
  });

  describe('logError', () => {
    let mockConsoleError;
    let originalDate;

    beforeEach(() => {
      mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      originalDate = global.Date;
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
      };
    });

    afterEach(() => {
      mockConsoleError.mockRestore();
      global.Date = originalDate;
    });

    it('should log error details with context', () => {
      const error = new Error('Test error');
      error.code = 'test/code';

      logError(error, 'TestContext');

      expect(mockConsoleError).toHaveBeenCalledWith('[Error Handler]', {
        context: 'TestContext',
        code: 'test/code',
        name: 'Error',
        message: 'Test error',
        stack: error.stack,
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });

    it('should handle undefined/null error gracefully', () => {
      logError(null, 'TestContext');

      expect(mockConsoleError).toHaveBeenCalledWith('[Error Handler]', {
        context: 'TestContext',
        code: undefined,
        name: undefined,
        message: undefined,
        stack: undefined,
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });
  });
});
