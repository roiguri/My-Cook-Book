import { getFirestoreInstance } from '../js/services/firebase-service.js';
import authService from '../js/services/auth-service.js';
import { doc, getDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', function () {
  const db = getFirestoreInstance();
  authService.addAuthObserver((state) => {
    const baseUrl = window.location.pathname.includes('My-Cook-Book') ? '/My-Cook-Book/' : '/';
    if (state.user) {
      checkDocumentAccessStatus(db, state.user).then(function (hasAccess) {
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

async function checkDocumentAccessStatus(db, user) {
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    const userRole = userDocSnap.data().role;
    return userRole === 'manager' || userRole === 'approved';
  }
  return false;
}
