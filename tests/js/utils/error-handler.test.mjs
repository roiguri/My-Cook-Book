import { jest } from '@jest/globals';
import { getErrorMessage, showErrorModal, logError } from '../../../src/js/utils/error-handler.js';

describe('error-handler utility', () => {
  describe('getErrorMessage', () => {
    it('returns a generic error message for null or undefined input', () => {
      expect(getErrorMessage(null)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      expect(getErrorMessage(undefined)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
    });

    describe('Firebase Authentication errors', () => {
      it('handles network request failed', () => {
        const error = { code: 'auth/network-request-failed' };
        expect(getErrorMessage(error)).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
      });

      it('handles user not found', () => {
        const error = { code: 'auth/user-not-found' };
        expect(getErrorMessage(error)).toBe('אנא התחבר למערכת כדי להמשיך.');
      });

      it('handles invalid user token', () => {
        const error = { code: 'auth/invalid-user-token' };
        expect(getErrorMessage(error)).toBe('אנא התחבר למערכת כדי להמשיך.');
      });

      it('handles generic auth errors', () => {
        const error = { code: 'auth/some-other-error' };
        expect(getErrorMessage(error)).toBe('בעיה באימות המשתמש. אנא התחבר שנית.');
      });
    });

    describe('Firebase Firestore errors', () => {
      it('handles permission denied', () => {
        const error = { code: 'firestore/permission-denied' };
        expect(getErrorMessage(error)).toBe('אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.');
        const error2 = { code: 'permission-denied' };
        expect(getErrorMessage(error2)).toBe('אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.');
      });

      it('handles unavailable', () => {
        const error = { code: 'firestore/unavailable' };
        expect(getErrorMessage(error)).toBe(
          'שירות מסד הנתונים אינו זמין כרגע. אנא נסה שנית מאוחר יותר.',
        );
      });

      it('handles deadline exceeded', () => {
        const error = { code: 'firestore/deadline-exceeded' };
        expect(getErrorMessage(error)).toBe('הפעולה נמשכת זמן רב מדי. אנא נסה שנית.');
      });

      it('handles generic firestore errors', () => {
        const error = { code: 'firestore/some-other-error' };
        expect(getErrorMessage(error)).toBe('שגיאה בשמירת הנתונים. אנא נסה שנית.');
      });
    });

    describe('Firebase Storage errors', () => {
      it('handles unauthorized', () => {
        const error = { code: 'storage/unauthorized' };
        expect(getErrorMessage(error)).toBe('אין לך הרשאה להעלות תמונות. אנא התחבר למערכת.');
      });

      it('handles quota exceeded', () => {
        const error = { code: 'storage/quota-exceeded' };
        expect(getErrorMessage(error)).toBe('חריגה ממכסת האחסון. אנא נסה שנית מאוחר יותר.');
      });

      it('handles invalid format', () => {
        const error = { code: 'storage/invalid-format' };
        expect(getErrorMessage(error)).toBe('פורמט התמונה אינו נתמך. אנא בחר קובץ תמונה חוקי.');
      });

      it('handles object not found', () => {
        const error = { code: 'storage/object-not-found' };
        expect(getErrorMessage(error)).toBe('התמונה לא נמצאה. אנא נסה להעלות תמונה אחרת.');
      });

      it('handles generic storage errors', () => {
        const error = { code: 'storage/some-other-error' };
        expect(getErrorMessage(error)).toBe('שגיאה בהעלאת התמונה. אנא נסה שנית.');
      });
    });

    describe('Network errors', () => {
      it('handles network in message', () => {
        const error = { message: 'A network error occurred' };
        expect(getErrorMessage(error)).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
      });

      it('handles fetch in message', () => {
        const error = { message: 'Failed to fetch' };
        expect(getErrorMessage(error)).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
      });

      it('handles NetworkError in code', () => {
        const error = { code: 'DOMNetworkError' };
        expect(getErrorMessage(error)).toBe('בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.');
      });
    });

    describe('File size errors', () => {
      it('handles file and size in message', () => {
        const error = { message: 'The file size is too big' };
        expect(getErrorMessage(error)).toBe('התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.');
      });

      it('handles file and large in message', () => {
        const error = { message: 'The file is too large' };
        expect(getErrorMessage(error)).toBe('התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.');
      });
    });

    describe('Generic fallback', () => {
      it('handles an error that does not match any specific case', () => {
        const error = { message: 'Something completely different' };
        expect(getErrorMessage(error)).toBe('אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.');
      });
    });
  });

  describe('showErrorModal', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('logs an error and returns if modalElement is invalid (null)', () => {
      showErrorModal(null, new Error('test'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );
    });

    it('logs an error and returns if modalElement does not have a show function', () => {
      showErrorModal({}, new Error('test'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid modal element provided to showErrorModal',
      );
    });

    it('calls modalElement.show with the mapped error message', () => {
      const mockModalElement = {
        show: jest.fn(),
      };
      const error = { code: 'auth/network-request-failed' };

      showErrorModal(mockModalElement, error);

      expect(mockModalElement.show).toHaveBeenCalledWith(
        'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.',
        '',
        'סגור',
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
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

    it('logs the error with context and formatted object', () => {
      const error = new Error('Test error message');
      error.code = 'test-code';
      const context = 'test-context';

      // Mock Date.prototype.toISOString to return a fixed string for testing
      const mockDate = new Date('2024-01-01T12:00:00Z');
      const spyDate = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Error Handler]', {
        context: 'test-context',
        code: 'test-code',
        name: 'Error',
        message: 'Test error message',
        stack: error.stack,
        timestamp: '2024-01-01T12:00:00.000Z',
      });

      spyDate.mockRestore();
    });

    it('handles null/undefined error gracefully', () => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      const spyDate = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      logError(null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Error Handler]', {
        context: '',
        code: undefined,
        name: undefined,
        message: undefined,
        stack: undefined,
        timestamp: '2024-01-01T12:00:00.000Z',
      });

      spyDate.mockRestore();
    });
  });
});
