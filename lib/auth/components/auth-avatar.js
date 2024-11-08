/**
 * AuthAvatar Component
 * @class
 * @extends HTMLElement
 * 
 * @description
 * Header avatar component that serves as the main entry point for authentication
 */

class AuthAvatar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.initializeAuthListener();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .avatar {
          width: 30px;
          height: 30px;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .avatar.signed-out {
          background-color: var(--secondary-color);
          color: var(--text-color);
        }

        .avatar:hover {
          opacity: 0.8;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          border-radius: 5px;
          object-fit: cover;
        }

        .initial {
          font-family: var(--body-font);
          color: white;
          background-color: var(--primary-color);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
        }
      </style>
      
      <div class="avatar signed-out" id="auth-trigger">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    `;
  }

  setupEventListeners() {
    const trigger = this.shadowRoot.getElementById('auth-trigger');
    trigger.addEventListener('click', () => this.handleClick());

    // Listen for signup success to show profile
    document.addEventListener('signup-success', () => {
      const authContent = document.querySelector('auth-content');
      if (authContent) {
        authContent.showUserProfile();
      }
    });

    // Add listener for profile updates
    document.addEventListener('profile-updated', () => {
      const user = firebase.auth().currentUser;
      if (user) {
          this.updateAvatar(user);
      }
    });
  }

  initializeAuthListener() {
    firebase.auth().onAuthStateChanged(user => {
      this.updateAvatar(user);
    });
  }

  updateAvatar(user) {
    const avatar = this.shadowRoot.getElementById('auth-trigger');
    
    if (user) {
      avatar.classList.remove('signed-out');
      if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="User Avatar">`;
      } else {
        avatar.innerHTML = `<div class="initial">${user.email[0].toUpperCase()}</div>`;
      }
    } else {
      avatar.classList.add('signed-out');
      avatar.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      `;
    }
  }

  handleClick() {
    const user = firebase.auth().currentUser;
    const authController = document.querySelector('auth-controller');
    const authContent = document.querySelector('auth-content');
    
    if (!authController || !authContent) {
      console.error('Required components not found');
      return;
    }

    if (user) {
      // Show profile for logged in user
      authContent.showUserProfile();
    } else {
      // Show login form for non-authenticated user
      authContent.switchForm('login');
    }
    
    authController.openModal();
  }
}

customElements.define('auth-avatar', AuthAvatar);