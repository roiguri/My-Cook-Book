import alertStyles from '../../../styles/components/alerts.css?inline';

// Constants
const DEFAULT_TOAST_DURATION_MS = 3000;

/**
 * Toast Notification Component
 * @class
 * @extends HTMLElement
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
        ${alertStyles}

        :host {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: var(--z-toast);
          pointer-events: none;
        }

        .toast {
          max-width: 90vw;
          min-width: 260px;
          width: fit-content;
          direction: rtl;
          pointer-events: none;
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity var(--dur-2, 280ms) var(--ease, ease),
            transform var(--dur-2, 280ms) var(--ease, ease);
          box-shadow: var(--shadow-2, 0 4px 16px rgba(31,29,24,0.12));
          border-radius: var(--r-md);
          box-sizing: border-box;
        }

        .toast.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
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
          }
        }
      </style>

      <div class="toast alert" role="alert" aria-live="polite">
        <span class="alert__icon" aria-hidden="true"></span>
        <div class="toast-message"></div>
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
    const iconEl = this.shadowRoot.querySelector('.alert__icon');

    // Set message
    messageEl.textContent = message;

    // Map types to v2 alert modifiers
    const typeMap = {
      success: 'ok',
      error: 'err',
      warn: 'warn',
      warning: 'warn',
      info: 'info',
    };

    const modifier = typeMap[type] || 'info';

    // Reset and apply alert classes
    toast.className = `toast alert alert--${modifier}`;

    // Set icon
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
    if (toast) {
      toast.classList.remove('show');
    }

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

/**
 * Global helper to show toasts
 */
export function showToast(message, type = 'info', duration = DEFAULT_TOAST_DURATION_MS) {
  let toast = document.querySelector('toast-notification');

  if (!toast) {
    toast = document.createElement('toast-notification');
    document.body.appendChild(toast);
  }

  toast.show(message, type, duration);
}
