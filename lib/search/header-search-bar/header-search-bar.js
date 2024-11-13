/**
 * HeaderSearchBar Component
 * @class
 * @extends HTMLElement
 * 
 * @attr {string} placeholder - Custom placeholder text for the search input
 */
class HeaderSearchBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['placeholder'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'placeholder' && this.shadowRoot) {
      const input = this.shadowRoot.querySelector('.search-input');
      if (input) {
        input.placeholder = newValue || 'חיפוש מתכונים...';
      }
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const placeholder = this.getAttribute('placeholder') || 'חיפוש מתכונים...';

    this.shadowRoot.innerHTML = `
      <style>
        .search-form {
          border: 2px solid var(--primary-color);
          background-color: var(--primary-color);
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          border-radius: 8px;
          box-shadow: 
            0 4px 0 var(--primary-dark),
            0 6px 4px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          height: 40px;
          transform: translateY(-2px);
        }

        .search-form:active {
          transform: translateY(0);
          box-shadow: 
            0 0px 0 var(--primary-dark),
            0 2px 2px rgba(0, 0, 0, 0.2);
        }

        .search-input {
          background: var(--button-color);
          border: none;
          font-family: var(--body-font);
          font-size: var(--size-body);
          padding: 0 10px;
          flex-grow: 1;
          outline: none;
          height: 100%;
        }

        .search-button {
          background: var(--primary-color);
          border: none;
          cursor: pointer;
          padding: 0 15px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--button-color);
          font-size: var(--size-icon);
          transition: background-color 0.3s;
        }

        .search-button:hover {
          background: var(--primary-dark);
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .search-form {
            width: 100%;
          }
        }
      </style>

      <form dir="rtl" class="search-form">
        <input type="text" 
               class="search-input" 
               placeholder="${placeholder}"
               aria-label="חיפוש מתכונים">
        <button type="submit" class="search-button">
          🔍
        </button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('.search-form');
    const input = this.shadowRoot.querySelector('.search-input');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.navigateToSearch(input.value);
    });

    // Handle input changes
    input.addEventListener('input', this.handleInput.bind(this));
  }

  handleInput(e) {
    const searchText = e.target.value.trim();
    
    // Dispatch event for real-time search
    this.dispatchEvent(new CustomEvent('search-input', {
      bubbles: true,
      composed: true,
      detail: { searchText }
    }));
  }

  navigateToSearch(searchText) {
    if (!searchText.trim()) return;

    // Create search URL
    const searchParams = new URLSearchParams();
    searchParams.set('q', searchText);

    // Determine if we're on the index page or in a subdirectory
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/');
    
    // Build the categories page URL
    const baseUrl = isIndexPage ? './pages/categories.html' : './categories.html';
    const searchUrl = `${baseUrl}?${searchParams.toString()}`;

    // Navigate to categories page with search parameter
    window.location.href = searchUrl;
  }

  // Method to get current search text
  getSearchText() {
    return this.shadowRoot.querySelector('.search-input').value;
  }

  // Method to set search text (useful for restoring state)
  setSearchText(text) {
    this.shadowRoot.querySelector('.search-input').value = text;
  }

  // Method to clear search
  clear() {
    this.shadowRoot.querySelector('.search-input').value = '';
  }
}

customElements.define('header-search-bar', HeaderSearchBar);