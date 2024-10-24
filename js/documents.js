document.addEventListener('DOMContentLoaded', function() {
  // Check authentication first
  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
          checkUserAccess(user);
      } else {
          showError('יש להתחבר כדי לצפות במסמך זה');
          redirectToHome();
      }
  });
});

// Check if user has access
async function checkUserAccess(user) {
  try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
          showError('משתמש לא נמצא');
          return;
      }

      const userRole = userDoc.data().role;
      if (userRole === 'approved' || userRole === 'manager') {
          loadPDF();
      } else {
          showError('אין לך הרשאה לצפות במסמך זה');
      }
  } catch (error) {
      console.error('Error checking user access:', error);
      showError('אירעה שגיאה בבדיקת ההרשאות');
  }
}

// Load PDF from Firebase Storage
async function loadPDF() {
  try {
      const storageRef = firebase.storage().ref();
      const pdfRef = storageRef.child('documents/grandma_cook_book.pdf');
      const url = await pdfRef.getDownloadURL();
      
      // Hide loading message and show PDF
      document.getElementById('loading-message').style.display = 'none';
      const iframe = document.getElementById('pdf-iframe');
      // Add #page=1&view=FitH to show one page at a time
      iframe.src = `${url}#page=1&view=Fit&pagemode=none#layout=SinglePage`;
      iframe.style.display = 'block';
      
  } catch (error) {
      console.error('Error loading PDF:', error);
      showError('אירעה שגיאה בטעינת המסמך');
  }
}

// Utility functions
function showError(message) {
  const errorElement = document.getElementById('error-message');
  const loadingElement = document.getElementById('loading-message');
  const iframeElement = document.getElementById('pdf-iframe');
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  loadingElement.style.display = 'none';
  iframeElement.style.display = 'none';
}

function redirectToHome() {
  setTimeout(() => {
      window.location.href = '../index.html';
  }, 3000);
}