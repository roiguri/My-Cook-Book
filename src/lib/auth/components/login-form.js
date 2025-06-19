import './auth-content.js';
import '../../modals/message-modal/message-modal.js';

class LoginForm extends HTMLElement {
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
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding: 20px;
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

        .remember-forgot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9em;
          margin-top: -5px; /* Tighten up spacing */
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .forgot-password {
          color: var(--primary-color);
          cursor: pointer;
          text-decoration: none;
        }

        .forgot-password:hover {
          text-decoration: underline;
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

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 15px 0;
          gap: 10px;
          color: var(--text-color);
          opacity: 0.8;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--secondary-color);
        }

        /* Google Button Styles */
        .gsi-material-button {
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
          -webkit-appearance: none;
          background-color: WHITE;
          background-image: none;
          border: 1px solid #000000;
          -webkit-border-radius: 4px;
          border-radius: 4px;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
          color: #1f1f1f;
          cursor: pointer;
          font-family: 'Roboto', arial, sans-serif;
          font-size: 14px;
          height: 40px;
          letter-spacing: 0.25px;
          outline: none;
          overflow: hidden;
          padding: 0 12px;
          position: relative;
          text-align: center;
          transition: background-color .218s, border-color .218s, box-shadow .218s;
          vertical-align: middle;
          white-space: nowrap;
          width: 100%;
          max-width: 400px;
          margin-top: -10px;
        }
        
        .gsi-material-button-content-wrapper {
          align-items: center;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          height: 100%;
          justify-content: space-between;
          position: relative;
          width: 100%;
        }
        
        .gsi-material-button-icon {
          height: 20px;
          margin-right: 12px;
          min-width: 20px;
          width: 20px;
        }
        
        .gsi-material-button-contents {
          flex-grow: 1;
          font-family: 'Roboto', arial, sans-serif;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: top;
        }
        
        .gsi-material-button-state {
          transition: opacity .218s;
          bottom: 0;
          left: 0;
          opacity: 0;
          position: absolute;
          right: 0;
          top: 0;
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

      <form class="login-form">
        <div class="form-group">
          <label for="login-email">כתובת מייל</label>
          <input type="email" id="login-email" name="email" required>
        </div>

        <div class="form-group">
          <label for="login-password">סיסמה</label>
          <input type="password" id="login-password" name="password" required>
          <div class="error-message" id="login-error"></div>
        </div>

        <div class="remember-forgot">
          <label class="remember-me">
            <input type="checkbox" id="remember" name="remember">
            <span>זכור אותי</span>
          </label>
          <a class="forgot-password" id="forgot-password">שכחת סיסמה?</a>
        </div>

        <button type="submit" class="submit-button">התחבר</button>

        <div class="divider">או</div>

        <button type="button" class="gsi-material-button">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span class="gsi-material-button-contents">התחבר עם Google</span>
          </div>
        </button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('.login-form');
    const forgotPassword = this.shadowRoot.getElementById('forgot-password');
    const googleSignIn = this.shadowRoot.querySelector('.gsi-material-button');

    form.addEventListener('submit', (e) => this.handleSubmit(e));
    forgotPassword.addEventListener('click', (e) => this.handleForgotPassword(e));
    googleSignIn.addEventListener('click', () => this.handleGoogleSignIn());
  }

  async handleSubmit(e) {
    e.preventDefault();

    const email = this.shadowRoot.getElementById('login-email').value;
    const password = this.shadowRoot.getElementById('login-password').value;
    const remember = this.shadowRoot.getElementById('remember').checked;

    try {
      const authController = this.closest('auth-controller');
      await authController.handleLogin(email, password, remember);
      // Close modal after successful login
      authController.closeModal();
    } catch (error) {
      console.error('Login Error Details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      this.showError(error);
    }
  }

  handleForgotPassword(e) {
    e.preventDefault();

    // Dispatch event to show forgot password form
    this.dispatchEvent(
      new CustomEvent('switch-to-forgot-password', {
        bubbles: true,
        composed: true,
        detail: {
          email: this.shadowRoot.getElementById('login-email').value, // Pass current email if entered
        },
      }),
    );
  }

  async handleGoogleSignIn() {
    try {
      const authController = this.closest('auth-controller');
      await authController.handleGoogleSignIn();

      authController.closeModal();
    } catch (error) {
      this.showError(error);
    }
  }

  showError(error) {
    const AUTH_ERROR_MESSAGES = {
      // Email/Password Sign In Errors
      INVALID_LOGIN_CREDENTIALS: 'שם משתמש או סיסמה שגויים',
      'auth/invalid-email': 'כתובת המייל אינה תקינה',
      'auth/user-disabled': 'המשתמש חסום. אנא פנה לתמיכה',
      'auth/user-not-found': 'משתמש לא קיים במערכת',
      'auth/wrong-password': 'סיסמה שגויה',
      'auth/too-many-requests': 'נסיונות כניסה רבים מדי. אנא נסה שוב מאוחר יותר',
      'auth/network-request-failed': 'בעיית תקשורת. אנא בדוק את חיבור האינטרנט',

      // Google Sign In Errors
      'auth/popup-closed-by-user': 'החלון נסגר לפני השלמת ההתחברות',
      'auth/popup-blocked': 'החלון נחסם על ידי הדפדפן. אנא אפשר חלונות קופצים ונסה שנית',
      'auth/cancelled-popup-request': 'בקשת ההתחברות בוטלה',
      'auth/account-exists-with-different-credential':
        'קיים משתמש עם אותה כתובת מייל. אנא נסה להתחבר בדרך אחרת',

      'auth/wrong-password': 'סיסמה שגויה',
      'auth/user-not-found': 'משתמש לא קיים במערכת',
      'auth/invalid-email': 'כתובת המייל אינה תקינה',
      'auth/internal-error': 'שגיאת מערכת. אנא נסה שנית',
      // Default error
      default: 'שגיאה בהתחברות. אנא נסה שנית',
    };

    const errorElement = this.shadowRoot.getElementById('login-error');
    let errorCode = error.code;

    // Try to parse the internal error message if it exists
    if (error.code === 'auth/internal-error' && error.message) {
      try {
        const parsedError = JSON.parse(error.message);
        errorCode = parsedError.error.message;
      } catch (e) {
        // If parsing fails, use the original error code
        console.log('Error parsing message:', e);
      }
    }

    const errorMessage = AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.default;
    errorElement.textContent = errorMessage;
    errorElement.classList.add('visible');
  }

  clearError() {
    const errorElement = this.shadowRoot.getElementById('login-error');
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
  }

  // Method to clear form
  reset() {
    this.shadowRoot.querySelector('.login-form').reset();
    this.clearError();
  }
}

customElements.define('login-form', LoginForm);
