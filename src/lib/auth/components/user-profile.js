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

// Cache for avatar URLs to avoid re-fetching
let avatarCache = null;

class UserProfile extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedAvatarUrl = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();

    // Initialize with current user's avatar
    const currentAvatarUrl = authService.getCurrentAvatarUrl();
    if (currentAvatarUrl) {
      this.selectedAvatarUrl = currentAvatarUrl;
    }

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
        }

        .welcome-text {
          font-size: 1.5em;
          color: var(--text-color);
          text-align: center;
          font-family: var(--heading-font-he);
          margin-bottom: 20px;
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
          padding: 10px;
          background-color: var(--secondary-color);
          border-radius: 10px;
          min-height: 200px; /* Prevent collapse during loading */
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
          overflow: hidden;
          position: relative;
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
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .avatar-image.loaded {
          opacity: 1;
        }

        .buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .my-meal-button {
          background-color: var(--secondary-color);
          color: var(--text-color);
          padding: 12px;
          border: 1px solid var(--primary-color);
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .my-meal-button:hover {
          background-color: color-mix(in srgb, var(--primary-color), white 80%);
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

        /* Skeleton Loading Animation */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .avatar-button.loading {
          background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          cursor: wait;
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
            <!-- Avatars will be injected here -->
          </div>
          <div class="error-message" id="avatar-error"></div>
        </div>

        <div class="buttons">
          <button class="my-meal-button" id="my-meal-btn">
            <i class="fas fa-utensils"></i> הארוחה שלי
          </button>
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
    const myMealButton = this.shadowRoot.querySelector('#my-meal-btn');

    saveButton.addEventListener('click', () => this.handleSave());
    signoutButton.addEventListener('click', () => this.handleSignout());

    if (myMealButton) {
      myMealButton.addEventListener('click', () => {
        const authController = this.closest('auth-controller');
        if (authController) authController.closeModal();

        // Navigate to my-meal
        // We need to use the router from the window.spa object
        if (window.spa && window.spa.router) {
          window.spa.router.navigate('/my-meal');
        } else {
          window.location.hash = '/my-meal'; // Fallback
        }
      });
    }
  }

  updateWelcomeText() {
    const user = authService.getCurrentUser();
    const displayName = user?.displayName || user?.email?.split('@')[0] || '';
    const welcomeText = this.shadowRoot.querySelector('.welcome-text');
    if (welcomeText) {
      welcomeText.textContent = `ברוך הבא ${displayName}!`;
    }
  }

  resetState() {
    // Reset to current user's actual avatar
    const currentAvatarUrl = authService.getCurrentAvatarUrl();
    if (currentAvatarUrl) {
      this.selectedAvatarUrl = currentAvatarUrl;
      this.updateAvatarSelection(currentAvatarUrl);
    }
  }

  async loadAvatars() {
    const avatarGrid = this.shadowRoot.querySelector('.avatar-grid');

    try {
      // Always show skeletons initially to prevent pop-in
      avatarGrid.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const btn = document.createElement('button');
        btn.className = 'avatar-button loading';
        avatarGrid.appendChild(btn);
      }

      // 1. Fetch URLs if not cached
      if (!avatarCache) {
        // Get avatar list from Firebase Storage
        const avatarList = await StorageService.listFiles('Avatars');

        // Fetch all URLs in parallel
        avatarCache = await Promise.all(avatarList.items.map((ref) => getDownloadURL(ref)));
      }

      // 2. Preload ALL images
      const imagePromises = avatarCache.map((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.className = 'avatar-image';
          img.alt = 'Avatar';
          img.src = url;
          // Resolve with result object whether success or error
          img.onload = () => resolve({ success: true, url, img });
          img.onerror = () => {
            console.error(`Failed to load avatar image: ${url}`);
            resolve({ success: false, url });
          };
        });
      });

      // Wait for ALL images to load (or fail)
      const results = await Promise.all(imagePromises);

      // 3. Render ALL at once
      avatarGrid.innerHTML = ''; // Clear skeletons

      results.forEach((result) => {
        if (result.success) {
          const button = document.createElement('button');
          button.className = 'avatar-button'; // Ready state
          button.dataset.url = result.url;

          result.img.classList.add('loaded');
          button.appendChild(result.img);

          // Check if this is the currently selected avatar
          if (this.selectedAvatarUrl === result.url) {
            button.classList.add('selected');
          }

          button.addEventListener('click', () => this.selectAvatar(button, result.url));
          avatarGrid.appendChild(button);
        }
      });

      // Ensure selection state is correct if selectedAvatarUrl was set before render
      const currentAvatarUrl = authService.getCurrentAvatarUrl();
      if (currentAvatarUrl) {
        this.updateAvatarSelection(currentAvatarUrl);
      }
    } catch (error) {
      console.error('Error loading avatars:', error);
      avatarGrid.innerHTML = ''; // Clear skeletons
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
        // Check dataset URL (more robust) or image src
        if (button.dataset.url === currentAvatarUrl) {
          button.classList.add('selected');
          break;
        }

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

    const saveButton = this.shadowRoot.querySelector('.save-button');
    const originalText = saveButton.textContent;

    saveButton.disabled = true;
    saveButton.textContent = 'שומר...';
    saveButton.setAttribute('aria-busy', 'true');

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
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = originalText;
      saveButton.removeAttribute('aria-busy');
    }
  }

  async handleSignout() {
    const signoutButton = this.shadowRoot.querySelector('.signout-button');
    const originalText = signoutButton.textContent;

    signoutButton.disabled = true;
    signoutButton.textContent = 'מתנתק...';
    signoutButton.setAttribute('aria-busy', 'true');

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
    } finally {
      signoutButton.disabled = false;
      signoutButton.textContent = originalText;
      signoutButton.removeAttribute('aria-busy');
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
