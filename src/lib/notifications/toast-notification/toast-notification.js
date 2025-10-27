// Constants
const DEFAULT_TOAST_DURATION_MS = 3000;
const TOAST_Z_INDEX = 10000;

/**
 * Toast Notification Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * A lightweight toast notification component for displaying brief messages.
 * Supports auto-dismiss, RTL layout, and different types (info, success, error).
 *
 * @example
 * // HTML
 * <toast-notification></toast-notification>
 *
 * // JavaScript
 * const toast = document.querySelector('toast-notification');
 * toast.show('מצאנו תוצאה אחת - מעבר ישירות למתכון', 'info', 3000);
 *
 * @method show(message, type, duration)
 * @param {string} message - The message to display
 * @param {string} [type='info'] - Type: 'info', 'success', 'error'
 * @param {number} [duration=3000] - Auto-dismiss duration in milliseconds
 */
class ToastNotification extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.timeoutId = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: ${TOAST_Z_INDEX};
          pointer-events: none;
          --toast-success-color: #4caf50;
          --toast-error-color: #f44336;
        }

        .toast {
          background-color: var(--primary-color);
          color: var(--button-color);
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: none;
          align-items: center;
          gap: 10px;
          font-family: var(--body-font);
          font-size: var(--size-body);
          max-width: 90vw;
          width: fit-content;
          min-width: 200px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: auto;
          direction: rtl;
          text-align: center;
        }

        .toast.show {
          display: flex;
          opacity: 1;
        }

        .toast.info {
          background-color: var(--primary-color);
        }

        .toast.success {
          background-color: var(--toast-success-color);
        }

        .toast.error {
          background-color: var(--toast-error-color);
        }

        .toast-icon {
          font-size: 1.2em;
        }

        .toast-message {
          flex: 1;
        }

        @media (max-width: 768px) {
          :host {
            bottom: 20px;
            left: 20px;
            right: 20px;
            transform: none;
          }

          .toast {
            width: auto;
            max-width: 100%;
          }
        }
      </style>

      <div class="toast" role="alert" aria-live="polite">
        <span class="toast-icon" aria-hidden="true"></span>
        <span class="toast-message"></span>
      </div>
    `;
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} [type='info'] - Type: 'info', 'success', 'error'
   * @param {number} [duration=DEFAULT_TOAST_DURATION_MS] - Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
   */
  show(message, type = 'info', duration = DEFAULT_TOAST_DURATION_MS) {
    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const toast = this.shadowRoot.querySelector('.toast');
    const messageEl = this.shadowRoot.querySelector('.toast-message');
    const iconEl = this.shadowRoot.querySelector('.toast-icon');

    // Set message
    messageEl.textContent = message;

    // Set type and icon
    toast.className = `toast ${type}`;
    iconEl.textContent = this.getIcon(type);

    // Show toast
    toast.classList.add('show');

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  /**
   * Hide the toast notification
   */
  hide() {
    const toast = this.shadowRoot.querySelector('.toast');
    toast.classList.remove('show');

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Get icon for toast type
   * @param {string} type - Toast type
   * @returns {string} Icon emoji
   */
  getIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✓',
      error: '✕',
    };
    return icons[type] || icons.info;
  }

  disconnectedCallback() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

customElements.define('toast-notification', ToastNotification);

// Export a helper function to show toasts easily
export function showToast(message, type = 'info', duration = DEFAULT_TOAST_DURATION_MS) {
  let toast = document.querySelector('toast-notification');

  // Create toast element if it doesn't exist
  if (!toast) {
    toast = document.createElement('toast-notification');
    document.body.appendChild(toast);
  }

  toast.show(message, type, duration);
}
