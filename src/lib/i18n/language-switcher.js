/**
 * <language-switcher>
 *
 * Header/footer dropdown for switching the active UI locale. Reads the list
 * of supported locales from i18nService and binds to setLocale. When only
 * a single locale is configured the element renders nothing — the plumbing
 * is in place but no UI is shown until a second locale is added.
 */

import i18nService from '../../js/i18n/i18n.js';

const LOCALE_LABELS = {
  he: 'עברית',
  en: 'English',
};

class LanguageSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onChange = this._onChange.bind(this);
    this._onLocaleChanged = this._onLocaleChanged.bind(this);
  }

  connectedCallback() {
    this._render();
    i18nService.addEventListener('locale-changed', this._onLocaleChanged);
  }

  disconnectedCallback() {
    i18nService.removeEventListener('locale-changed', this._onLocaleChanged);
    const select = this.shadowRoot.querySelector('select');
    if (select) select.removeEventListener('change', this._onChange);
  }

  _render() {
    const locales = i18nService.getSupportedLocales();
    if (locales.length <= 1) {
      this.style.display = 'none';
      this.shadowRoot.innerHTML = '';
      return;
    }
    this.style.display = '';
    const current = i18nService.getLocale();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        select {
          font: inherit;
          color: inherit;
          background: transparent;
          border: 1px solid var(--ink-4, currentColor);
          border-radius: var(--r-sm, 4px);
          padding: 0.25rem 0.5rem;
          cursor: pointer;
        }
      </style>
      <label>
        <span class="sr-only">Language</span>
        <select aria-label="Language">
          ${locales
            .map(
              (loc) =>
                `<option value="${loc}"${loc === current ? ' selected' : ''}>${
                  LOCALE_LABELS[loc] || loc
                }</option>`,
            )
            .join('')}
        </select>
      </label>
    `;
    this.shadowRoot.querySelector('select').addEventListener('change', this._onChange);
  }

  _onChange(event) {
    const next = event.target.value;
    i18nService.setLocale(next);
  }

  _onLocaleChanged() {
    const select = this.shadowRoot.querySelector('select');
    if (select) select.value = i18nService.getLocale();
  }
}

if (!customElements.get('language-switcher')) {
  customElements.define('language-switcher', LanguageSwitcher);
}

export { LanguageSwitcher };
