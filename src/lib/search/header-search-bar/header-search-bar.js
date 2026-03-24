import { FirestoreService } from '../../../js/services/firestore-service.js';
import { FilterUtils } from '../../../js/utils/filter-utils.js';
import { showToast } from '../../notifications/toast-notification/toast-notification.js';
import { debounce } from '../../../js/utils/common-utils.js';

// Constants
const NAVIGATION_UPDATE_DELAY_MS = 100;
const DEFAULT_TOAST_DURATION_MS = 3000;

// UI Text Constants
const UI_TEXT = {
  SEARCH_PLACEHOLDER: 'חיפוש מתכונים...',
  SEARCH_ARIA_LABEL: 'חיפוש מתכונים',
  SINGLE_RESULT_FOUND: (recipeName) => `נמצא מתכון אחד: "${recipeName}" - מעבר ישיר למתכון`,
};

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

    this.debouncedHandleInput = debounce((searchText) => {
      this.dispatchEvent(
        new CustomEvent('search-input', {
          bubbles: true,
          composed: true,
          detail: { searchText },
        }),
      );
    }, 300);
  }

  static get observedAttributes() {
    return ['placeholder'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'placeholder' && this.shadowRoot) {
      const input = this.shadowRoot.querySelector('.search-input');
      if (input) {
        input.placeholder = newValue || UI_TEXT.SEARCH_PLACEHOLDER;
      }
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const placeholder = this.getAttribute('placeholder') || UI_TEXT.SEARCH_PLACEHOLDER;

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
          min-width: 0;
          width: 100%;
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

        .search-form:hover .search-button,
        .search-button:hover {
          box-shadow: inset 0 0 0 1px var(--primary-color);
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
               aria-label="${UI_TEXT.SEARCH_ARIA_LABEL}">
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
      // Close mobile keyboard by blurring the input
      input.blur();
      this.navigateToSearch(input.value);
    });

    // Handle input changes
    input.addEventListener('input', this.handleInput.bind(this));
  }

  handleInput(e) {
    const searchText = e.target.value.trim();

    this.debouncedHandleInput(searchText);
  }

  async navigateToSearch(searchText) {
    if (!searchText.trim()) return;

    try {
      // Load all approved recipes from Firestore
      const recipes = await FirestoreService.queryDocuments('recipes', {
        where: [['approved', '==', true]],
      });

      // Filter recipes using the same logic as categories page
      const filteredRecipes = FilterUtils.searchRecipes(recipes, searchText);

      // If exactly one match, navigate directly to that recipe
      if (filteredRecipes.length === 1) {
        const recipeId = filteredRecipes[0].id;
        const recipeName = filteredRecipes[0].name;

        // Show toast notification
        showToast(UI_TEXT.SINGLE_RESULT_FOUND(recipeName), 'success', DEFAULT_TOAST_DURATION_MS);

        if (window.spa?.router) {
          window.spa.router.navigate(`/recipe/${recipeId}`);

          // Close hamburger menu if open
          if (typeof window.closeHamburgerMenuIfOpen === 'function') {
            window.closeHamburgerMenuIfOpen();
          }

          // Update navigation active state after navigation
          setTimeout(() => {
            if (typeof window.updateActiveNavigation === 'function') {
              window.updateActiveNavigation();
            }
          }, NAVIGATION_UPDATE_DELAY_MS);

          // Clear the search input
          this.clear();
        } else {
          // Fallback to legacy navigation for single recipe
          window.location.href = `./pages/recipe.html?id=${recipeId}`;
        }
        return;
      }
    } catch (error) {
      console.error('Error loading recipes for search:', error);
      // Fall through to default behavior if there's an error
    }

    // Default behavior: navigate to categories page with search parameter
    // This handles 0 results, multiple results, or errors
    // Check if we're in the SPA context
    if (window.spa?.router) {
      // Use SPA router for navigation
      const searchParams = new URLSearchParams();
      searchParams.set('q', searchText);
      const searchUrl = `/categories?${searchParams.toString()}`;
      window.spa.router.navigate(searchUrl);

      // Close hamburger menu if open
      if (typeof window.closeHamburgerMenuIfOpen === 'function') {
        window.closeHamburgerMenuIfOpen();
      }

      // Update navigation active state after search navigation
      setTimeout(() => {
        if (typeof window.updateActiveNavigation === 'function') {
          window.updateActiveNavigation();
        }
      }, NAVIGATION_UPDATE_DELAY_MS);

      // Clear the navigation search input after navigation
      this.clear();
    } else {
      // Fallback to legacy navigation
      const searchParams = new URLSearchParams();
      searchParams.set('q', searchText);

      // Determine if we're on the index page or in a subdirectory
      const isIndexPage =
        window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

      // Build the categories page URL
      const baseUrl = isIndexPage ? './pages/categories.html' : './categories.html';
      const searchUrl = `${baseUrl}?${searchParams.toString()}`;

      // Navigate to categories page with search parameter
      window.location.href = searchUrl;
      // Note: for legacy navigation, page will reload so clearing isn't needed
    }
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
    this.debouncedHandleInput.cancel();
  }
}

customElements.define('header-search-bar', HeaderSearchBar);
