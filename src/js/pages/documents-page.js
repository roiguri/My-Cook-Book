import { FirestoreService } from '../services/firestore-service.js'; // Adjusted path
import authService from '../services/auth-service.js'; // Adjusted path

let authObserverUnsubscribe = null;

/**
 * Checks if the user has the required role to access documents.
 * @param {object} user - The user object from Firebase auth.
 * @returns {Promise<boolean>} True if the user has access, false otherwise.
 */
async function checkDocumentAccessStatus(user) {
  if (!user || !user.uid) {
    console.log('checkDocumentAccessStatus: No user or UID provided.');
    return false;
  }
  try {
    const userDoc = await FirestoreService.getDocument('users', user.uid);
    if (userDoc && userDoc.role) {
      const userRole = userDoc.role;
      // Check if the user's role is 'manager' or 'approved'
      return userRole === 'manager' || userRole === 'approved';
    }
    console.log(`User document or role not found for UID: ${user.uid}`);
    return false;
  } catch (error) {
    console.error('Error fetching user document for access check:', error);
    return false;
  }
}

/**
 * Initializes the documents page logic, primarily setting up an auth observer
 * to check user access rights.
 * @param {HTMLElement} contentElement - The parent DOM element where the documents page content is loaded.
 *                                     This parameter is kept for consistency but might not be directly used
 *                                     if the page's content is static HTML and access is the only concern.
 */
export function initDocumentsPage(contentElement) {
  console.log('Initializing Documents Page...');

  // Clean up any existing observer before setting a new one
  if (authObserverUnsubscribe) {
    console.log('Cleaning up previous auth observer for documents page.');
    authObserverUnsubscribe();
    authObserverUnsubscribe = null;
  }

  authObserverUnsubscribe = authService.addAuthObserver(async (state) => {
    if (state.user) {
      console.log('User is logged in. Checking document access status...');
      const hasAccess = await checkDocumentAccessStatus(state.user);
      if (!hasAccess) {
        console.log('User does not have access to documents. Redirecting to home.');
        window.location.hash = '#/'; // Redirect to SPA home
      } else {
        console.log('User has access to documents.');
        // Content is already loaded by page-loader.js, so nothing more to do here.
        // If specific elements within contentElement needed initialization based on access,
        // that logic would go here.
        return true; 
      }
    } else {
      console.log('No user logged in. Redirecting to home.');
      window.location.hash = '#/'; // Redirect to SPA home
    }
  });
}

/**
 * Cleans up the documents page by removing the auth observer.
 */
export function cleanupDocumentsPage() {
  console.log('Cleaning up Documents Page...');
  if (authObserverUnsubscribe) {
    authObserverUnsubscribe();
    authObserverUnsubscribe = null;
    console.log('Auth observer for documents page removed.');
  } else {
    console.log('No auth observer to remove for documents page.');
  }
}
