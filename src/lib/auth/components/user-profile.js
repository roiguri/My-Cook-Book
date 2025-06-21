/**
 * UserProfile Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * Handles user profile view with avatar selection
 */

import './auth-content.js';
import '../../modals/message-modal/message-modal.js';
import { getDownloadURL } from 'firebase/storage';
import { StorageService } from '../../../js/services/storage-service.js';
import authService from '../../../js/services/auth-service.js';

class UserProfile extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedAvatarUrl = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.loadAvatars();

    // Re-render if user data loads after component mount
    authService.addAuthObserver((state) => {
      if (state.user) {
        this.updateWelcomeText();
        // Update avatar selection when auth state includes avatar URL
        if (state.avatarUrl !== undefined) {
          this.updateAvatarSelection(state.avatarUrl);
        }
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .profile-container {
          display: flex;
          flex-direction: column;
          padding: 20px;
          gap: 20px;
        }

        .welcome-text {
          font-size: 1.5em;
          color: var(--text-color);
          text-align: center;
          font-family: var(--heading-font-he);
        }

        .section-title {
          font-size: 1.1em;
          color: var(--text-color);
          margin-bottom: 10px;
        }

        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
          padding: 15px;
          background-color: var(--secondary-color);
          border-radius: 10px;
        }

        .avatar-button {
          background: none;
          border: 3px solid transparent;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.3s ease;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-button:hover {
          background-color: color-mix(in srgb, var(--primary-color), white 40%);
        }

        .avatar-button.selected {
          border-color: var(--primary-dark);
          background-color: color-mix(in srgb, var(--primary-color), white 40%);  
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 5px;
          object-fit: cover;
        }

        .buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .save-button {
          background-color: var(--primary-color);
          color: white;
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .save-button:hover {
          background-color: var(--primary-hover);
        }

        .signout-button {
          background-color: color-mix(in srgb, var(--background-color), black 10%);
          color: var(--primary-color);
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .signout-button:hover {
          background-color: color-mix(in srgb, var(--background-color), black 20%);
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: var(--text-color);
        }

        .error-message {
          color: red;
          font-size: 0.9em;
          margin-top: 5px;
          display: none;
        }

        .error-message.visible {
          display: block;
        }
      </style>

      <div class="profile-container">
        <div class="welcome-text">ברוך הבא!</div>

        <div>
          <div class="section-title">בחר תמונת פרופיל:</div>
          <div class="avatar-grid">
            <div class="loading">טוען תמונות פרופיל...</div>
          </div>
          <div class="error-message" id="avatar-error"></div>
        </div>

        <div class="buttons">
          <button class="save-button">שמור שינויים</button>
          <button class="signout-button">התנתק</button>
        </div>
      </div>
    `;

    this.updateWelcomeText();
  }

  setupEventListeners() {
    const saveButton = this.shadowRoot.querySelector('.save-button');
    const signoutButton = this.shadowRoot.querySelector('.signout-button');

    saveButton.addEventListener('click', () => this.handleSave());
    signoutButton.addEventListener('click', () => this.handleSignout());
  }

  updateWelcomeText() {
    const user = authService.getCurrentUser();
    const displayName = user?.displayName || user?.email?.split('@')[0] || '';
    const welcomeText = this.shadowRoot.querySelector('.welcome-text');
    if (welcomeText) {
      welcomeText.textContent = `ברוך הבא ${displayName}!`;
    }
  }

  async loadAvatars() {
    try {
      const avatarGrid = this.shadowRoot.querySelector('.avatar-grid');
      // Get avatar URLs from Firebase Storage
      const avatarList = await StorageService.listFiles('Avatars');
      // Clear loading message
      avatarGrid.innerHTML = '';

      // Add avatars to grid
      for (const avatarRef of avatarList.items) {
        const url = await getDownloadURL(avatarRef);
        const button = document.createElement('button');
        button.className = 'avatar-button';
        button.innerHTML = `<img src="${url}" alt="Avatar" class="avatar-image">`;
        button.addEventListener('click', () => this.selectAvatar(button, url));
        avatarGrid.appendChild(button);
      }

      const currentAvatarUrl = authService.getCurrentAvatarUrl();
      this.updateAvatarSelection(currentAvatarUrl);
    } catch (error) {
      console.error('Error loading avatars:', error);
      this.showError('שגיאה בטעינת תמונות הפרופיל. אנא נסה שנית.');
    }
  }

  updateAvatarSelection(currentAvatarUrl) {
    // Clear all selections first
    this.shadowRoot.querySelectorAll('.avatar-button').forEach((btn) => {
      btn.classList.remove('selected');
    });

    // Set the selected avatar URL
    this.selectedAvatarUrl = currentAvatarUrl || null;

    // If we have a current avatar URL, find and select the matching button
    if (currentAvatarUrl) {
      const avatarButtons = this.shadowRoot.querySelectorAll('.avatar-button');
      for (const button of avatarButtons) {
        const img = button.querySelector('img');
        if (img && img.src === currentAvatarUrl) {
          button.classList.add('selected');
          break;
        }
      }
    }
  }

  selectAvatar(button, url) {
    // Remove selection from all buttons
    this.shadowRoot.querySelectorAll('.avatar-button').forEach((btn) => {
      btn.classList.remove('selected');
    });
    // Add selection to clicked button
    button.classList.add('selected');
    this.selectedAvatarUrl = url;
  }

  async handleSave() {
    if (!this.selectedAvatarUrl) {
      this.showError('אנא בחר תמונת פרופיל');
      return;
    }
    try {
      const authController = this.closest('auth-controller');
      await authController.updateUserAvatar(this.selectedAvatarUrl);
      // Dispatch success event
      this.dispatchEvent(
        new CustomEvent('profile-updated', {
          bubbles: true,
          composed: true,
        }),
      );
      // Close modal
      authController.closeModal();
    } catch (error) {
      console.error('Error saving avatar:', error);
      this.showError('שגיאה בשמירת תמונת הפרופיל. אנא נסה שנית.');
    }
  }

  async handleSignout() {
    try {
      const authController = this.closest('auth-controller');
      await authController.handleLogout();
      // Reset auth content state before closing
      const authContent = this.closest('auth-content');
      authContent?.showAuthForms();
      authController.closeModal();
    } catch (error) {
      console.error('Error signing out:', error);
      this.showError('שגיאה בהתנתקות. אנא נסה שנית.');
    }
  }

  showError(message) {
    const errorElement = this.shadowRoot.getElementById('avatar-error');
    errorElement.textContent = message;
    errorElement.classList.add('visible');
  }

  clearError() {
    const errorElement = this.shadowRoot.getElementById('avatar-error');
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
  }
}

customElements.define('user-profile', UserProfile);
