/**
 * FilterSearchBar Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * A search bar component specifically designed for filtering recipes in category/profile pages,
 * providing real-time search functionality.
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
          padding-left: 40px; /* Space for the search icon */
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
      </div>
    `;
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector('.search-input');

    // Real-time search as user types
    input.addEventListener('input', (e) => {
      const searchText = e.target.value.trim();

      // Dispatch custom event for real-time search
      this.dispatchEvent(
        new CustomEvent('search-input', {
          bubbles: true,
          composed: true,
          detail: { searchText },
        }),
      );
    });
  }

  // Public methods
  getValue() {
    return this.shadowRoot.querySelector('.search-input').value;
  }

  setValue(text) {
    this.shadowRoot.querySelector('.search-input').value = text;
  }

  clear() {
    const input = this.shadowRoot.querySelector('.search-input');
    // Only dispatch event if value actually changed
    if (input.value !== '') {
      input.value = '';
      this.dispatchEvent(
        new CustomEvent('search-input', {
          bubbles: true,
          composed: true,
          detail: { searchText: '' },
        }),
      );
    }
  }
}

customElements.define('filter-search-bar', FilterSearchBar);
