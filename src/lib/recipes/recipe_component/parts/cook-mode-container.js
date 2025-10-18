/**
 * Cook Mode Container Component
 * ------------------------------
 * Mobile-only container for cooking utilities.
 * Currently contains the cook mode toggle (screen wake lock).
 * Designed to be extended with timer component in future commits.
 *
 * Features:
 * - Visible only on mobile (< 768px)
 * - Houses cook-mode-toggle component
 * - Extensible design for future utilities (timer, etc.)
 * - Matches app styling and color palette
 *
 * Usage:
 * <cook-mode-container></cook-mode-container>
 */

import styles from './cook-mode.css?inline';
import './cook-mode-toggle.js';

class CookModeContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${this.template()}
    `;
  }

  template() {
    return `
      <div class="cook-mode-container" dir="rtl">
        <cook-mode-toggle></cook-mode-toggle>
        <!-- Future: Timer component will be added here -->
      </div>
    `;
  }
}

customElements.define('cook-mode-container', CookModeContainer);
