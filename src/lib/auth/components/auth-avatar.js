/**
 * AuthAvatar Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * Header avatar component that serves as the main entry point for authentication
 */

import authService from '../../../js/services/auth-service.js';
import './auth-content.js';

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
        :host {
          display: block;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.3s ease;
          background-color: #e5e7eb; /* bg-gray-200 */
          color: #4b5563; /* text-gray-600 */
          overflow: hidden;
        }

        /* Hover state */
        .avatar:hover {
          background-color: #d1d5db; /* hover:bg-gray-300 */
        }

        /* Signed out state - use specific style if needed, otherwise default gray circle */
        .avatar.signed-out {
          background-color: #e5e7eb;
          color: #4b5563;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
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
          border-radius: 50%;
        }
      </style>
      
      <div class="avatar signed-out" id="auth-trigger">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="24" height="24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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
      const user = authService.getCurrentUser();
      if (user) {
        this.updateAvatar(user);
      }
    });
  }

  initializeAuthListener() {
    authService.addAuthObserver((state) => {
      this.updateAvatar(state.user);
    });
  }

  updateAvatar(user) {
    const avatar = this.shadowRoot.getElementById('auth-trigger');

    if (user) {
      avatar.classList.remove('signed-out');

      // Use centralized avatar URL from auth service
      const avatarUrl = authService.getCurrentAvatarUrl();

      if (avatarUrl) {
        avatar.innerHTML = `<img src="${avatarUrl}" alt="User Avatar">`;
      } else {
        avatar.innerHTML = `<div class="initial">${user.email[0].toUpperCase()}</div>`;
      }
    } else {
      avatar.classList.add('signed-out');
      // Reset to default user icon
      avatar.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="24" height="24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      `;
    }
  }

  handleClick() {
    const user = authService.getCurrentUser();
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
      authContent.showAuthForms();
    }

    authController.openModal();
  }
}

customElements.define('auth-avatar', AuthAvatar);
