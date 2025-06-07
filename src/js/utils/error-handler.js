/**
 * Error Handler Utility
 * 
 * Provides centralized error handling and user-friendly error message mapping
 * for Firebase and common application errors.
 */

/**
 * Maps Firebase and application errors to user-friendly Hebrew messages
 * @param {Error|Object} error - The error object to map
 * @returns {string} User-friendly error message in Hebrew
 */
export function getErrorMessage(error) {
  if (!error) {
    return 'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.';
  }

  const errorCode = error.code || error.name || '';
  const errorMessage = error.message || '';

  // Firebase Authentication errors
  if (errorCode.includes('auth/')) {
    switch (errorCode) {
      case 'auth/network-request-failed':
        return 'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.';
      case 'auth/user-not-found':
      case 'auth/invalid-user-token':
        return 'אנא התחבר למערכת כדי להמשיך.';
      default:
        return 'בעיה באימות המשתמש. אנא התחבר שנית.';
    }
  }

  // Firebase Firestore errors
  if (errorCode.includes('firestore/') || errorCode.includes('permission-denied')) {
    switch (errorCode) {
      case 'firestore/permission-denied':
      case 'permission-denied':
        return 'אין לך הרשאה לבצע פעולה זו. אנא התחבר למערכת.';
      case 'firestore/unavailable':
        return 'שירות מסד הנתונים אינו זמין כרגע. אנא נסה שנית מאוחר יותר.';
      case 'firestore/deadline-exceeded':
        return 'הפעולה נמשכת זמן רב מדי. אנא נסה שנית.';
      default:
        return 'שגיאה בשמירת הנתונים. אנא נסה שנית.';
    }
  }

  // Firebase Storage errors
  if (errorCode.includes('storage/')) {
    switch (errorCode) {
      case 'storage/unauthorized':
        return 'אין לך הרשאה להעלות תמונות. אנא התחבר למערכת.';
      case 'storage/quota-exceeded':
        return 'חריגה ממכסת האחסון. אנא נסה שנית מאוחר יותר.';
      case 'storage/invalid-format':
        return 'פורמט התמונה אינו נתמך. אנא בחר קובץ תמונה חוקי.';
      case 'storage/object-not-found':
        return 'התמונה לא נמצאה. אנא נסה להעלות תמונה אחרת.';
      default:
        return 'שגיאה בהעלאת התמונה. אנא נסה שנית.';
    }
  }

  // Network errors
  if (errorMessage.toLowerCase().includes('network') || 
      errorMessage.toLowerCase().includes('fetch') ||
      errorCode.includes('NetworkError')) {
    return 'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שנית.';
  }

  // File size errors
  if (errorMessage.toLowerCase().includes('file') && 
      (errorMessage.toLowerCase().includes('size') || errorMessage.toLowerCase().includes('large'))) {
    return 'התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.';
  }

  // Generic fallback
  return 'אירעה שגיאה לא צפויה. אנא נסה שנית מאוחר יותר.';
}

/**
 * Shows an error message using a message modal component
 * @param {HTMLElement} modalElement - The message modal element
 * @param {Error|Object} error - The error to display
 * @param {string} context - Optional context for the error (e.g., 'recipe upload', 'form validation')
 */
export function showErrorModal(modalElement, error, context = '') {
  if (!modalElement || typeof modalElement.show !== 'function') {
    console.error('Invalid modal element provided to showErrorModal');
    return;
  }

  const userFriendlyMessage = getErrorMessage(error);
  modalElement.show(userFriendlyMessage, '', 'סגור');
}

/**
 * Logs error details for debugging while showing user-friendly message
 * @param {Error|Object} error - The error to log
 * @param {string} context - Context where the error occurred
 */
export function logError(error, context = '') {
  const errorInfo = {
    context,
    code: error?.code,
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  };
  
  console.error('[Error Handler]', errorInfo);
}