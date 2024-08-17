// auth.js

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('auth-modal');
  const authTrigger = document.getElementById('auth-trigger');
  const closeBtn = document.getElementsByClassName('close')[0];
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');

  // Open modal
  authTrigger.onclick = () => modal.style.display = "block";

  // Close modal
  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (event) => {
      if (event.target == modal) modal.style.display = "none";
  }

  // Tab switching
  tabs.forEach(tab => {
      tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          forms.forEach(f => f.classList.remove('active'));
          tab.classList.add('active');
          document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
      });
  });

  // Login
  document.getElementById('login-submit').addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const remember = document.getElementById('remember-me').checked;

      firebase.auth().setPersistence(remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION)
          .then(() => {
              return firebase.auth().signInWithEmailAndPassword(email, password);
          })
          .then((userCredential) => {
              console.log('User logged in:', userCredential.user);
              modal.style.display = "none";
              updateUIForUser(userCredential.user);
          })
          .catch((error) => {
              console.error('Login error:', error);
              showError('login-form', error.message);
          });
  });

  // Sign Up
  document.getElementById('signup-submit').addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      firebase.auth().createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
              console.log('User signed up:', userCredential.user);
              userCredential.user.sendEmailVerification();
              modal.style.display = "none";
              updateUIForUser(userCredential.user);
          })
          .catch((error) => {
              console.error('Signup error:', error);
              showError('signup-form', error.message);
          });
  });

  // Reset Password
  document.getElementById('reset-submit').addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value;

      firebase.auth().sendPasswordResetEmail(email)
          .then(() => {
              alert('Password reset email sent. Check your inbox.');
              modal.style.display = "none";
          })
          .catch((error) => {
              console.error('Reset password error:', error);
              showError('reset-form', error.message);
          });
  });

  // Google Sign In
  document.getElementById('google-signin').addEventListener('click', (e) => {
      e.preventDefault();
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
          .then((result) => {
              console.log('Google sign in:', result.user);
              modal.style.display = "none";
              updateUIForUser(result.user);
          }).catch((error) => {
              console.error('Google sign in error:', error);
              showError('login-form', error.message);
          });
  });

  // Update UI for logged in user
  function updateUIForUser(user) {
      const authTrigger = document.getElementById('auth-trigger');
      authTrigger.innerHTML = `<div class="avatar">${user.email[0].toUpperCase()}</div>`;
      // You can add more UI updates here
  }

  // Show error messages
  function showError(formId, message) {
      const form = document.getElementById(formId);
      const errorDiv = form.querySelector('.error-message') || document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      if (!form.querySelector('.error-message')) {
          form.appendChild(errorDiv);
      }
  }

  // Check auth state
  firebase.auth().onAuthStateChanged((user) => {
      if (user) {
          updateUIForUser(user);
      } else {
          document.getElementById('auth-trigger').innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
          `;
      }
  });
});