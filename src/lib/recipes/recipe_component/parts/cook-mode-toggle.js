/**
 * Cook Mode Toggle Component
 * ---------------------------
 * iOS-style toggle switch that prevents screen from sleeping when enabled.
 * Uses the Screen Wake Lock API to keep the screen active during cooking.
 *
 * Features:
 * - Screen Wake Lock API integration
 * - Graceful fallback for unsupported browsers
 * - Automatic reacquisition on page visibility
 * - Keyboard accessible (Space/Enter)
 * - RTL layout support
 *
 * Usage:
 * <cook-mode-toggle></cook-mode-toggle>
 *
 * Events:
 * - 'cook-mode-changed': Dispatched when toggle state changes
 *   detail: { enabled: boolean, wakeLockActive: boolean }
 */

import styles from './cook-mode.css?inline';

class CookModeToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Wake Lock state
    this._wakeLock = null;
    this._isEnabled = false;
    this._isSupported = 'wakeLock' in navigator;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateStatus();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
  }

  disconnectedCallback() {
    // Clean up wake lock when component is removed
    this.releaseWakeLock();
    document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${this.template()}
    `;
  }

  template() {
    return `
      <div class="cook-mode-toggle" dir="rtl">
        <label class="cook-mode-toggle__label" for="cook-mode-switch">
          מצב בישול
        </label>
        <label class="cook-mode-toggle__switch">
          <input
            type="checkbox"
            id="cook-mode-switch"
            role="switch"
            aria-checked="false"
            ${!this._isSupported ? 'disabled' : ''}
          />
          <span class="cook-mode-toggle__slider"></span>
        </label>
      </div>
      <div class="cook-mode-toggle__status" id="status-message"></div>
    `;
  }

  setupEventListeners() {
    const checkbox = this.shadowRoot.getElementById('cook-mode-switch');
    const label = this.shadowRoot.querySelector('.cook-mode-toggle__label');

    // Toggle on checkbox change
    checkbox.addEventListener('change', async (e) => {
      this._isEnabled = e.target.checked;
      await this.handleToggle();
    });

    // Keyboard accessibility - allow label click to toggle
    label.addEventListener('click', () => {
      if (this._isSupported) {
        checkbox.click();
      }
    });

    // Additional keyboard support
    label.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (this._isSupported) {
          checkbox.click();
        }
      }
    });
  }

  async handleToggle() {
    const checkbox = this.shadowRoot.getElementById('cook-mode-switch');
    checkbox.setAttribute('aria-checked', this._isEnabled.toString());

    if (this._isEnabled) {
      await this.requestWakeLock();
    } else {
      this.releaseWakeLock();
    }

    this.updateStatus();
    this.dispatchStateChange();
  }

  async requestWakeLock() {
    if (!this._isSupported) {
      return;
    }

    try {
      this._wakeLock = await navigator.wakeLock.request('screen');

      // Handle wake lock release (can happen automatically)
      this._wakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock was released');
      });

      console.log('Screen Wake Lock acquired');
    } catch (err) {
      console.error(`Failed to acquire Screen Wake Lock: ${err.name}, ${err.message}`);
      this.showError('לא ניתן להפעיל מצב בישול. נסה שוב.');
    }
  }

  releaseWakeLock() {
    if (this._wakeLock !== null) {
      this._wakeLock.release().then(() => {
        this._wakeLock = null;
        console.log('Screen Wake Lock released');
      });
    }
  }

  async _handleVisibilityChange() {
    // Reacquire wake lock when page becomes visible again
    if (document.visibilityState === 'visible' && this._isEnabled && this._wakeLock === null) {
      await this.requestWakeLock();
      this.updateStatus();
    }
  }

  updateStatus() {
    const statusMessage = this.shadowRoot.getElementById('status-message');

    if (!this._isSupported) {
      statusMessage.textContent = 'מצב בישול אינו נתמך בדפדפן זה';
      statusMessage.className = 'cook-mode-toggle__status cook-mode-toggle__status--error';
      return;
    }

    if (this._isEnabled && this._wakeLock !== null) {
      statusMessage.textContent = 'המסך יישאר דלוק';
      statusMessage.className = 'cook-mode-toggle__status cook-mode-toggle__status--active';
    } else if (this._isEnabled && this._wakeLock === null) {
      statusMessage.textContent = 'מנסה להפעיל...';
      statusMessage.className = 'cook-mode-toggle__status';
    } else {
      statusMessage.textContent = '';
      statusMessage.className = 'cook-mode-toggle__status';
    }
  }

  showError(message) {
    const statusMessage = this.shadowRoot.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = 'cook-mode-toggle__status cook-mode-toggle__status--error';

    // Reset toggle to off state
    const checkbox = this.shadowRoot.getElementById('cook-mode-switch');
    checkbox.checked = false;
    this._isEnabled = false;
    checkbox.setAttribute('aria-checked', 'false');
  }

  dispatchStateChange() {
    this.dispatchEvent(
      new CustomEvent('cook-mode-changed', {
        bubbles: true,
        composed: true,
        detail: {
          enabled: this._isEnabled,
          wakeLockActive: this._wakeLock !== null,
        },
      }),
    );
  }

  // Public API
  get isEnabled() {
    return this._isEnabled;
  }

  get isSupported() {
    return this._isSupported;
  }

  get wakeLockActive() {
    return this._wakeLock !== null;
  }
}

customElements.define('cook-mode-toggle', CookModeToggle);
