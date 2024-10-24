// auth.js

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('auth-modal');
  const modalContent = modal.querySelector('.modal-content');
  const authTrigger = document.getElementById('auth-trigger');
  const closeBtn = document.getElementsByClassName('close')[0];
  const tabs = modalContent.querySelectorAll('.auth-tab:not(.close)');
  const forms = modalContent.querySelectorAll('.auth-form');
  
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
    modalContent.innerHTML = htmlContent;
    
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
    const avatarUrls = await getAvatarUrls();
    
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
  
    modalContent.innerHTML = htmlContent;
  
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
        updateUIForUser(userCredential.user, true);
        // modal.style.display = "none"; // hide pop up after signin
      })
      .catch((error) => {
        console.error('Login error:', error);
        showError('login-form', error.message);
      });
  }

  function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User signed up:', userCredential.user);
            // Add user to Firestore with default role
            return db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                role: 'user'  // Default role
            });
        })
        .then(() => {
            console.log('User added to Firestore');
            updateUIForUser(userCredential.user);
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
      updateUIForUser(user);
      // Update Firestore
      return firebase.firestore().collection('users').doc(user.uid).set({
        avatarUrl: newAvatarUrl
      }, { merge: true });
    }).then(() => {
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

    // Check roles and update navigation
    checkUserRoles(user).then(({ isManager, isApproved }) => {
        // Check if the user is a manager and add dashboard tab
        if (isManager) {
            const navMenu = document.querySelector('nav ul');
            const existingDashboardTab = document.querySelector('#dashboard-tab');
            if (!existingDashboardTab) {
                const dashboardTab = document.createElement('li');
                dashboardTab.id = 'dashboard-tab';
                const dashboardLink = document.createElement('a');
                if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                  dashboardLink.href = './pages/manager-dashboard.html';
                } else {
                  dashboardLink.href = './manager-dashboard.html';
                }
                dashboardLink.textContent = 'Dashboard';
                dashboardTab.appendChild(dashboardLink);
                navMenu.appendChild(dashboardTab);
            }
        }

        // Add documents tab for approved users or managers
        if (isApproved || isManager) {
            const navMenu = document.querySelector('nav ul');
            const existingDocumentsTab = document.querySelector('#documents-tab');
            if (!existingDocumentsTab) {
                const documentsTab = document.createElement('li');
                documentsTab.id = 'documents-tab';
                const documentsLink = document.createElement('a');
                if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                  dashboardLink.href = './pages/documents.html';
                } else {
                  dashboardLink.href = './documents.html';
                }
                documentsLink.textContent = "Grandma's Cookbook";
                documentsTab.appendChild(documentsLink);
                navMenu.appendChild(documentsTab);
            }
        }
    });

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

    // Ensure the dashboard tab is removed for unsigned users
    updateDashboardTab(false);
  }


  
  // Check auth state
  let isInitialLoad = true;
  
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      updateUIForUser(user);
    } else {
      updateUIForUnsignedUser();
    }
    isInitialLoad = false;

    // Update the click handler for the auth trigger
    const authTrigger = document.getElementById('auth-trigger');
    authTrigger.onclick = handleAuthTriggerClick;
  });

  function updateDashboardTab(show) {
    const navMenu = document.querySelector('nav ul'); // Adjust this selector to match your header's navigation menu
    const existingDashboardTab = document.querySelector('#dashboard-tab');
    
    if (show) {
        if (!existingDashboardTab) {
            const dashboardTab = document.createElement('li');
            dashboardTab.id = 'dashboard-tab';
            const dashboardLink = document.createElement('a');
            // Check if the current page is index.html
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
              dashboardLink.href = './pages/manager-dashboard.html';
            } else {
                dashboardLink.href = './manager-dashboard.html';
            }            
            dashboardLink.textContent = 'Dashboard';
            dashboardTab.appendChild(dashboardLink);
            navMenu.appendChild(dashboardTab);
        }
    } else {
        if (existingDashboardTab) {
            existingDashboardTab.remove();
        }
    }
  } 

  // Function to check if a user has manager status
  function checkUserRoles(user) {
    return db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const role = doc.data().role;
                return {
                    isManager: role === 'manager',
                    isApproved: role === 'approved' || role === 'manager'
                };
            }
            return { isManager: false, isApproved: false };
        });
  }
});