// FIXME: when user logging in with different account, when opening modal for the first time, it shows the previous user's profile
/**
 * AuthController Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * A custom web component that manages authentication state and provides
 * core authentication functionality for the application.
 *
 * @example
 * // HTML
 * <auth-controller>
 *   <custom-modal>
 *     <!-- Auth content will be rendered here -->
 *   </custom-modal>
 * </auth-controller>
 *
 * @property {boolean} isAuthenticated - Indicates whether a user is currently authenticated
 * @property {Object} currentUser - The currently authenticated user object
 *
 * @fires auth-state-changed - When the authentication state changes
 * @fires user-role-changed - When the user's role changes
 *
 * @requires firebase
 * @requires ./modal.js
 */

import authService from '../../js/services/auth-service.js';

class AuthController extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  connectedCallback() {
    this.render();
    this.setupAuthStateObserver();
    authService.initialize();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: contents;
        }
      </style>
      <custom-modal height="auto">
        <slot></slot>
      </custom-modal>
    `;
  }

  styles() {
    return `
      :host {
        display: contents;
      }
    `;
  }

  setupAuthStateObserver() {
    authService.addAuthObserver((state) => {
      this.isAuthenticated = !!state.user;
      this.currentUser = state.user;

      if (state.user) {
        this.updateNavigation(state.user, {
          isManager: state.isManager,
          isApproved: state.isApproved,
        });
        this.dispatchAuthStateChanged({
          user: state.user,
          isAuthenticated: true,
          isManager: state.isManager,
          isApproved: state.isApproved,
        });
      } else {
        this.updateNavigation(null);
        this.dispatchAuthStateChanged({
          user: null,
          isAuthenticated: false,
          isManager: false,
          isApproved: false,
        });
      }
    });
  }

  updateNavigation(user, roles = { isManager: false, isApproved: false }) {
    const navMenu = document.querySelector('nav ul');
    if (!navMenu) return;

    // Remove dynamic tabs first
    ['profile-tab', 'documents-tab', 'dashboard-tab'].forEach((id) => {
      const tab = document.querySelector(`#${id}`);
      if (tab) tab.remove();
    });

    if (!user) return; // If no user, stop here with basic navigation

    // Helper function to create navigation item
    const createNavItem = (id, text, href) => {
      const item = document.createElement('li');
      item.id = id;
      const link = document.createElement('a');
      // Use clean URLs for History API routing
      link.href = href;
      link.textContent = text;
      link.classList.add('btn-3d');
      item.appendChild(link);
      return item;
    };

    // Add Favorites tab for all logged in users - redirect to categories page with favorites filter
    navMenu.appendChild(createNavItem('profile-tab', 'מועדפים', '/categories?favorites=true'));

    // Add Grandmother's Recipes for approved users and managers
    if (roles.isApproved || roles.isManager) {
      navMenu.appendChild(createNavItem('documents-tab', 'המטעמים של סבתא', '/grandmas-cooking'));
    }

    // Add Management Interface for managers
    if (roles.isManager) {
      navMenu.appendChild(createNavItem('dashboard-tab', 'ממשק ניהול', '/dashboard'));
    }

    // Sync mobile drawer navigation if it exists
    if (window.syncMobileDrawerNavigation) {
      window.syncMobileDrawerNavigation();
    }
  }

  getCorrectPath(path) {
    // Check if we're on index page or in a subdirectory
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
      return '.' + path;
    }
    return '..' + path;
  }

  dispatchAuthStateChanged(detail) {
    const event = new CustomEvent('auth-state-changed', {
      bubbles: true,
      composed: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  // Authentication Methods
  async handleLogin(email, password, remember = false) {
    try {
      return await authService.login(email, password, remember);
    } catch (error) {
      console.error('AuthService Error:', {
        code: error.code,
        message: error.message,
        fullError: error,
      });
      throw error;
    }
  }

  async handleSignup(email, password, fullName) {
    try {
      return await authService.signup(email, password, fullName);
    } catch (error) {
      throw error;
    }
  }

  async handleGoogleSignIn() {
    try {
      return await authService.loginWithGoogle();
    } catch (error) {
      throw error;
    }
  }

  async handlePasswordReset(email) {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  }

  async handleLogout() {
    try {
      await authService.logout();
    } catch (error) {
      throw error;
    }
  }

  async updateUserAvatar(avatarUrl) {
    try {
      await authService.updateProfile({ avatarUrl: avatarUrl });
      this.dispatchAuthStateChanged({
        user: authService.getCurrentUser(),
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  }

  // Modal Control Methods
  openModal() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.open();
  }

  closeModal() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.close();
  }
}

customElements.define('auth-controller', AuthController);
