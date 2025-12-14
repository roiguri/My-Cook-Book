import { FirestoreService } from '../../../js/services/firestore-service.js';
import { FilterUtils } from '../../../js/utils/filter-utils.js';
import { showToast } from '../../notifications/toast-notification/toast-notification.js';

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
        :host {
          display: block;
        }

        .search-form {
          position: relative;
          background-color: #f3f4f6; /* bg-gray-100 */
          border-radius: 9999px; /* rounded-full */
          display: flex;
          align-items: center;
          height: 40px;
          width: 300px; /* Fixed width or max-width */
          max-width: 100%;
          transition: ring 0.2s ease;
        }

        .search-form:focus-within {
          box-shadow: 0 0 0 2px var(--bg-main-dark, #bcebc6); /* focus:ring-green-300 equivalent */
        }

        .search-input {
          background: transparent;
          border: none;
          font-family: var(--body-font, sans-serif);
          font-size: 0.875rem; /* text-sm */
          padding: 0.5rem 1rem 0.5rem 2.5rem; /* Left padding for icon space in LTR, but we are RTL? */
          /* RTL Handling: In RTL, the start is right. So padding-right should be larger if icon is on right. */
          /* Wait, the design has the icon on the LEFT in LTR. In RTL, it should probably be on the RIGHT? */
          /* Reference image has icon on left. But we are RTL. */
          /* If we follow standard RTL, search icon is usually at the start (Right). */
          /* Let's put icon on the Right (Start) for RTL. */
          padding-right: 2.8rem; /* Space for icon on the right */
          padding-left: 1rem;

          flex-grow: 1;
          outline: none;
          height: 100%;
          width: 100%;
          border-radius: 9999px;
          color: var(--text-primary, #1f2937);
        }

        /* Placeholder color */
        .search-input::placeholder {
          color: #9ca3af; /* text-gray-400 */
        }

        .search-icon-wrapper {
          position: absolute;
          right: 0.75rem; /* RTL: Start is Right */
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280; /* text-gray-500 */
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Submit button (hidden visually or acting as the icon) */
        .search-submit-btn {
          display: none;
        }

        @media (max-width: 768px) {
          .search-form {
            width: 100%;
          }
        }
      </style>

      <form dir="rtl" class="search-form">
        <div class="search-icon-wrapper">
          <svg class="w-4 h-4" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
        <input type="search"
               class="search-input"
               placeholder="${placeholder}"
               aria-label="${UI_TEXT.SEARCH_ARIA_LABEL}">
        <button type="submit" class="search-submit-btn">Search</button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('.search-form');
    const input = this.shadowRoot.querySelector('.search-input');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      input.blur();
      this.navigateToSearch(input.value);
    });

    input.addEventListener('input', this.handleInput.bind(this));
  }

  handleInput(e) {
    const searchText = e.target.value.trim();
    this.dispatchEvent(
      new CustomEvent('search-input', {
        bubbles: true,
        composed: true,
        detail: { searchText },
      }),
    );
  }

  async navigateToSearch(searchText) {
    if (!searchText.trim()) return;

    try {
      const recipes = await FirestoreService.queryDocuments('recipes', {
        where: [['approved', '==', true]],
      });

      const filteredRecipes = FilterUtils.searchRecipes(recipes, searchText);

      if (filteredRecipes.length === 1) {
        const recipeId = filteredRecipes[0].id;
        const recipeName = filteredRecipes[0].name;

        showToast(UI_TEXT.SINGLE_RESULT_FOUND(recipeName), 'success', DEFAULT_TOAST_DURATION_MS);

        if (window.spa?.router) {
          window.spa.router.navigate(`/recipe/${recipeId}`);
          if (typeof window.closeHamburgerMenuIfOpen === 'function') {
            window.closeHamburgerMenuIfOpen();
          }
          setTimeout(() => {
            if (typeof window.updateActiveNavigation === 'function') {
              window.updateActiveNavigation();
            }
          }, NAVIGATION_UPDATE_DELAY_MS);
          this.clear();
        } else {
          window.location.href = `./pages/recipe.html?id=${recipeId}`;
        }
        return;
      }
    } catch (error) {
      console.error('Error loading recipes for search:', error);
    }

    if (window.spa?.router) {
      const searchParams = new URLSearchParams();
      searchParams.set('q', searchText);
      const searchUrl = `/categories?${searchParams.toString()}`;
      window.spa.router.navigate(searchUrl);

      if (typeof window.closeHamburgerMenuIfOpen === 'function') {
        window.closeHamburgerMenuIfOpen();
      }

      setTimeout(() => {
        if (typeof window.updateActiveNavigation === 'function') {
          window.updateActiveNavigation();
        }
      }, NAVIGATION_UPDATE_DELAY_MS);

      this.clear();
    } else {
      const searchParams = new URLSearchParams();
      searchParams.set('q', searchText);
      const isIndexPage =
        window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
      const baseUrl = isIndexPage ? './pages/categories.html' : './categories.html';
      const searchUrl = `${baseUrl}?${searchParams.toString()}`;
      window.location.href = searchUrl;
    }
  }

  getSearchText() {
    return this.shadowRoot.querySelector('.search-input').value;
  }

  setSearchText(text) {
    this.shadowRoot.querySelector('.search-input').value = text;
  }

  clear() {
    this.shadowRoot.querySelector('.search-input').value = '';
  }
}

customElements.define('header-search-bar', HeaderSearchBar);
