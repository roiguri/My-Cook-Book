/**
 * SearchService Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * A core search service component that handles search functionality across the website.
 * Supports filtering by name, category, and tags, and integrates with the filter modal.
 *
 * @fires search-results-updated - When search results are updated
 * @property {Object} detail.results - Array of filtered recipe objects
 * @property {Object} detail.searchParams - Current search parameters
 *
 * @example
 * <search-service id="mainSearch">
 *   <input type="text" slot="search-input">
 * </search-service>
 */
class SearchService extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Initialize state
    this.state = {
      searchText: '',
      currentFilters: null,
      category: null,
      favoritesOnly: false,
      isLoading: false,
    };

    // Bind methods
    this.handleSearch = this.debounce(this.handleSearch.bind(this), 300);
    this.handleFilterUpdate = this.handleFilterUpdate.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .search-container {
          position: relative;
        }
      </style>
      
      <div class="search-container">
        <slot name="search-input"></slot>
      </div>
    `;
  }

  setupEventListeners() {
    // Listen for input from slotted search input
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', (e) => {
      const elements = slot.assignedElements();
      const searchInput = elements.find((el) => el.tagName === 'INPUT');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.state.searchText = e.target.value;
          this.handleSearch();
        });
      }
    });

    // Listen for filter modal updates
    document.addEventListener('filter-applied', (e) => {
      this.handleFilterUpdate(e.detail.filters);
    });
  }

  /**
   * Updates search parameters and triggers a new search
   * @param {Object} params - Search parameters
   * @param {string} params.category - Category filter
   * @param {boolean} params.favoritesOnly - Whether to search only favorites
   * @param {Object} params.filters - Additional filters from filter modal
   */
  async updateSearchParams(params = {}) {
    Object.assign(this.state, params);
    await this.handleSearch();
  }

  /**
   * Main search handler
   * Debounced to prevent too frequent searches
   */
  async handleSearch() {
    if (this.state.isLoading) return;

    this.state.isLoading = true;
    try {
      let recipes = await this.fetchRecipes();
      recipes = this.filterRecipes(recipes);

      this.dispatchEvent(
        new CustomEvent('search-results-updated', {
          bubbles: true,
          composed: true,
          detail: {
            results: recipes,
            searchParams: {
              text: this.state.searchText,
              category: this.state.category,
              filters: this.state.currentFilters,
            },
          },
        }),
      );
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Fetches recipes based on current state
   */
  async fetchRecipes() {
    const db = getFirestoreInstance();
    let q = query(collection(db, 'recipes'), where('approved', '==', true));

    // Apply category filter if set
    if (this.state.category) {
      q = query(
        collection(db, 'recipes'),
        where('approved', '==', true),
        where('category', '==', this.state.category),
      );
    }

    // Handle favorites-only mode
    if (this.state.favoritesOnly) {
      const user = authService.getCurrentUser();
      const userId = user?.uid;
      if (!userId) return [];

      const userDoc = await getDoc(doc(db, 'users', userId));
      const favoriteIds = userDoc.data()?.favorites || [];
      // Fetch all favorite recipes
      const recipeDocs = await Promise.all(favoriteIds.map((id) => getDoc(doc(db, 'recipes', id))));
      return recipeDocs
        .filter((docSnap) => docSnap.exists() && docSnap.data().approved)
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  }

  /**
   * Filters recipes based on search text and current filters
   */
  filterRecipes(recipes) {
    if (!recipes.length) return [];

    let filtered = recipes;

    // Apply text search if present
    if (this.state.searchText) {
      const searchTerms = this.state.searchText.toLowerCase().trim().split(/\s+/);

      filtered = filtered.filter((recipe) => {
        const searchableText = [recipe.name, recipe.category, ...(recipe.tags || [])]
          .join(' ')
          .toLowerCase();

        return searchTerms.every((term) => searchableText.includes(term));
      });
    }

    // Apply filters from filter modal if present
    if (this.state.currentFilters) {
      const { cookingTime, difficulty, mainIngredient, tags } = this.state.currentFilters;

      if (cookingTime) {
        filtered = this.filterByCookingTime(filtered, cookingTime);
      }

      if (difficulty) {
        filtered = filtered.filter((recipe) => recipe.difficulty === difficulty);
      }

      if (mainIngredient) {
        filtered = filtered.filter((recipe) => recipe.mainIngredient === mainIngredient);
      }

      if (tags?.length) {
        filtered = filtered.filter((recipe) => tags.every((tag) => recipe.tags?.includes(tag)));
      }
    }

    return filtered;
  }

  /**
   * Filters recipes by cooking time range
   */
  filterByCookingTime(recipes, timeRange) {
    const [min, max] = timeRange.split('-').map(Number);

    return recipes.filter((recipe) => {
      const totalTime = (recipe.prepTime || 0) + (recipe.waitTime || 0);
      if (max) {
        return totalTime >= min && totalTime <= max;
      }
      return totalTime >= min;
    });
  }

  /**
   * Handles updates from the filter modal
   */
  handleFilterUpdate(filters) {
    this.state.currentFilters = filters;
    this.handleSearch();
  }

  /**
   * Creates a debounced function that delays invoking func until after wait milliseconds
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

customElements.define('search-service', SearchService);
