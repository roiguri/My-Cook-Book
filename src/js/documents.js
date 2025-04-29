
import { auth, db, storage } from '../js/config/firebase-config.js';

document.addEventListener('DOMContentLoaded', function () {
  // Check if the user is authenticated and has manager or approved privileges
  firebase.auth().onAuthStateChanged(function (user) {
      const baseUrl = window.location.pathname.includes('My-Cook-Book') ? '/My-Cook-Book/' : '/'; // Adjust 'My-Cook-Book' if your GitHub Pages repo name is different
  
      if (user) {
          checkDocumentAccessStatus(user).then(function (hasAccess) {
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

function checkDocumentAccessStatus(user) {
  return db.collection('users').doc(user.uid).get().then((doc) => {
      if (doc.exists) {
          const userRole = doc.data().role;
          return userRole === 'manager' || userRole === 'approved';
      }
      return false;
  });
}