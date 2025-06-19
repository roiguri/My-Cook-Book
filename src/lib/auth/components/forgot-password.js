import './auth-content.js';
import '../../modals/message-modal/message-modal.js';

/**
 * ForgotPassword Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * Handles password reset functionality
 */

class ForgotPassword extends HTMLElement {
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
        .forgot-password-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding: 20px;
        }

        .title {
          color: var(--text-color);
          font-size: 1.1em;
          margin-bottom: 10px;
        }

        .description {
          color: var(--text-color);
          font-size: 0.9em;
          margin-bottom: 15px;
          opacity: 0.8;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-size: 0.9em;
          color: var(--text-color);
        }

        .form-group input {
          padding: 10px;
          border: 1px solid var(--secondary-color);
          border-radius: 5px;
          font-size: 1em;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .submit-button {
          background-color: var(--primary-color);
          color: white;
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .submit-button:hover {
          background-color: var(--primary-hover);
        }

        .back-to-login {
          color: var(--primary-color);
          text-decoration: none;
          cursor: pointer;
          font-size: 0.9em;
          text-align: center;
        }

        .back-to-login:hover {
          text-decoration: underline;
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

        .success-message {
          color: green;
          font-size: 0.9em;
          margin-top: 5px;
          display: none;
          background-color: #f0fff0;
          padding: 10px;
          border-radius: 5px;
          text-align: center;
        }

        .success-message.visible {
          display: block;
        }
      </style>

      <form class="forgot-password-form">
        <div class="title">שחזור סיסמה</div>
        <div class="description">
          הזן את כתובת המייל שלך ואנו נשלח לך קישור לאיפוס הסיסמה
        </div>

        <div class="form-group">
          <label for="forgot-email">כתובת מייל</label>
          <input type="email" id="forgot-email" name="email" required>
          <div class="error-message" id="reset-error"></div>
          <div class="success-message" id="reset-success"></div>
        </div>

        <button type="submit" class="submit-button">שלח קישור לאיפוס סיסמה</button>
        
        <a class="back-to-login" id="back-to-login">חזרה להתחברות</a>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('.forgot-password-form');
    const backToLogin = this.shadowRoot.getElementById('back-to-login');

    form.addEventListener('submit', (e) => this.handleSubmit(e));
    backToLogin.addEventListener('click', (e) => this.handleBackToLogin(e));
  }

  async handleSubmit(e) {
    e.preventDefault();
    const email = this.shadowRoot.getElementById('forgot-email').value;

    try {
      const authController = this.closest('auth-controller');
      await authController.handlePasswordReset(email);
      this.showSuccess('קישור לאיפוס סיסמה נשלח לכתובת המייל שלך');

      // Automatically return to login after 3 seconds
      setTimeout(() => {
        this.handleBackToLogin();
      }, 3000);
    } catch (error) {
      this.showError(error.message);
    }
  }

  handleBackToLogin(e) {
    e?.preventDefault();
    this.dispatchEvent(
      new CustomEvent('back-to-login', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  showError(message) {
    const errorElement = this.shadowRoot.getElementById('reset-error');
    const successElement = this.shadowRoot.getElementById('reset-success');

    errorElement.textContent = message;
    errorElement.classList.add('visible');
    successElement.classList.remove('visible');
  }

  showSuccess(message) {
    const errorElement = this.shadowRoot.getElementById('reset-error');
    const successElement = this.shadowRoot.getElementById('reset-success');

    successElement.textContent = message;
    successElement.classList.add('visible');
    errorElement.classList.remove('visible');
  }

  clearMessages() {
    const errorElement = this.shadowRoot.getElementById('reset-error');
    const successElement = this.shadowRoot.getElementById('reset-success');

    errorElement.classList.remove('visible');
    successElement.classList.remove('visible');
  }

  // Method to clear form
  reset() {
    this.shadowRoot.querySelector('.forgot-password-form').reset();
    this.clearMessages();
  }
}

customElements.define('forgot-password', ForgotPassword);
