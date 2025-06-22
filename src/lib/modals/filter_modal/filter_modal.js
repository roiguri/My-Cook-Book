/**
 * RecipeFilterComponent - Simplified
 * @class
 * @extends HTMLElement
 *
 * @description
 * A simplified custom web component that provides a modal interface for filtering recipes.
 * Uses provided recipes data and pure FilterUtils for filtering logic.
 * No Firebase dependencies - all data is provided externally.
 *
 * @dependencies
 * - Requires Modal component (`custom-modal`)
 * - FilterUtils for filtering logic
 * - Firebase Authentication only for user state (showing favorites filter)
 *
 * @example
 * // JavaScript usage
 * const filterComponent = document.querySelector('recipe-filter-component');
 *
 * // Set recipes data
 * filterComponent.setRecipes(recipesArray);
 *
 * // Set current filters
 * filterComponent.setCurrentFilters({
 *   cookingTime: '0-30',
 *   difficulty: 'קלה',
 *   tags: ['בריא', 'מהיר']
 * });
 *
 * // Open the filter modal
 * filterComponent.open();
 *
 * // Listen for filter events
 * filterComponent.addEventListener('filter-applied', (e) => {
 *   const { recipes, filters, count } = e.detail;
 *   // Handle filtered recipes
 * });
 *
 * @fires filter-applied - When filters are applied
 * @property {Array} detail.recipes - Filtered recipe objects
 * @property {Object} detail.filters - Applied filter values
 * @property {number} detail.count - Number of filtered recipes
 *
 * @fires filter-reset - When filters are reset
 * @property {Array} detail.recipes - All original recipes
 * @property {number} detail.count - Total number of recipes
 *
 * @methods
 * - setRecipes(recipes) - Set the recipes data to filter
 * - setCurrentFilters(filters) - Set current filter values
 * - getCurrentFilters() - Get current filter values
 * - getFilteredRecipes() - Get filtered recipes array
 * - open() - Opens the filter modal
 * - close() - Closes the filter modal
 */

import authService from '../../../js/services/auth-service.js';
import { FirestoreService } from '../../../js/services/firestore-service.js';
import { FilterUtils } from '../../../js/utils/filter-utils.js';

class RecipeFilterComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Initialize state - simplified
    this.recipes = []; // Provided externally
    this.filters = FilterUtils.createEmptyFilters();
    this.availableOptions = FilterUtils.extractFilterOptions([]);
    this.category = null;
    this.favoriteRecipeIds = []; // Cache for user's favorite recipe IDs
  }

  static get observedAttributes() {
    return [
      'category',
      'cooking-time-filter',
      'difficulty-filter',
      'ingredient-filter',
      'tags-filter',
      'favorites-filter',
      'current-filters',
      'recipes',
    ];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setupAuthObserver();
  }

  disconnectedCallback() {
    // Clean up auth observer
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }

    // Clean up timeouts
    if (this._filterChangeTimeout) {
      clearTimeout(this._filterChangeTimeout);
    }
  }

  setupAuthObserver() {
    // Listen for auth state changes to update UI accordingly
    this.authUnsubscribe = authService.addAuthObserver((authState) => {
      // Re-render to show/hide favorites filter based on auth state
      this.render();
      this.setupEventListeners();

      // If user logged out while modal is open, clear favorites filter and data
      if (!authState.user) {
        this.favoriteRecipeIds = [];
        if (this.filters.favoritesOnly) {
          this.filters.favoritesOnly = false;
          this.updateUI();
        }
      } else {
        // User logged in, clear cached favorites so they reload fresh
        this.favoriteRecipeIds = [];
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'category':
        this.category = newValue;
        break;
      case 'current-filters':
        if (newValue) {
          try {
            const filters = JSON.parse(newValue);
            this.filters = FilterUtils.validateFilters(filters);
            this.updateUI();
          } catch (error) {
            console.warn('Error parsing current-filters attribute:', error);
          }
        }
        break;
      case 'recipes':
        if (newValue) {
          try {
            const recipes = JSON.parse(newValue);
            this.setRecipes(recipes);
          } catch (error) {
            console.warn('Error parsing recipes attribute:', error);
          }
        }
        break;
      // Handle other attribute changes...
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>
      <custom-modal height="auto" width="min(700px, 85vw)">
        <div class="filter-container">
          ${this.renderHeader()}
          ${this.renderFilterGrid()}
          ${this.renderFooter()}
        </div>
      </custom-modal>
    `;
  }

  styles() {
    return `
      :host {
        --modal-max-width: 700px;
        --modal-mobile-width: 85vw;
      }

      .filter-container {
        padding: 16px;
        width: 100%;
        max-width: var(--modal-max-width);
        box-sizing: border-box;
      }

      .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        gap: 8px;
      }

      .filter-header h2 {
        margin: 0;
        font-size: 1.25rem;
      }

      .results-counter {
        color: #666;
        font-size: 0.9em;
        white-space: nowrap;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      .filter-section {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 8px;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        overflow: hidden;
      }

      .filter-section h3 {
        margin: 0 0 8px 0;
        font-size: 1rem;
        color: #333;
      }

      .filter-content {
        width: 100%;
        box-sizing: border-box;
      }
      
      .searchable-select-container {
        width: 100%;
        box-sizing: border-box;
      }

      select, input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        font-size: 0.9rem;
        margin: 0;
      }

      #tags-select {
        width: auto;
      }

      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        min-height: 28px;
      }

      .tag {
        background: #e0e0e0;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 2px 0;
      }

      .tag-remove {
        cursor: pointer;
        color: #666;
        margin-left: 2px;
        font-size: 1.1rem;
        line-height: 1;
      }

      .tag-remove:hover {
        color: #333;
      }

      .filter-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid #ddd;
      }

      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
      }

      .apply-btn {
        background: var(--primary-color, #bb6016);
        color: white;
      }

      .apply-btn:disabled {
        background: #cccccc;
        cursor: not-allowed;
      }

      .clear-btn {
        background: #f5f5f5;
        color: #333;
      }

      .button:hover:not(:disabled) {
        opacity: 0.9;
      }

      .loading-text {
        padding: 8px;
        text-align: center;
        color: #666;
        font-style: italic;
        font-size: 0.9rem;
      }

      .favorites-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 0.9rem;
      }

      .favorites-checkbox input[type="checkbox"] {
        width: auto;
        margin: 0;
      }

      .checkmark {
        display: none;
      }

      .checkbox-label {
        color: #333;
      }

      /* Custom scrollbar for better visual */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      ::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 3px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #ccc;
      }

      @media (max-width: 768px) {
        .filter-container {
          padding: 12px;
          max-width: var(--modal-mobile-width);
        }

        .filter-grid {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .filter-header {
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .filter-section {
          padding: 10px;
        }

        .filter-footer {
          padding-top: 8px;
        }

        button {
          padding: 6px 12px;
          font-size: 0.85rem;
        }
      }
    `;
  }

  renderHeader() {
    const matchingCount = this.getMatchingCount();
    return `
      <div class="filter-header">
        <h2>סינון מתכונים</h2>
        <span class="results-counter">
          ${matchingCount} מתכונים תואמים
        </span>
      </div>
    `;
  }

  renderFilterGrid() {
    const user = authService.getCurrentUser();
    return `
      <div class="filter-grid">
        ${this.getAttribute('cooking-time-filter') !== 'false' ? this.renderCookingTimeFilter() : ''}
        ${this.getAttribute('difficulty-filter') !== 'false' ? this.renderDifficultyFilter() : ''}
        ${this.getAttribute('ingredient-filter') !== 'false' ? this.renderIngredientFilter() : ''}
        ${this.getAttribute('tags-filter') !== 'false' ? this.renderTagsFilter() : ''}
        ${user && this.getAttribute('favorites-filter') !== 'false' ? this.renderFavoritesFilter() : ''}
      </div>
    `;
  }

  renderCookingTimeFilter() {
    return `
      <div class="filter-section">
        <h3>זמן הכנה</h3>
        <div class="filter-content">
          <select id="cooking-time">
            <option value="">הכל</option>
            <option value="0-30" ${this.filters.cookingTime === '0-30' ? 'selected' : ''}>0-30 דקות</option>
            <option value="31-60" ${this.filters.cookingTime === '31-60' ? 'selected' : ''}>31-60 דקות</option>
            <option value="61" ${this.filters.cookingTime === '61' ? 'selected' : ''}>מעל שעה</option>
          </select>
        </div>
      </div>
    `;
  }

  renderDifficultyFilter() {
    return `
      <div class="filter-section">
        <h3>רמת קושי</h3>
        <div class="filter-content">
          <select id="difficulty">
            <option value="">הכל</option>
            <option value="קלה" ${this.filters.difficulty === 'קלה' ? 'selected' : ''}>קלה</option>
            <option value="בינונית" ${this.filters.difficulty === 'בינונית' ? 'selected' : ''}>בינונית</option>
            <option value="קשה" ${this.filters.difficulty === 'קשה' ? 'selected' : ''}>קשה</option>
          </select>
        </div>
      </div>
    `;
  }

  renderIngredientFilter() {
    return `
      <div class="filter-section">
        <h3>מרכיב עיקרי</h3>
        <div class="filter-content">
          <select id="main-ingredient">
            <option value="">הכל</option>
            ${this.availableOptions.mainIngredients
              .map(
                (ingredient) =>
                  `<option value="${ingredient}" ${this.filters.mainIngredient === ingredient ? 'selected' : ''}>
                ${ingredient}
              </option>`,
              )
              .join('')}
          </select>
        </div>
      </div>
    `;
  }

  renderTagsFilter() {
    return `
      <div class="filter-section">
        <h3>תגיות</h3>
        <div class="filter-content">
          <div class="searchable-select-container">
            <input 
              list="tags-list" 
              id="tags-select" 
              placeholder="חפש והוסף תגיות..."
              autocomplete="off"
            >
            <datalist id="tags-list">
              ${this.availableOptions.tags
                .filter((tag) => !this.filters.tags.includes(tag))
                .map((tag) => `<option value="${tag}">`)
                .join('')}
            </datalist>
          </div>
          <div class="tags-container">
            ${this.filters.tags
              .map(
                (tag) => `
              <span class="tag">
                ${tag}
                <span class="tag-remove" data-tag="${tag}">×</span>
              </span>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderFavoritesFilter() {
    return `
      <div class="filter-section">
        <h3>מועדפים</h3>
        <div class="filter-content">
          <label class="favorites-checkbox">
            <input 
              type="checkbox" 
              id="favorites-only"
              ${this.filters.favoritesOnly ? 'checked' : ''}
            >
            <span class="checkmark"></span>
            <span class="checkbox-label">הצג רק מועדפים</span>
          </label>
        </div>
      </div>
    `;
  }

  renderFooter() {
    return `
      <div class="filter-footer">
        <button class="clear-btn">נקה הכל</button>
        <button class="apply-btn">
          החל סינון
        </button>
      </div>
    `;
  }

  renderLoading() {
    return `<div class="loading-indicator"></div>`;
  }

  setupEventListeners() {
    const modal = this.shadowRoot.querySelector('custom-modal');

    // Filter change listeners
    ['cooking-time', 'difficulty', 'main-ingredient'].forEach((id) => {
      const select = this.shadowRoot.getElementById(id);
      if (select) {
        select.addEventListener('change', () => this.handleFilterChange());
      }
    });

    // Favorites checkbox listener
    const favoritesCheckbox = this.shadowRoot.getElementById('favorites-only');
    if (favoritesCheckbox) {
      favoritesCheckbox.addEventListener('change', () => this.handleFilterChange());
    }

    // Tags input handler
    const tagsSelect = this.shadowRoot.getElementById('tags-select');
    if (tagsSelect) {
      // Handle both input and change events for datalist
      tagsSelect.addEventListener('input', (e) => {
        const selectedTag = e.target.value.trim();
        if (
          selectedTag &&
          this.availableOptions.tags.includes(selectedTag) &&
          !this.filters.tags.includes(selectedTag)
        ) {
          this.addTag(selectedTag);
          e.target.value = ''; // Clear input after selection
        }
      });

      tagsSelect.addEventListener('change', (e) => {
        const selectedTag = e.target.value.trim();
        if (selectedTag && !this.filters.tags.includes(selectedTag)) {
          this.addTag(selectedTag);
          e.target.value = ''; // Clear input after selection
        }
      });

      // Handle Enter key
      tagsSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const inputValue = e.target.value.trim();
          if (inputValue && !this.filters.tags.includes(inputValue)) {
            this.addTag(inputValue);
            e.target.value = ''; // Clear input after adding
          }
          e.preventDefault(); // Prevent form submission
        }
      });
    }

    // Tag removal
    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag-remove')) {
        const tag = e.target.dataset.tag;
        this.removeTag(tag);
      }
    });

    // Button listeners
    const applyBtn = this.shadowRoot.querySelector('.apply-btn');
    const clearBtn = this.shadowRoot.querySelector('.clear-btn');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyFilters());
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  addTag(tag) {
    if (!this.filters.tags.includes(tag)) {
      this.filters.tags.push(tag);
      this.updateTagsDisplay();
      this.handleFilterChange();
    }
  }

  removeTag(tag) {
    this.filters.tags = this.filters.tags.filter((t) => t !== tag);
    this.updateTagsDisplay();
    this.handleFilterChange();
  }

  // Simplified: Set recipes and extract filter options
  setRecipes(recipes) {
    this.recipes = recipes || [];
    this.availableOptions = FilterUtils.extractFilterOptions(this.recipes);
    this.updateUI();
  }

  // Load user's favorite recipe IDs from Firestore
  async loadUserFavorites() {
    const user = authService.getCurrentUser();
    if (!user) {
      this.favoriteRecipeIds = [];
      return;
    }

    try {
      const userDoc = await FirestoreService.getDocument('users', user.uid);
      this.favoriteRecipeIds = userDoc?.favorites || [];
    } catch (error) {
      console.error('Error loading user favorites:', error);
      this.favoriteRecipeIds = [];
    }
  }

  handleFilterChange() {
    this.updateFilterState();
    // Use debouncing to prevent too many rapid updates
    if (this._filterChangeTimeout) {
      clearTimeout(this._filterChangeTimeout);
    }

    this._filterChangeTimeout = setTimeout(async () => {
      // If favorites filter is enabled, ensure we have favorites data
      if (this.filters.favoritesOnly && this.favoriteRecipeIds.length === 0) {
        await this.loadUserFavorites();
      }
      this.updateCounter();
    }, 300); // 300ms debounce
  }

  updateFilterState() {
    const cookingTime = this.shadowRoot.getElementById('cooking-time')?.value || '';
    const difficulty = this.shadowRoot.getElementById('difficulty')?.value || '';
    const mainIngredient = this.shadowRoot.getElementById('main-ingredient')?.value || '';
    const favoritesOnly = this.shadowRoot.getElementById('favorites-only')?.checked || false;

    this.filters = {
      ...this.filters,
      cookingTime,
      difficulty,
      mainIngredient,
      favoritesOnly,
    };
  }

  // Simplified: Calculate matching count from current recipes
  getMatchingCount() {
    if (!this.recipes || this.recipes.length === 0) {
      return 0;
    }
    return FilterUtils.applyFilters(this.recipes, this.filters, this.favoriteRecipeIds).length;
  }

  // Simplified: Use FilterUtils for filtering
  applyCurrentFilters() {
    return FilterUtils.applyFilters(this.recipes, this.filters, this.favoriteRecipeIds);
  }

  applyFilters() {
    const filteredRecipes = this.applyCurrentFilters();

    this.dispatchEvent(
      new CustomEvent('filter-applied', {
        bubbles: true,
        composed: true,
        detail: {
          recipes: filteredRecipes,
          filters: { ...this.filters, category: this.category },
          count: filteredRecipes.length,
        },
      }),
    );
    this.close();
  }

  clearFilters() {
    // Reset filter state
    this.filters = FilterUtils.createEmptyFilters();

    // Reset UI elements
    const selects = ['cooking-time', 'difficulty', 'main-ingredient'];
    selects.forEach((id) => {
      const select = this.shadowRoot.getElementById(id);
      if (select) select.value = '';
    });

    // Clear favorites checkbox
    const favoritesCheckbox = this.shadowRoot.getElementById('favorites-only');
    if (favoritesCheckbox) favoritesCheckbox.checked = false;

    // Clear tags input
    const tagsSelect = this.shadowRoot.getElementById('tags-select');
    if (tagsSelect) tagsSelect.value = '';

    // Update UI
    this.updateUI();

    // Dispatch reset event with all recipes (unfiltered)
    this.dispatchEvent(
      new CustomEvent('filter-reset', {
        bubbles: true,
        composed: true,
        detail: {
          recipes: this.recipes,
          category: this.category,
          count: this.recipes.length,
        },
      }),
    );
  }

  updateUI() {
    // Simple UI update - just re-render
    this.render();
    this.setupEventListeners();
  }

  updateCounter() {
    const counter = this.shadowRoot.querySelector('.results-counter');
    if (counter) {
      const count = this.getMatchingCount();
      counter.textContent = `${count} מתכונים תואמים`;
    }
  }

  updateTagsDisplay() {
    const tagsContainer = this.shadowRoot.querySelector('.tags-container');
    if (tagsContainer) {
      tagsContainer.innerHTML = this.filters.tags
        .map(
          (tag) => `
        <span class="tag">
          ${tag}
          <span class="tag-remove" data-tag="${tag}">×</span>
        </span>
      `,
        )
        .join('');
    }

    // Update available options in datalist
    const datalist = this.shadowRoot.getElementById('tags-list');
    if (datalist) {
      datalist.innerHTML = this.availableOptions.tags
        .filter((tag) => !this.filters.tags.includes(tag))
        .map((tag) => `<option value="${tag}">`)
        .join('');
    }
  }

  // Public API methods for external control
  setCurrentFilters(filters) {
    this.filters = FilterUtils.validateFilters(filters);
    this.updateUI();
  }

  setCategory(category) {
    this.category = category;
  }

  getCurrentFilters() {
    return { ...this.filters };
  }

  getFilteredRecipes() {
    return this.applyCurrentFilters();
  }

  // Public methods
  async open() {
    // If favorites filter is enabled, ensure we have favorites data
    if (this.filters.favoritesOnly) {
      await this.loadUserFavorites();
      this.updateUI(); // Update counter after loading favorites
    }

    const modal = this.shadowRoot.querySelector('custom-modal');
    if (modal) modal.open();
  }

  close() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    if (modal) modal.close();
  }
}

customElements.define('recipe-filter-component', RecipeFilterComponent);
