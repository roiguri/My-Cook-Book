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
 * Supports auto-dismiss, RTL layout, and different types (info, success, error, warn/warning).
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
          bottom: 24px;
          right: 24px;
          z-index: ${TOAST_Z_INDEX};
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 18px;
          border-radius: var(--r-md, 12px);
          border: 1px solid transparent;
          box-shadow: var(--shadow-2, 0 4px 16px rgba(31,29,24,0.12));
          font-family: var(--font-ui-he, sans-serif);
          font-size: 13.5px;
          line-height: 1.5;
          max-width: 90vw;
          min-width: 220px;
          width: fit-content;
          direction: rtl;
          pointer-events: none;
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity var(--dur-2, 280ms) var(--ease, ease),
            transform var(--dur-2, 280ms) var(--ease, ease);
        }

        .toast.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .toast.info {
          background: #e8eef8;
          border-color: #afc4e8;
          color: #2a4a82;
        }

        .toast.success {
          background: #eef4e8;
          border-color: #b8d9a0;
          color: var(--primary-dark, #386641);
        }

        .toast.error {
          background: #faeaea;
          border-color: #e8b3b3;
          color: var(--secondary-dark, #bc4749);
        }

        .toast.warn,
        .toast.warning {
          background: #fdf6d8;
          border-color: #f0d878;
          color: #7a5a07;
        }

        .toast-icon {
          font-size: 15px;
          flex-shrink: 0;
          line-height: 1.5;
        }

        .toast-message {
          flex: 1;
        }

        @media (max-width: 768px) {
          :host {
            bottom: 20px;
            right: 16px;
            left: 16px;
            transform: none;
          }

          .toast {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
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
   * @param {string} [type='info'] - Type: 'info', 'success', 'error', 'warn'
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
   * @returns {string} Icon character
   */
  getIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✓',
      error: '✕',
      warn: '⚠',
      warning: '⚠',
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
