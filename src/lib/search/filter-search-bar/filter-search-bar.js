/**
 * FilterSearchBar Component
 * Search bar component for filtering recipes with real-time functionality.
 */
class FilterSearchBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const placeholder = this.getAttribute('placeholder') || 'חיפוש מתכונים...';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .search-container {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 10px;
          padding-left: 70px; /* Space for the search icon and clear button */
          border: 2px solid var(--border-color, #ccc);
          border-radius: 4px;
          font-size: var(--size-body);
          font-family: var(--body-font);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--submenu-color);
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-color);
          pointer-events: none;
          font-size: var(--size-icon);
        }

        .clear-button {
          position: absolute;
          left: 40px; /* Position next to search icon */
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-color);
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: none; /* Hidden by default */
          align-items: center;
          justify-content: center;
        }

        .clear-button:hover {
          background-color: var(--border-color, #e0e0e0);
        }

        .clear-button.visible {
          display: flex;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .search-container {
            grid-column: span 2;
          }
        }
      </style>

      <div class="search-container" dir="rtl">
        <input 
          type="text" 
          class="search-input" 
          placeholder="${placeholder}"
          aria-label="חיפוש מתכונים">
        <span class="search-icon">🔍</span>
        <button class="clear-button" type="button" aria-label="נקה חיפוש">×</button>
      </div>
    `;
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector('.search-input');
    const clearButton = this.shadowRoot.querySelector('.clear-button');

    input.addEventListener('input', (e) => {
      const searchText = e.target.value.trim();

      this.updateClearButtonVisibility();

      this.dispatchEvent(
        new CustomEvent('search-input', {
          bubbles: true,
          composed: true,
          detail: { searchText },
        }),
      );
    });

    clearButton.addEventListener('click', () => {
      this.clear();
    });
  }

  getValue() {
    return this.shadowRoot.querySelector('.search-input').value;
  }

  setValue(text) {
    this.shadowRoot.querySelector('.search-input').value = text;
    this.updateClearButtonVisibility();
  }

  clear() {
    const input = this.shadowRoot.querySelector('.search-input');
    if (input.value !== '') {
      input.value = '';
      this.updateClearButtonVisibility();
      this.dispatchEvent(
        new CustomEvent('search-input', {
          bubbles: true,
          composed: true,
          detail: { searchText: '' },
        }),
      );
    }
  }

  updateClearButtonVisibility() {
    const input = this.shadowRoot.querySelector('.search-input');
    const clearButton = this.shadowRoot.querySelector('.clear-button');

    if (input.value.trim().length > 0) {
      clearButton.classList.add('visible');
    } else {
      clearButton.classList.remove('visible');
    }
  }
}

customElements.define('filter-search-bar', FilterSearchBar);
