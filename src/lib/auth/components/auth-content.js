class AuthContent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .auth-container {
          width: 100%;
          min-width: 300px;
          box-sizing: border-box;
          padding-top: 20px;
        }
        
        .auth-tabs {
          display: flex;
          margin-bottom: 20px;
        }
        
        .auth-tab {
          background-color: var(--background-color, #E8D9B7);
          border: none;
          padding: 15px 30px;
          cursor: pointer;
          flex-grow: 1;
          text-align: center;
          font-size: 1.2em;
          font-family: var(--heading-font-he, 'Amatic SC');
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
          position: relative;
        }
        
        .auth-tab.active {
          background-color: var(--background-color, #FDF7E9);
          color: var(--primary-color, #A74C20);
          border-bottom: 2px solid var(--primary-color, #A74C20);
          font-weight: bold;
        }

        .auth-tab:first-child {
          border-top-right-radius: 10px;
        }

        .auth-tab:last-child {
          border-top-left-radius: 10px;
        }

        .auth-tabs.hidden {
          display: none;
        }

        .form-container {
          position: relative;
          min-height: 200px;
          padding: 0 20px 20px 20px;
        }

        /* Slots styling */
        ::slotted(*) {
          display: none !important;
        }

        ::slotted(.active) {
          display: block !important;
        }
      </style>

      <div class="auth-container">
        <div class="auth-tabs">
          <button class="auth-tab active" data-form="login">התחברות</button>
          <button class="auth-tab" data-form="signup">הרשמה</button>
        </div>
        
        <div class="form-container">
          <slot name="login-form"></slot>
          <slot name="signup-form"></slot>
          <slot name="forgot-password"></slot>
          <slot name="user-profile"></slot>
        </div>
      </div>
    `;

    // Initial state
    this.showAuthForms();
  }

  setupEventListeners() {
    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.auth-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => this.switchForm(tab.dataset.form));
    });

    // Listen for forgot password request
    this.addEventListener('switch-to-forgot-password', () => {
      this.showForgotPassword();
    });

    // Listen for back to login
    this.addEventListener('back-to-login', () => {
      this.showAuthForms();
      this.switchForm('login');
    });

    // Reset fields on modal close
    const authController = this.closest('auth-controller');
    const modal = authController?.shadowRoot?.querySelector('custom-modal');
    if (modal) {
      modal.addEventListener('modal-closed', () => {
        // Wait for close animation
        setTimeout(() => {
          // Reset all forms
          const loginForm = this.querySelector('[slot="login-form"]');
          const signupForm = this.querySelector('[slot="signup-form"]');
          const forgotPasswordForm = this.querySelector('[slot="forgot-password"]');

          loginForm?.reset();
          signupForm?.reset();
          forgotPasswordForm?.reset();

          // Clear any visible error messages
          const forms = [loginForm, signupForm, forgotPasswordForm];
          forms.forEach((form) => {
            const errorElement = form?.shadowRoot.querySelector('.error-message');
            if (errorElement) {
              errorElement.classList.remove('visible');
            }
          });

          // Reset to default state
          this.showAuthForms();
        }, 300);
      });
    }
  }

  // Show regular auth forms with tabs
  showAuthForms() {
    const tabsContainer = this.shadowRoot.querySelector('.auth-tabs');
    tabsContainer.classList.remove('hidden');

    // Hide all forms first
    this.hideAllForms();

    // Reset tab states - make login tab active
    const tabs = this.shadowRoot.querySelectorAll('.auth-tab');
    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.form === 'login');
    });

    // Show login form by default
    const loginForm = this.querySelector('[slot="login-form"]');
    if (loginForm) {
      loginForm.classList.add('active');
    }
  }

  // Show only user profile
  showUserProfile() {
    const tabsContainer = this.shadowRoot.querySelector('.auth-tabs');
    tabsContainer.classList.add('hidden');

    this.hideAllForms();

    const userProfile = this.querySelector('[slot="user-profile"]');
    if (userProfile) {
      userProfile.classList.add('active');
    }
  }

  // Show forgot password form
  showForgotPassword() {
    const tabsContainer = this.shadowRoot.querySelector('.auth-tabs');
    tabsContainer.classList.add('hidden');

    this.hideAllForms();

    const forgotPasswordForm = this.querySelector('[slot="forgot-password"]');
    if (forgotPasswordForm) {
      forgotPasswordForm.classList.add('active');
    }
  }

  hideAllForms() {
    const forms = this.querySelectorAll('[slot]');
    forms.forEach((form) => form.classList.remove('active'));
  }

  switchForm(formId) {
    // Update tabs
    const tabs = this.shadowRoot.querySelectorAll('.auth-tab');
    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.form === formId);
    });

    this.hideAllForms();

    // Show selected form
    const selectedForm = this.querySelector(`[slot="${formId}-form"]`);
    if (selectedForm) {
      selectedForm.classList.add('active');
    }
  }
}

customElements.define('auth-content', AuthContent);
