// auth.js

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('auth-modal');
  const modalContent = modal.querySelector('.modal-content');
  const authTrigger = document.getElementById('auth-trigger');
  const closeBtn = document.getElementsByClassName('close')[0];
  const tabs = modalContent.querySelectorAll('.auth-tab:not(.close)');
  const forms = modalContent.querySelectorAll('.auth-form');

  console.log('Modal:', modal);
  console.log('Modal Content:', modalContent);
  console.log('Auth Trigger:', authTrigger);
  console.log('Close Button:', closeBtn);
  console.log('Tabs:', tabs);
  console.log('Forms:', forms);
  
  // Firebase storage
  const storage = firebase.storage();
  const storageRef = storage.ref();
  const avatarsRef = storageRef.child('Avatars');

  // Function to get avatar URLs
  async function getAvatarUrls() {
    try {
      const result = await avatarsRef.listAll();
      const urlPromises = result.items.map(imageRef => imageRef.getDownloadURL());
      return await Promise.all(urlPromises);
    } catch (error) {
      console.error("Error getting avatars:", error);
      return [];
    }
  }

  // Open modal
  authTrigger.addEventListener('click', handleAuthTriggerClick);

  function handleAuthTriggerClick() {
    const user = firebase.auth().currentUser;
    if (user) {
      // User is signed in, show signed user content
      updateUIForUser(user, true);
    } else {
      // User is not signed in, show unsigned user content
      modal.style.display = "block";
      populateUnsignedUserContent();
    }
  }

  // Populate modal for unsigned user
  function populateUnsignedUserContent() {
    console.log('Populating unsigned user content');
    const htmlContent = `
      <div class="auth-tabs">
        <button class="auth-tab active" id="auth-login" data-tab="login">Login</button>
        <button class="auth-tab" id="auth-sign-up" data-tab="signup">Sign Up</button>
        <button class="auth-tab" id="auth-reset" data-tab="reset">Reset Password</button>
        <button class="auth-tab close" id="auth-close">&times;</button>
      </div>
      <div id="login-form" class="auth-form active">
        <input type="email" id="login-email" placeholder="Email" required>
        <input type="password" id="login-password" placeholder="Password" required>
        <div class="remember-me">
          <input type="checkbox" id="remember-me">
          <label for="remember-me">Remember Me</label>
        </div>
        <button id="login-submit" class="base-button">Login</button>
        <button id="google-signin" class="base-button google-btn">Sign in with Google</button>
      </div>
      <div id="signup-form" class="auth-form">
        <input type="email" id="signup-email" placeholder="Email" required>
        <input type="password" id="signup-password" placeholder="Password" required>
        <button id="signup-submit" class="base-button">Sign Up</button>
        <button id="google-signup" class="base-button">Sign up with Google</button>
      </div>
      <div id="reset-form" class="auth-form">
        <input type="email" id="reset-email" placeholder="Email" required>
        <button id="reset-submit" class="base-button">Reset Password</button>
      </div>
    `;
    console.log('HTML content to be set:', htmlContent);
    modalContent.innerHTML = htmlContent;
    console.log('HTML content after setting:', modalContent.innerHTML);
    
    // Reattach event listeners
    attachEventListeners();
  }

  function attachEventListeners() {
    document.getElementById('login-submit').addEventListener('click', handleLogin);
    document.getElementById('signup-submit').addEventListener('click', handleSignup);
    document.getElementById('reset-submit').addEventListener('click', handlePasswordReset);
    document.getElementById('google-signin').addEventListener('click', handleGoogleSignIn);
    document.getElementById('google-signup').addEventListener('click', handleGoogleSignIn);
    
    // Add close button event listener
    const closeBtn = document.getElementById('auth-close');
    if (closeBtn) {
      closeBtn.onclick = () => modal.style.display = "none";
    }
  
    // Add tab switching event listeners
    const tabs = modalContent.querySelectorAll('.auth-tab:not(.close)');
    const forms = modalContent.querySelectorAll('.auth-form');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        const formId = `${tab.dataset.tab}-form`;
        const form = document.getElementById(formId);
        if (form) {
          form.classList.add('active');
        }
      });
    });
  }

  // Populate modal for signed user
  async function populateSignedUserContent(user) {
    console.log('Populating signed user content');
    const avatarUrls = await getAvatarUrls();
    console.log('Avatar URLs:', avatarUrls);
    
    const avatarOptions = avatarUrls.map((url, index) => `
      <button class="avatar-button ${user.photoURL === url ? 'selected' : ''}" data-avatar-url="${url}">
        <img src="${url}" alt="Avatar ${index + 1}" class="avatar-option">
      </button>
    `).join('');
  
    const htmlContent = `
      <button class="auth-tab close" id="signed-close">&times;</button>
      <h2>Welcome, ${user.displayName || user.email}</h2>
      <div id="avatar-selection">
        <h3>Choose your avatar:</h3>
        <div class="avatar-options">
          ${avatarOptions}
        </div>
      </div>
      <div class="profile-buttons">
        <button id="save-avatar" class="base-button">Save Avatar</button>
        <button id="logout-button" class="base-button">Log Out</button>
      </div>
    `;
  
    console.log('HTML content to be set:', htmlContent);
    modalContent.innerHTML = htmlContent;
    console.log('HTML content after setting:', modalContent.innerHTML);
  
    const avatarButtons = document.querySelectorAll('.avatar-button');
    avatarButtons.forEach(button => {
      button.addEventListener('click', function() {
        avatarButtons.forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
      });
    });

    document.getElementById('save-avatar').addEventListener('click', saveAvatar);
    document.getElementById('logout-button').addEventListener('click', logoutUser);
    
    // Add event listener for the close button
    document.getElementById('signed-close').addEventListener('click', () => {
      modal.style.display = "none";
    });
  }

  // Handle Login
  function handleLogin(e) {
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
        updateUIForUser(userCredential.user, true);
        // modal.style.display = "none"; // hide pop up after signin
      })
      .catch((error) => {
        console.error('Login error:', error);
        showError('login-form', error.message);
      });
  }

  // Handle Signup
  function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('User signed up:', userCredential.user);
        userCredential.user.sendEmailVerification();
        updateUIForUser(userCredential.user, true);
        // modal.style.display = "none"; // hide pop up after signin
      })
      .catch((error) => {
        console.error('Signup error:', error);
        showError('signup-form', error.message);
      });
  }

  // Handle Password Reset
  function handlePasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        alert('Password reset email sent. Check your inbox.');
        modal.style.display = "none"; // hide pop up after signin
      })
      .catch((error) => {
        console.error('Reset password error:', error);
        showError('reset-form', error.message);
      });
  }

  // Handle Google Sign In
  function handleGoogleSignIn(e) {
    e.preventDefault();
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        console.log('Google sign in:', result.user);
        updateUIForUser(userCredential.user, true);
        // modal.style.display = "none"; //hide pop up after signing in
      }).catch((error) => {
        console.error('Google sign in error:', error);
        showError('login-form', error.message);
      });
  }

  // Save Avatar
  function saveAvatar() {
    const selectedAvatar = document.querySelector('.avatar-button.selected');
    if (!selectedAvatar) {
      console.error('No avatar selected');
      return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('No user is currently signed in');
      return;
    }

    const newAvatarUrl = selectedAvatar.dataset.avatarUrl;

    user.updateProfile({
      photoURL: newAvatarUrl
    }).then(() => {
      console.log('Avatar updated successfully');
      updateUIForUser(user);
      // Update Firestore
      return firebase.firestore().collection('users').doc(user.uid).set({
        avatarUrl: newAvatarUrl
      }, { merge: true });
    }).then(() => {
      console.log('Firestore updated successfully');
      // Close the modal
      modal.style.display = "none";
    }).catch((error) => {
      console.error('Error updating avatar:', error);
      alert('Failed to save avatar. Please try again.');
    });
  }

  // Log Out
  function logoutUser() {
    firebase.auth().signOut().then(() => {
      console.log('User signed out');
      modal.style.display = "none";
      updateUIForUnsignedUser();
    }).catch((error) => {
      console.error('Sign out error:', error);
    });
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

  // Update UI for logged in user
  function updateUIForUser(user, showModal = false) {
    const authTrigger = document.getElementById('auth-trigger');
    if (user.photoURL) {
      authTrigger.innerHTML = `<img src="${user.photoURL}" alt="User Avatar" class="avatar">`;
    } else {
      authTrigger.innerHTML = `<div class="avatar">${user.email[0].toUpperCase()}</div>`;
    }

    if (showModal) {
      populateSignedUserContent(user);
      modal.style.display = "block";
    }
  }

  // Update UI for unsigned user
  function updateUIForUnsignedUser() {
    const authTrigger = document.getElementById('auth-trigger');
    authTrigger.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
    populateUnsignedUserContent();
  }

  // Check auth state
  let isInitialLoad = true;
  
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user.email);
      updateUIForUser(user);
    } else {
      console.log('User is signed out');
      updateUIForUnsignedUser();
    }
    isInitialLoad = false;

    // Update the click handler for the auth trigger
    const authTrigger = document.getElementById('auth-trigger');
    authTrigger.onclick = handleAuthTriggerClick;
  });

});