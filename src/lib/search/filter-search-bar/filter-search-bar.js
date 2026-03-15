import { debounce } from '../../../js/utils/common-utils.js';

/**
 * FilterSearchBar Component
 * Search bar component for filtering recipes with real-time functionality.
 */
class FilterSearchBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Debounce the search event to improve performance and prevent excessive re-renders
    this.debouncedSearchInput = debounce((searchText) => {
      this.dispatchEvent(
        new CustomEvent('search-input', {
          bubbles: true,
          composed: true,
          detail: { searchText },
        }),
      );
    }, 300);
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
          height: 36px;
          padding: 0 16px;
          padding-left: 70px; /* Space for the search icon and clear button */
          border: 2px solid var(--border-light, #e0e0e0);
          border-radius: 12px;
          font-size: var(--size-body);
          font-family: var(--body-font);
          background-color: white;
          color: var(--text-color);
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-weight: 500;
          box-sizing: border-box;
        }

        .search-input:hover {
          border-color: var(--secondary, #6c757d);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--secondary, #6c757d);
          box-shadow: 0 0 0 3px rgba(108, 117, 125, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-color-secondary, #666);
          pointer-events: none;
          font-size: var(--size-icon, 1.2em);
        }

        .clear-button {
          position: absolute;
          left: 40px; /* Position next to search icon */
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-color-secondary, #666);
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: none; /* Hidden by default */
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-weight: bold;
        }

        .clear-button:hover {
          background-color: var(--border-light, #e0e0e0);
          color: var(--text-color, #333);
          transform: translateY(-50%) scale(1.1);
        }

        .clear-button:active {
          transform: translateY(-50%) scale(0.9);
        }

        .clear-button.visible {
          display: flex;
        }

        /* RTL support */
        :host([dir="rtl"]) .search-container {
          direction: rtl;
        }

        :host([dir="rtl"]) .search-icon {
          left: auto;
          right: 12px;
        }

        :host([dir="rtl"]) .clear-button {
          left: auto;
          right: 40px;
        }

        :host([dir="rtl"]) .search-input {
          padding-right: 70px;
          padding-left: 16px;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .search-input {
            height: 36px;
            padding: 0 12px;
            padding-left: 60px;
            border-radius: 8px;
            font-size: var(--size-body-mobile, 0.9rem);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .search-input:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }

          .search-icon {
            left: 10px;
            font-size: 1.1em;
          }

          .clear-button {
            left: 35px;
            width: 22px;
            height: 22px;
            font-size: 16px;
          }

          :host([dir="rtl"]) .search-icon {
            left: auto;
            right: 10px;
          }

          :host([dir="rtl"]) .clear-button {
            left: auto;
            right: 35px;
          }

          :host([dir="rtl"]) .search-input {
            padding-right: 60px;
            padding-left: 12px;
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

      // Use the debounced function instead of immediately dispatching
      this.debouncedSearchInput(searchText);
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

      // Dispatch immediately when cleared, but also cancel any pending debounced calls
      // (Though the debounce function provided doesn't have a cancel method,
      // calling it here would still queue an empty search, so we dispatch immediately
      // to ensure UI updates instantly on clear)
      this.dispatchEvent(
        new CustomEvent('search-input', {
          bubbles: true,
          composed: true,
          detail: { searchText: '' },
        }),
      );
      // We also update the pending debounced search to an empty string just in case
      this.debouncedSearchInput('');
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
