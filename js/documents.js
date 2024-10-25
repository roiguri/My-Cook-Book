
document.addEventListener('DOMContentLoaded', function () {
  // Check if the user is authenticated and has manager or approved privileges
  firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
          checkDocumentAccessStatus(user).then(function (hasAccess) {
              if (!hasAccess) {
                  // Redirect to home if not authorized
                  window.location.href = '/';
              } // No else block needed, as you don't need to initialize anything
          });
      } else {
          // Redirect to home if not logged in
          window.location.href = '/';
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