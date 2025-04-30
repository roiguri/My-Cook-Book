import { getAuthInstance, getFirestoreInstance } from '../js/services/firebase-service.js';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', function () {
  const auth = getAuthInstance();
  const db = getFirestoreInstance();
  // Check if the user is authenticated and has manager or approved privileges
  onAuthStateChanged(auth, function (user) {
    const baseUrl = window.location.pathname.includes('My-Cook-Book') ? '/My-Cook-Book/' : '/'; // Adjust 'My-Cook-Book' if your GitHub Pages repo name is different

    if (user) {
      checkDocumentAccessStatus(db, user).then(function (hasAccess) {
        if (!hasAccess) {
          // Redirect to home if not authorized
          window.location.href = baseUrl;
        } // No else block needed, as you don't need to initialize anything
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
