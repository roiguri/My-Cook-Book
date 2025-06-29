/**
 * RecipeFilterComponent
 * @class
 * @extends HTMLElement
 *
 * @description
 * A custom web component that provides a modal interface for filtering recipes
 * with multiple criteria. The component extends Modal functionality for the interface
 * and integrates with Firebase/Firestore for data management. Supports RTL (Right-to-Left)
 * layout by default.
 *
 * @dependencies
 * - Requires Modal component (`custom-modal`)
 * - Firebase/Firestore for data fetching
 * - Firebase Authentication for user state
 *
 * @cssVariables
 * - --primary-color: Primary color for buttons and highlights
 * - --primary-hover: Hover state color for buttons
 * - --secondary-color: Used for border colors and backgrounds
 *
 * @example
 * // Basic Usage
 * <recipe-filter-component></recipe-filter-component>
 *
 * // With specific category and selected filters
 * <recipe-filter-component
 *   category="main-courses"
 *   cooking-time-filter="true"
 *   difficulty-filter="true"
 *   ingredient-filter="true"
 *   tags-filter="true"
 *   favorites-only="true">
 * </recipe-filter-component>
 *
 * // JavaScript interaction
 * const filterComponent = document.querySelector('recipe-filter-component');
 *
 * // Open the filter modal
 * filterComponent.open();
 *
 * // Listen for filter events
 * filterComponent.addEventListener('filter-applied', (e) => {
 *   const { recipes, filters } = e.detail;
 *   // Handle filtered recipes
 *   console.log('Filtered recipes:', recipes);
 *   console.log('Applied filters:', filters);
 * });
 *
 * @fires filter-applied - When filters are applied
 * @property {Object} detail.recipes - Array of filtered recipe objects
 * @property {Object} detail.filters - Current state of applied filters
 *
 * @fires filter-reset - When filters are reset
 * @property {Object} detail.category - Current category if set
 *
 * @attr {string} category - Optional category to filter recipes by
 * @attr {boolean} [cooking-time-filter=true] - Enable/disable cooking time filter
 * @attr {boolean} [difficulty-filter=true] - Enable/disable difficulty filter
 * @attr {boolean} [ingredient-filter=true] - Enable/disable main ingredient filter
 * @attr {boolean} [tags-filter=true] - Enable/disable tags filter
 * @attr {boolean} [favorites-only=false] - When true, only shows user's favorite recipes
 *
 * @state
 * - isLoading: Boolean indicating loading state
 * - matchingCount: Number of recipes matching current filters
 * - filters: Object containing current filter values
 *   - cookingTime: String ('0-30', '31-60', '61')
 *   - difficulty: String ('קלה', 'בינונית', 'קשה')
 *   - mainIngredient: String
 *   - tags: Array of strings
 *
 * @methods
 * - open() - Opens the filter modal
 * - close() - Closes the filter modal
 * - clearFilters() - Resets all filters to default state
 */

import authService from '../../../js/services/auth-service.js';
import { FirestoreService } from '../../../js/services/firestore-service.js';

class RecipeFilterComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Initialize state
    this.state = {
      isLoading: false,
      matchingCount: 0,
      filters: {
        cookingTime: '',
        difficulty: '',
        mainIngredient: '',
        tags: [],
        favoritesOnly: false,
      },
      availableFilters: {
        mainIngredients: [],
        tags: [],
      },
      category: null,
    };
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

  async connectedCallback() {
    const user = authService.getCurrentUser();
    if (user) {
      await this.loadInitialData();
    }
    this.render();
    this.setupEventListeners();
    this.setupAuthObserver();
  }

  disconnectedCallback() {
    // Clean up auth observer
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  }

  setupAuthObserver() {
    // Listen for auth state changes to update UI accordingly
    this.authUnsubscribe = authService.addAuthObserver(async (authState) => {
      // Re-render to show/hide favorites filter based on auth state
      this.render();
      this.setupEventListeners();

      // If user logged out while modal is open, update data
      if (!authState.user) {
        // Clear favorites filter state since user is no longer authenticated
        this.state.filters.favoritesOnly = false;
        this.updateUI();
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'category':
        this.state.category = newValue;
        // Only reload data if modal is not being programmatically configured
        // If recipes attribute is also being set, let that handle the data loading
        if (!this.hasAttribute('recipes')) {
          this.loadInitialData();
        }
        break;
      case 'current-filters':
        if (newValue) {
          try {
            const filters = JSON.parse(newValue);
            this.state.filters = {
              cookingTime: filters.cookingTime || '',
              difficulty: filters.difficulty || '',
              mainIngredient: filters.mainIngredient || '',
              tags: filters.tags || [],
              favoritesOnly: filters.favoritesOnly || false,
            };
            // Update UI to reflect current filters
            this.updateUI();
            // Recalculate matching count with current filters
            this.updateMatchingCount();
          } catch (error) {
            console.warn('Error parsing current-filters attribute:', error);
          }
        }
        break;
      case 'recipes':
        if (newValue) {
          try {
            const recipes = JSON.parse(newValue);
            this.setInitialRecipes(recipes);
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
      <custom-modal height="auto" width="auto">
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
      .filter-container {
        padding: 16px;
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
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .filter-section {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 8px;
        box-sizing: border-box;
        width: 100%;
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

      @media (max-width: 600px) {
        .filter-container {
          padding: 12px;
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
    return `
      <div class="filter-header">
        <h2>סינון מתכונים</h2>
        <span class="results-counter">
          ${this.state.isLoading ? 'טוען...' : `${this.state.matchingCount} מתכונים תואמים`}
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
        <div class="loading-text" style="display: ${this.state.isLoading ? 'block' : 'none'}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading ? 'none' : 'block'}">
          <select id="cooking-time">
            <option value="">הכל</option>
            <option value="0-30">0-30 דקות</option>
            <option value="31-60">31-60 דקות</option>
            <option value="61">מעל שעה</option>
          </select>
        </div>
      </div>
    `;
  }

  renderDifficultyFilter() {
    return `
      <div class="filter-section">
        <h3>רמת קושי</h3>
        <div class="loading-text" style="display: ${this.state.isLoading ? 'block' : 'none'}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading ? 'none' : 'block'}">
          <select id="difficulty">
            <option value="">הכל</option>
            <option value="קלה">קלה</option>
            <option value="בינונית">בינונית</option>
            <option value="קשה">קשה</option>
          </select>
        </div>
      </div>
    `;
  }

  renderIngredientFilter() {
    return `
      <div class="filter-section">
        <h3>מרכיב עיקרי</h3>
        <div class="loading-text" style="display: ${this.state.isLoading ? 'block' : 'none'}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading ? 'none' : 'block'}">
          <select id="main-ingredient">
            <option value="">הכל</option>
            ${this.state.availableFilters.mainIngredients
              .map(
                (ingredient) =>
                  `<option value="${ingredient}" ${this.state.filters.mainIngredient === ingredient ? 'selected' : ''}>
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
        <div class="loading-text" style="display: ${this.state.isLoading ? 'block' : 'none'}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading ? 'none' : 'block'}">
          <div class="searchable-select-container">
            <input 
              list="tags-list" 
              id="tags-select" 
              placeholder="חפש והוסף תגיות..."
              autocomplete="off"
            >
            <datalist id="tags-list">
              ${this.state.availableFilters.tags
                .filter((tag) => !this.state.filters.tags.includes(tag))
                .map((tag) => `<option value="${tag}">`)
                .join('')}
            </datalist>
          </div>
          <div class="tags-container">
            ${this.state.filters.tags
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
              ${this.state.filters.favoritesOnly ? 'checked' : ''}
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
        <button class="apply-btn" ${this.state.isLoading ? 'disabled' : ''}>
          החל סינון
        </button>
      </div>
    `;
  }

  renderLoading() {
    return `<div class="loading-indicator">טוען...</div>`;
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

    // Tag search
    const tagSearch = this.shadowRoot.getElementById('tag-search');
    if (tagSearch) {
      tagSearch.addEventListener('input', (e) => this.handleTagSearch(e));
    }

    // Tags input handler
    const tagsSelect = this.shadowRoot.getElementById('tags-select');
    if (tagsSelect) {
      tagsSelect.addEventListener('change', (e) => {
        const selectedTag = e.target.value;
        if (selectedTag && !this.state.filters.tags.includes(selectedTag)) {
          this.addTag(selectedTag);
          e.target.value = ''; // Clear input after selection
        }
      });

      // Handle Enter key
      tagsSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const inputValue = e.target.value;
          if (inputValue && !this.state.filters.tags.includes(inputValue)) {
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
    if (!this.state.filters.tags.includes(tag)) {
      this.state.filters.tags.push(tag);
      this.handleFilterChange();
    }
  }

  removeTag(tag) {
    this.state.filters.tags = this.state.filters.tags.filter((t) => t !== tag);
    this.handleFilterChange();
  }

  async loadInitialData() {
    this.state.isLoading = true;
    this.updateUI();
    try {
      const user = authService.getCurrentUser();
      if (this.hasAttribute('favorites-only')) {
        const userId = user.uid;
        const userDoc = await FirestoreService.getDocument('users', userId);
        const favoriteRecipeIds = userDoc?.favorites || [];
        // Fetch favorite recipes only
        const recipes = await Promise.all(
          favoriteRecipeIds.map(async (recipeId) => {
            return await FirestoreService.getDocument('recipes', recipeId);
          }),
        );
        this.state.availableFilters.mainIngredients = [
          ...new Set(
            recipes
              .map((r) => r?.mainIngredient)
              .filter((ingredient) => ingredient && ingredient.trim()),
          ),
        ].sort((a, b) => a.localeCompare(b));
        this.state.availableFilters.tags = [...new Set(recipes.flatMap((r) => r?.tags || []))];
        this.state.matchingCount = recipes.length;
      } else {
        // Build query params for FirestoreService
        const queryParams = {
          where: [['approved', '==', true]],
        };
        if (this.state.category) {
          queryParams.where.push(['category', '==', this.state.category]);
        }
        const recipes = await FirestoreService.queryDocuments('recipes', queryParams);
        this.state.availableFilters.mainIngredients = [
          ...new Set(
            recipes
              .map((r) => r?.mainIngredient)
              .filter((ingredient) => ingredient && ingredient.trim()),
          ),
        ].sort((a, b) => a.localeCompare(b));
        this.state.availableFilters.tags = [...new Set(recipes.flatMap((r) => r?.tags || []))];
        this.state.matchingCount = recipes.length;
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      this.state.isLoading = false;
      this.updateUI();
    }
  }

  async handleFilterChange() {
    this.updateFilterState();
    await this.updateMatchingCount();
  }

  async handleTagSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const suggestions = this.state.availableFilters.tags.filter(
      (tag) => tag.toLowerCase().includes(searchTerm) && !this.state.filters.tags.includes(tag),
    );

    const suggestionsContainer = this.shadowRoot.getElementById('tag-suggestions');
    suggestionsContainer.innerHTML = suggestions
      .map((tag) => `<div class="tag-suggestion" data-tag="${tag}">${tag}</div>`)
      .join('');
  }

  updateFilterState() {
    const cookingTime = this.shadowRoot.getElementById('cooking-time')?.value;
    const difficulty = this.shadowRoot.getElementById('difficulty')?.value;
    const mainIngredient = this.shadowRoot.getElementById('main-ingredient')?.value;
    const favoritesOnly = this.shadowRoot.getElementById('favorites-only')?.checked || false;

    this.state.filters = {
      ...this.state.filters,
      cookingTime,
      difficulty,
      mainIngredient,
      favoritesOnly,
    };
  }

  async updateMatchingCount() {
    this.state.isLoading = true;
    this.updateUI();
    try {
      const user = authService.getCurrentUser();
      let recipes;
      if (this.currentRecipes) {
        recipes = this.currentRecipes;
      } else if (this.hasAttribute('favorites-only') && user) {
        const userId = user.uid;
        const userDoc = await FirestoreService.getDocument('users', userId);
        const favoriteRecipeIds = userDoc?.favorites || [];
        recipes = await Promise.all(
          favoriteRecipeIds.map(async (recipeId) => {
            return await FirestoreService.getDocument('recipes', recipeId);
          }),
        );
      } else {
        const queryParams = {
          where: [['approved', '==', true]],
        };
        if (this.state.category) {
          queryParams.where.push(['category', '==', this.state.category]);
        }
        recipes = await FirestoreService.queryDocuments('recipes', queryParams);
      }
      recipes = await this.applyFiltersToRecipes(recipes);
      this.state.matchingCount = recipes.length;
    } catch (error) {
      console.error('Error updating matching count:', error);
    } finally {
      this.state.isLoading = false;
      this.updateUI();
    }
  }

  async applyFiltersToRecipes(recipes) {
    const { cookingTime, difficulty, mainIngredient, tags, favoritesOnly } = this.state.filters;

    let filteredRecipes = recipes.filter((recipe) => {
      // Cooking time filter
      if (cookingTime) {
        const totalTime = recipe.prepTime + recipe.waitTime;
        const [min, max] = cookingTime.split('-').map(Number);
        if (max) {
          if (totalTime < min || totalTime > max) return false;
        } else {
          if (totalTime < min) return false;
        }
      }

      // Difficulty filter
      if (difficulty && recipe.difficulty !== difficulty) return false;

      // Main ingredient filter
      if (mainIngredient && recipe.mainIngredient !== mainIngredient) return false;

      // Tags filter
      if (tags.length > 0 && !tags.every((tag) => recipe.tags.includes(tag))) return false;

      return true;
    });

    // Favorites filter (only for authenticated users)
    if (favoritesOnly) {
      const user = authService.getCurrentUser();
      if (user) {
        try {
          const userDoc = await FirestoreService.getDocument('users', user.uid);
          const favoriteRecipeIds = userDoc?.favorites || [];
          filteredRecipes = filteredRecipes.filter((recipe) =>
            favoriteRecipeIds.includes(recipe.id),
          );
        } catch (error) {
          console.error('Error fetching user favorites:', error);
        }
      }
    }

    return filteredRecipes;
  }

  async applyFilters() {
    this.state.isLoading = true;
    this.updateUI();
    try {
      const user = authService.getCurrentUser();
      let recipes;
      if (this.currentRecipes) {
        recipes = this.currentRecipes;
      } else if (this.hasAttribute('favorites-only') && user) {
        const userId = user.uid;
        const userDoc = await FirestoreService.getDocument('users', userId);
        const favoriteRecipeIds = userDoc?.favorites || [];
        recipes = await Promise.all(
          favoriteRecipeIds.map(async (recipeId) => {
            return await FirestoreService.getDocument('recipes', recipeId);
          }),
        );
      } else {
        const queryParams = {
          where: [['approved', '==', true]],
        };
        if (this.state.category) {
          queryParams.where.push(['category', '==', this.state.category]);
        }
        recipes = await FirestoreService.queryDocuments('recipes', queryParams);
      }
      recipes = await this.applyFiltersToRecipes(recipes);
      this.dispatchEvent(
        new CustomEvent('filter-applied', {
          bubbles: true,
          composed: true,
          detail: {
            recipes,
            filters: { ...this.state.filters, category: this.state.category },
          },
        }),
      );
      this.close();
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      this.state.isLoading = false;
      this.updateUI();
    }
  }

  clearFilters() {
    // Reset filter state
    this.state.filters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: false,
    };

    // Reset UI elements
    const selects = ['cooking-time', 'difficulty', 'main-ingredient'];
    selects.forEach((id) => {
      const select = this.shadowRoot.getElementById(id);
      if (select) select.value = '';
    });

    // Clear favorites checkbox
    const favoritesCheckbox = this.shadowRoot.getElementById('favorites-only');
    if (favoritesCheckbox) favoritesCheckbox.checked = false;

    // Clear tag search
    const tagSearch = this.shadowRoot.getElementById('tag-search');
    if (tagSearch) tagSearch.value = '';

    // Update UI
    this.updateMatchingCount();

    // Dispatch reset event with current recipes if available
    this.dispatchEvent(
      new CustomEvent('filter-reset', {
        bubbles: true,
        composed: true,
        detail: {
          recipes: this.currentRecipes || null,
          category: this.state.category,
        },
      }),
    );
  }

  updateUI() {
    // Instead of re-rendering everything, update specific parts
    this.updateLoadingState();
    this.updateCounter();
    this.updateFilterValues();
    this.updateTagsDisplay();
    this.updateApplyButton();
    this.updateIngredientSelect();
  }

  updateLoadingState() {
    const loadingElements = this.shadowRoot.querySelectorAll('.loading-text');
    loadingElements.forEach((element) => {
      element.style.display = this.state.isLoading ? 'block' : 'none';
    });

    const contentElements = this.shadowRoot.querySelectorAll('.filter-content');
    contentElements.forEach((element) => {
      element.style.display = this.state.isLoading ? 'none' : 'block';
    });
  }

  async updateCounter() {
    const counter = this.shadowRoot.querySelector('.results-counter');
    if (counter) {
      counter.textContent = this.state.isLoading
        ? 'טוען...'
        : `${this.state.matchingCount} מתכונים תואמים`;
    }
  }

  updateFilterValues() {
    const { cookingTime, difficulty, mainIngredient, favoritesOnly } = this.state.filters;

    const selects = {
      'cooking-time': cookingTime,
      difficulty: difficulty,
      'main-ingredient': mainIngredient,
    };

    Object.entries(selects).forEach(([id, value]) => {
      const select = this.shadowRoot.getElementById(id);
      if (select && value) {
        select.value = value;
      }
    });

    // Update favorites checkbox
    const favoritesCheckbox = this.shadowRoot.getElementById('favorites-only');
    if (favoritesCheckbox) {
      favoritesCheckbox.checked = favoritesOnly;
    }
  }

  updateTagsDisplay() {
    const tagsContainer = this.shadowRoot.querySelector('.tags-container');
    if (tagsContainer) {
      tagsContainer.innerHTML = this.state.filters.tags
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
      datalist.innerHTML = this.state.availableFilters.tags
        .filter((tag) => !this.state.filters.tags.includes(tag))
        .map((tag) => `<option value="${tag}">`)
        .join('');
    }
  }

  updateApplyButton() {
    const applyBtn = this.shadowRoot.querySelector('.apply-btn');
    if (applyBtn) {
      applyBtn.disabled = this.state.isLoading;
    }
  }

  updateIngredientSelect() {
    const select = this.shadowRoot.getElementById('main-ingredient');
    if (select) {
      // Store current selection
      const currentValue = select.value;

      // Clear and rebuild options
      select.innerHTML = `
        <option value="">הכל</option>
        ${this.state.availableFilters.mainIngredients
          .map(
            (ingredient) =>
              `<option value="${ingredient}" ${currentValue === ingredient ? 'selected' : ''}>
            ${ingredient}
          </option>`,
          )
          .join('')}
      `;
    }
  }

  setInitialRecipes(recipes) {
    this.currentRecipes = recipes;

    // Update available filters based on current recipes
    this.state.availableFilters.mainIngredients = [
      ...new Set(
        recipes
          .map((r) => r.mainIngredient)
          .filter((ingredient) => ingredient && ingredient.trim()),
      ),
    ].sort((a, b) => a.localeCompare(b));

    this.state.availableFilters.tags = [...new Set(recipes.flatMap((r) => r.tags || []))];

    this.state.matchingCount = recipes.length;
    this.updateUI();
  }

  // Public methods
  open() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    if (modal) modal.open();
  }

  close() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    if (modal) modal.close();
  }

  // Update the recipe counter from external source (e.g., categories page)
  updateRecipeCount(count) {
    this.state.matchingCount = count;
    this.updateCounter();
  }
}

customElements.define('recipe-filter-component', RecipeFilterComponent);
