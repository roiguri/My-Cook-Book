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
          font-family: var(--heading-font, 'Amatic SC');
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

        /* Form container */
        .form-container {
          position: relative;
          min-height: 200px;
          padding: 0 20px 20px 20px;
        }

        /* Slots styling */
        ::slotted(*) {
          display: none;
        }

        ::slotted(.active) {
          display: block;
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
  }

  setupEventListeners() {
    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchForm(tab.dataset.form));
    });

    // Listen for forgot password request
    this.addEventListener('switch-to-forgot-password', () => {
      this.showForgotPassword();
    });

    // Listen for back to login
    this.addEventListener('back-to-login', () => {
      this.showTabs();
      this.switchForm('login');
    });
  }

  switchForm(formId) {
    // Update tabs
    const tabs = this.shadowRoot.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.form === formId);
    });

    // Update forms visibility
    const loginForm = this.querySelector('[slot="login-form"]');
    const signupForm = this.querySelector('[slot="signup-form"]');
    const forgotPasswordForm = this.querySelector('[slot="forgot-password"]');

    // Hide all forms
    loginForm?.classList.remove('active');
    signupForm?.classList.remove('active');
    forgotPasswordForm?.classList.remove('active');

    // Show selected form
    switch(formId) {
      case 'login':
        loginForm?.classList.add('active');
        break;
      case 'signup':
        signupForm?.classList.add('active');
        break;
    }
  }

  showForgotPassword() {
    // Hide tabs
    const tabsContainer = this.shadowRoot.querySelector('.auth-tabs');
    tabsContainer.classList.add('hidden');

    // Hide login and signup forms
    const loginForm = this.querySelector('[slot="login-form"]');
    const signupForm = this.querySelector('[slot="signup-form"]');
    loginForm?.classList.remove('active');
    signupForm?.classList.remove('active');

    // Show forgot password form
    const forgotPasswordForm = this.querySelector('[slot="forgot-password"]');
    forgotPasswordForm?.classList.add('active');
  }

  showUserProfile() {
    // Hide tabs
    const tabsContainer = this.shadowRoot.querySelector('.auth-tabs');
    tabsContainer.classList.add('hidden');

    // Hide all other forms
    const loginForm = this.querySelector('[slot="login-form"]');
    const signupForm = this.querySelector('[slot="signup-form"]');
    const forgotPasswordForm = this.querySelector('[slot="forgot-password"]');
    loginForm?.classList.remove('active');
    signupForm?.classList.remove('active');
    forgotPasswordForm?.classList.remove('active');

    // Show profile
    const userProfile = this.querySelector('[slot="user-profile"]');
    userProfile?.classList.add('active');
  }

  showTabs() {
    const tabsContainer = this.shadowRoot.querySelector('.auth-tabs');
    tabsContainer.classList.remove('hidden');
  }
}

customElements.define('auth-content', AuthContent);