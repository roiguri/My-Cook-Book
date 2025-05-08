import { FirestoreService } from '../js/services/firestore-service.js';
import authService from '../js/services/auth-service.js';

document.addEventListener('DOMContentLoaded', function () {
  authService.addAuthObserver((state) => {
    const baseUrl = window.location.pathname.includes('My-Cook-Book') ? '/My-Cook-Book/' : '/';
    if (state.user) {
      checkDocumentAccessStatus(state.user).then(function (hasAccess) {
        if (!hasAccess) {
          // Redirect to home if not authorized
          window.location.href = baseUrl;
        }
      });
    } else {
      // Redirect to home if not logged in
      window.location.href = baseUrl;
    }
  });
});

async function checkDocumentAccessStatus(user) {
  const userDoc = await FirestoreService.getDocument('users', user.uid);
  if (userDoc) {
    const userRole = userDoc.role;
    return userRole === 'manager' || userRole === 'approved';
  }
  return false;
}
