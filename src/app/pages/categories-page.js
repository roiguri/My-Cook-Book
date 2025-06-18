import authService from '../../js/services/auth-service.js';
import { FirestoreService } from '../../js/services/firestore-service.js';

export default {
  async render() {
    try {
      // Resolve relative to this module so it works no matter where the SPA is mounted
      const response = await fetch(new URL('./categories-page.html', import.meta.url));
      if (!response.ok) {
        throw new Error(`Failed to load categories template: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading categories page template:', error);
      throw error;
    }
  },

  async mount(container, params) {
    console.log('Categories page: mount() called with params:', params);

    try {
      // Import required components
      await this.importComponents();

      // Initialize page state
      this.initializeState(params);

      // Setup authentication observer
      this.setupAuthObserver();

      // Load initial data
      await this.loadInitialRecipes();

      // Setup event listeners
      this.setupEventListeners();

      // Calculate optimal cards per page based on current layout
      await this.updateRecipesPerPage();

      // Update UI based on current state (with small delay to ensure DOM is ready)
      await new Promise(resolve => setTimeout(resolve, 10));
      this.updateUI();

      // Display recipes
      await this.displayCurrentPageRecipes();

      // If favorites filter was set in URL, log for debugging
      if (params?.favorites === 'true') {
        console.log('Favorites filter activated from URL parameter');
      }
    } catch (error) {
      console.error('Error mounting categories page:', error);
      this.handleError(error, 'mount');
    }
  },

  async unmount() {
    console.log('Categories page: unmount() called');

    try {
      // Remove auth observer
      if (this.authUnsubscribe) {
        this.authUnsubscribe();
      }

      // Remove event listeners
      this.removeEventListeners();

      // Clear timers
      this.clearTimers();
    } catch (error) {
      console.error('Error unmounting categories page:', error);
    }
  },

  getTitle(params) {
    const category = params?.category;
    if (category && category !== 'all') {
      return `${this.getCategoryDisplayName(category)} - Our Kitchen Chronicles`;
    }
    return 'מתכונים - Our Kitchen Chronicles';
  },

  getMeta(params) {
    const category = params?.category;
    const searchQuery = params?.q;

    let description = 'Browse our collection of delicious recipes';
    if (category && category !== 'all') {
      description = `Discover ${this.getCategoryDisplayName(category)} recipes`;
    }
    if (searchQuery) {
      description += ` matching "${searchQuery}"`;
    }

    return {
      description,
      keywords: 'recipes, cooking, categories, search, food, kitchen',
    };
  },

  // Handle route parameter changes (for browser back/forward or direct URL access)
  async handleRouteChange(params) {
    const newCategory = params?.category || 'all';
    const newSearchQuery = params?.q || '';
    const favoritesOnly = params?.favorites === 'true';

    let needsReload = false;

    // Check if category changed
    if (newCategory !== this.currentCategory) {
      this.currentCategory = newCategory;
      needsReload = true;
    }

    // Check if search query changed
    if (newSearchQuery !== this.currentSearchQuery) {
      this.currentSearchQuery = newSearchQuery;
      needsReload = true;
    }

    // Check if favorites filter changed
    // IMPORTANT: Only update favorites if it's explicitly set to true in URL params
    // Don't clear favorites just because it's missing from URL
    if (favoritesOnly && favoritesOnly !== this.activeFilters.favoritesOnly) {
      this.activeFilters.favoritesOnly = favoritesOnly;
      this.hasActiveFilters = this.checkHasActiveFilters();
      needsReload = true;
    }

    if (needsReload) {
      // Update search bar value
      const filterSearchBar = document.querySelector('filter-search-bar');
      if (filterSearchBar) {
        filterSearchBar.setValue(this.currentSearchQuery);
      }

      // Reload data and update UI
      await this.loadInitialRecipes();
      this.updateUI();
      await this.displayCurrentPageRecipes();
    }
  },

  // Initialize page state
  initializeState(params) {
    this.currentCategory = params?.category || 'all';
    this.currentSearchQuery = params?.q || '';
    this.currentPage = 1;
    this.recipesPerPage = 4; // Default fallback, will be calculated dynamically
    this.displayedRecipes = [];
    this.allRecipes = [];
    this.currentUser = authService.getCurrentUser(); // Track current user for auth changes
    
    // Initialize favorites cache
    this.userFavoritesCache = {
      userId: null,
      favorites: [],
      isLoaded: false
    };

    // Initialize filter state to maintain filters across category changes
    this.activeFilters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: params?.favorites === 'true' || false,
    };
    this.hasActiveFilters = this.checkHasActiveFilters();
  },

  // Helper method to check if any filters are active
  checkHasActiveFilters() {
    return !!(
      this.activeFilters.cookingTime ||
      this.activeFilters.difficulty ||
      this.activeFilters.mainIngredient ||
      (this.activeFilters.tags && this.activeFilters.tags.length > 0) ||
      this.activeFilters.favoritesOnly
    );
  },

  // Calculate optimal cards per page based on actual rendered grid
  async calculateOptimalCardsPerPage() {
    const recipeGrid = document.getElementById('recipe-grid');
    if (!recipeGrid) return 4; // Fallback

    // Always use temporary cards for consistent measurement
    // This ensures we measure the grid layout independent of current content
    const tempCards = [];

    // Clear existing content temporarily for consistent measurement
    const existingChildren = Array.from(recipeGrid.children);
    existingChildren.forEach((child) => (child.style.display = 'none'));

    try {
      // Add exactly 6 temporary cards to measure the grid consistently
      for (let i = 0; i < 6; i++) {
        const tempCard = document.createElement('div');
        tempCard.className = 'recipe-card-container';
        tempCard.style.minHeight = '200px'; // Realistic card height
        tempCard.style.backgroundColor = 'transparent';
        tempCard.style.border = '1px solid transparent';
        recipeGrid.appendChild(tempCard);
        tempCards.push(tempCard);
      }

      // Force layout recalculation
      recipeGrid.offsetHeight;

      // Small delay to ensure layout is complete
      const result = await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            let actualColumns = this.measureGridColumns(tempCards);

            // Calculate cards per page for 2 complete rows
            const rows = 2;
            const cardsPerPage = actualColumns * rows;

            // Ensure minimum of 2 cards and maximum of 8 cards per page
            const finalResult = Math.max(2, Math.min(8, cardsPerPage));

            console.log(
              `Grid measurement: ${actualColumns} columns × ${rows} rows = ${finalResult} cards per page (container width: ${recipeGrid.offsetWidth}px)`,
            );
            resolve(finalResult);
          });
        });
      });

      return result;
    } catch (error) {
      console.warn('Error measuring grid layout:', error);
      return 4; // Fallback
    } finally {
      // Clean up temporary cards and restore existing content
      tempCards.forEach((card) => card.remove());
      existingChildren.forEach((child) => (child.style.display = ''));
    }
  },

  // Helper method to measure grid columns from temporary cards
  measureGridColumns(cards) {
    if (cards.length < 2) return 1;

    let actualColumns = 1;

    try {
      // Get positions of cards to determine grid structure
      const firstCard = cards[0];
      const firstRect = firstCard.getBoundingClientRect();
      const firstRowTop = firstRect.top;

      // Count all cards in the first row (within 10px tolerance)
      for (let i = 1; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        if (Math.abs(cardRect.top - firstRowTop) < 10) {
          actualColumns++;
        } else {
          break; // We've moved to the next row
        }
      }

      // Fallback: if we couldn't detect multiple columns, calculate based on container width
      if (actualColumns === 1 && cards.length >= 2) {
        const recipeGrid = document.getElementById('recipe-grid');
        const containerWidth = recipeGrid.offsetWidth;

        // Rough calculation as fallback (minmax(200px, 300px) with 1rem gaps)
        const minCardWidth = 200;
        const gap = 16;
        actualColumns = Math.max(1, Math.floor((containerWidth + gap) / (minCardWidth + gap)));
      }
    } catch (error) {
      console.warn('Error in measureGridColumns:', error);
      actualColumns = 1;
    }

    return actualColumns;
  },

  // Update recipes per page and recalculate pagination
  async updateRecipesPerPage() {
    const newRecipesPerPage = await this.calculateOptimalCardsPerPage();

    // Only update if changed to avoid unnecessary re-renders
    if (newRecipesPerPage !== this.recipesPerPage) {
      console.log(`Updating recipes per page: ${this.recipesPerPage} → ${newRecipesPerPage}`);

      // Calculate what page we should be on to maintain roughly the same position
      const currentStartIndex = (this.currentPage - 1) * this.recipesPerPage;
      this.recipesPerPage = newRecipesPerPage;
      this.currentPage = Math.max(1, Math.floor(currentStartIndex / this.recipesPerPage) + 1);

      return true; // Indicates change occurred
    }

    return false; // No change
  },

  // Import required components
  async importComponents() {
    try {
      await Promise.all([
        import('../../lib/recipes/recipe-card/recipe-card.js'),
        import('../../lib/search/filter-search-bar/filter-search-bar.js'),
        import('../../lib/search/search-service/search-service.js'),
        import('../../lib/modals/filter_modal/filter_modal.js'),
      ]);
    } catch (error) {
      console.error('Error importing categories page components:', error);
    }
  },

  // Setup authentication observer
  setupAuthObserver() {
    this.authUnsubscribe = authService.addAuthObserver(async (authState) => {
      const wasAuthenticated = !!this.currentUser;
      const isNowAuthenticated = !!authState.user;
      this.currentUser = authState.user;

      // Handle logout while in favorites view
      if (wasAuthenticated && !isNowAuthenticated && this.activeFilters.favoritesOnly) {
        // User logged out while viewing favorites - reset to all categories
        this.activeFilters.favoritesOnly = false;
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.currentCategory = 'all';
        this.currentSearchQuery = '';
        
        // Clear search bar
        const filterSearchBar = document.querySelector('filter-search-bar');
        if (filterSearchBar) {
          filterSearchBar.clear();
        }
        
        console.log('User logged out while in favorites view - resetting to all categories');
      }

      // Clear favorites cache on auth state changes
      if (wasAuthenticated && !isNowAuthenticated) {
        // User logged out - clear favorites cache
        this.clearFavoritesCache();
      } else if (!wasAuthenticated && isNowAuthenticated) {
        // User logged in - cache will be populated on first use
        this.clearFavoritesCache(); // Clear any stale cache
      } else if (wasAuthenticated && isNowAuthenticated && this.currentUser?.uid !== authState.user?.uid) {
        // Different user logged in - clear cache for previous user
        this.clearFavoritesCache();
      }

      // Repopulate recipes when the authentication state changes
      await this.loadInitialRecipes();
      this.updateUI();
      await this.displayCurrentPageRecipes();

      // Update filter modal counter if modal exists
      this.updateFilterModalCounter();

      // Update URL to reflect any changes (like clearing favorites filter)
      this.updateURLSilently();

      // Refresh filter modal if it's open (to show/hide favorites filter)
      this.refreshFilterModalIfOpen();
    });
  },

  // Refresh filter modal when auth state changes
  refreshFilterModalIfOpen() {
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal) {
      // Check if modal is open by accessing the custom-modal's isOpen property
      const customModal = filterModal.shadowRoot?.querySelector('custom-modal');
      
      if (customModal?.isOpen) {
        // Re-render the modal to show/hide favorites filter based on auth state
        filterModal.render();
        // Re-setup event listeners after re-render
        filterModal.setupEventListeners();
      }
    }
  },

  // Load initial recipes based on current filters
  async loadInitialRecipes() {
    try {
      let queryParams = { where: [['approved', '==', true]] };

      // Add category filter if not 'all'
      if (this.currentCategory !== 'all') {
        queryParams.where.push(['category', '==', this.currentCategory]);
      }

      // Fetch recipes from Firestore
      this.allRecipes = await FirestoreService.queryDocuments('recipes', queryParams);

      // Start with all fetched recipes
      let filteredRecipes = [...this.allRecipes];

      // Apply search filter if exists
      if (this.currentSearchQuery) {
        filteredRecipes = this.filterRecipesBySearch(filteredRecipes, this.currentSearchQuery);
      }

      // Apply active filters if any exist
      if (this.hasActiveFilters) {
        filteredRecipes = await this.applyActiveFilters(filteredRecipes);
        console.log(
          'Applied filters to recipes:',
          this.activeFilters,
          'Filtered count:',
          filteredRecipes.length,
        );
      }

      this.displayedRecipes = filteredRecipes;

      // Reset to first page
      this.currentPage = 1;
    } catch (error) {
      console.error('Error loading recipes:', error);
      this.handleError(error, 'loading recipes');
    }
  },

  // Filter recipes by search terms
  filterRecipesBySearch(recipes, searchText) {
    const searchTerms = searchText.toLowerCase().trim().split(/\s+/);

    return recipes.filter((recipe) => {
      const searchableText = [recipe.name, recipe.category, ...(recipe.tags || [])]
        .join(' ')
        .toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });
  },

  // Apply active filters to recipes
  async applyActiveFilters(recipes) {
    if (!this.hasActiveFilters) {
      return recipes;
    }

    const { cookingTime, difficulty, mainIngredient, tags, favoritesOnly } = this.activeFilters;

    let filteredRecipes = recipes.filter((recipe) => {
      // Cooking time filter
      if (cookingTime) {
        const totalTime = (recipe.prepTime || 0) + (recipe.waitTime || 0);
        if (cookingTime === '0-30' && totalTime > 30) return false;
        if (cookingTime === '31-60' && (totalTime < 31 || totalTime > 60)) return false;
        if (cookingTime === '61' && totalTime <= 60) return false;
      }

      // Difficulty filter
      if (difficulty && recipe.difficulty !== difficulty) return false;

      // Main ingredient filter
      if (mainIngredient && recipe.mainIngredient !== mainIngredient) return false;

      // Tags filter - recipe must have all selected tags
      if (tags && tags.length > 0) {
        const recipeTags = recipe.tags || [];
        if (!tags.every((tag) => recipeTags.includes(tag))) return false;
      }

      return true;
    });

    // Favorites filter (only for authenticated users)
    if (favoritesOnly) {
      const user = authService.getCurrentUser();
      if (user) {
        const favoriteRecipeIds = await this.getUserFavorites();
        filteredRecipes = filteredRecipes.filter((recipe) =>
          favoriteRecipeIds.includes(recipe.id),
        );
      }
    }

    return filteredRecipes;
  },

  // Setup event listeners
  setupEventListeners() {
    // Note: Category tabs navigation is now handled by setupNavigationInterception()

    // Window resize listener for dynamic cards per page calculation
    this.resizeHandler = this.debounce(async () => {
      const changed = await this.updateRecipesPerPage();
      if (changed) {
        // Re-render the current page with new cards per page
        await this.displayCurrentPageRecipes();
      }
    }, 250);
    window.addEventListener('resize', this.resizeHandler);

    // Category dropdown
    const categoryDropdown = document.getElementById('category-select');
    if (categoryDropdown) {
      categoryDropdown.addEventListener('change', this.handleCategoryChange.bind(this));
    }

    // Pagination
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    if (prevButton) {
      prevButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    }
    if (nextButton) {
      nextButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    }

    // Filter modal
    const filterButton = document.getElementById('open-filter-modal');
    if (filterButton) {
      filterButton.addEventListener('click', this.handleFilterModalOpen.bind(this));
    }


    // Search functionality
    const filterSearchBar = document.querySelector('filter-search-bar');
    if (filterSearchBar) {
      filterSearchBar.setValue(this.currentSearchQuery);
      filterSearchBar.addEventListener('search-input', this.handleSearchInput.bind(this));
    }

    // Filter modal events
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal) {
      filterModal.addEventListener('filter-applied', this.handleFilterApplied.bind(this));
      filterModal.addEventListener('filter-reset', this.handleFilterReset.bind(this));
    }

    // Listen for favorite changes to update cache
    document.addEventListener('recipe-favorite-changed', this.handleFavoriteChanged.bind(this));

    // Setup navigation interception for categories page
    this.setupNavigationInterception();
  },

  // Remove event listeners
  removeEventListeners() {
    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Remove favorite change listener
    document.removeEventListener('recipe-favorite-changed', this.handleFavoriteChanged.bind(this));

    // Remove navigation interceptors
    this.removeNavigationInterception();
  },

  // Handle recipe favorite changes to update cache
  handleFavoriteChanged(event) {
    const { recipeId, isFavorite } = event.detail;
    this.updateFavoritesCache(recipeId, isFavorite);
    
    // If we're currently viewing favorites, refresh the display
    if (this.activeFilters.favoritesOnly) {
      this.loadInitialRecipes().then(() => {
        this.displayCurrentPageRecipes();
        this.updateFilterModalCounter();
      });
    }
  },

  // Update UI elements based on current state
  updateUI() {
    this.updateActiveTab();
    this.updatePageTitle();
    this.updateCategoryDropdown();
    this.updateFilterBadgeFromState();
  },

  // Update active tab styling
  updateActiveTab() {
    const categoryTabs = document.querySelectorAll('.category-tabs a');
    
    // Since no tabs start as active, just apply active class to the correct one
    categoryTabs.forEach((tab) => {
      const href = tab.getAttribute('href');
      let category = 'all';
      if (href) {
        const url = new URL(href, window.location.origin);
        category = url.searchParams.get('category') || 'all';
      }

      if (category === this.currentCategory) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  },

  // Update page title
  updatePageTitle() {
    const pageTitle = document.querySelector('#category-header');
    if (pageTitle) {
      if (this.activeFilters.favoritesOnly) {
        pageTitle.textContent = 'מועדפים';
      } else if (this.currentSearchQuery) {
        pageTitle.textContent = `תוצאות חיפוש: "${this.currentSearchQuery}"`;
      } else if (this.currentCategory !== 'all') {
        pageTitle.textContent = this.getCategoryDisplayName(this.currentCategory);
      } else {
        pageTitle.textContent = 'מתכונים';
      }
    }
  },

  // Add method to activate favorites filter
  async activateFavoritesFilter() {
    const user = authService.getCurrentUser();
    if (!user) {
      // If user is not authenticated, show auth modal or redirect
      return;
    }

    this.activeFilters.favoritesOnly = true;
    this.hasActiveFilters = this.checkHasActiveFilters();
    this.currentCategory = 'all'; // Reset category when showing favorites
    this.currentSearchQuery = ''; // Reset search when showing favorites

    // Clear search bar
    const filterSearchBar = document.querySelector('filter-search-bar');
    if (filterSearchBar) {
      filterSearchBar.clear();
    }

    await this.loadInitialRecipes();
    this.updateUI();
    await this.displayCurrentPageRecipes();
    
    // Update navigation active state
    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }
    
        // Update filter modal counter if modal exists
    this.updateFilterModalCounter();

    this.updateURLSilently();
  },

  // Reset to all categories with no filters (called from navigation)
  async resetToAllCategories() {
    // Clear all filters
    this.activeFilters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: false,
    };
    this.hasActiveFilters = this.checkHasActiveFilters();
    
    // Reset to all categories
    this.currentCategory = 'all';
    this.currentSearchQuery = '';
    
    // Clear search bar
    const filterSearchBar = document.querySelector('filter-search-bar');
    if (filterSearchBar) {
      filterSearchBar.clear();
    }

    await this.loadInitialRecipes();
    this.updateUI();
    await this.displayCurrentPageRecipes();

    // Update navigation active state
    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }

    // Update filter modal counter
    this.updateFilterModalCounter();

    // Update URL silently to avoid navigation refresh
    this.updateURLSilently();
  },

  // Update category dropdown selection
  updateCategoryDropdown() {
    const dropdown = document.getElementById('category-select');
    if (dropdown) {
      dropdown.value = this.currentCategory;
    }
  },

  // Update filter badge based on current active filters state
  updateFilterBadgeFromState() {
    this.updateFilterBadge(this.activeFilters);
  },

  // Setup navigation interception for smart routing
  setupNavigationInterception() {
    // Store bound handlers for proper cleanup
    this.favoritesNavHandler = (event) => {
      const link = event.target.closest('a[href="/categories?favorites=true"]');
      if (!link) return;

      // Allow browser default behavior for modifier keys and non-left clicks
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return; // Let browser handle naturally (opens in new tab/window)
      }

      // Check if we're already on categories page
      const currentRoute = window.spa?.router?.getCurrentRoute();
      
      if (currentRoute === '/categories') {
        event.preventDefault();
        this.activateFavoritesFilter();
      }
    };

    this.categoriesNavHandler = (event) => {
      const link = event.target.closest('a[href="/categories"]');
      if (!link) return;

      // Allow browser default behavior for modifier keys and non-left clicks
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return; // Let browser handle naturally (opens in new tab/window)
      }

      // Check if we're already on categories page
      const currentRoute = window.spa?.router?.getCurrentRoute();
      
      if (currentRoute === '/categories') {
        event.preventDefault();
        this.resetToAllCategories();
      }
    };

    // Category tab navigation with favorites preservation
    this.categoryTabHandler = async (event) => {
      const link = event.target.closest('.category-tabs a');
      if (!link) return;

      // Allow browser default behavior for modifier keys and non-left clicks
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return; // Let browser handle naturally (opens in new tab/window)
      }

      // Check if we're already on categories page
      const currentRoute = window.spa?.router?.getCurrentRoute();
      
      if (currentRoute === '/categories') {
        event.preventDefault();
        
        const href = link.getAttribute('href');
        let category = 'all';
        if (href) {
          const url = new URL(href, window.location.origin);
          category = url.searchParams.get('category') || 'all';
        }
        
        // Change category while preserving current filters (including favorites)
        await this.changeCategory(category);
        
        // After changing category, update URL to include all current state
        this.updateURLSilently();
      }
    };

    // Add event listeners with capture phase to run before global navigation handler
    document.addEventListener('click', this.favoritesNavHandler, true);
    document.addEventListener('click', this.categoriesNavHandler, true);
    document.addEventListener('click', this.categoryTabHandler, true);
  },

  // Remove navigation interception
  removeNavigationInterception() {
    if (this.favoritesNavHandler) {
      document.removeEventListener('click', this.favoritesNavHandler, true);
      this.favoritesNavHandler = null;
    }
    
    if (this.categoriesNavHandler) {
      document.removeEventListener('click', this.categoriesNavHandler, true);
      this.categoriesNavHandler = null;
    }
    
    if (this.categoryTabHandler) {
      document.removeEventListener('click', this.categoryTabHandler, true);
      this.categoryTabHandler = null;
    }
  },


  // Display recipes for current page
  async displayCurrentPageRecipes() {
    const recipeGrid = document.getElementById('recipe-grid');
    if (!recipeGrid) return;

    // Add transitioning class for smooth fade effect
    recipeGrid.classList.add('transitioning');

    // Wait for fade out transition to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Clear existing content
    recipeGrid.innerHTML = '';

    // Calculate pagination
    const totalRecipes = this.displayedRecipes.length;
    const totalPages = Math.ceil(totalRecipes / this.recipesPerPage);
    const startIndex = (this.currentPage - 1) * this.recipesPerPage;
    const endIndex = startIndex + this.recipesPerPage;
    const currentPageRecipes = this.displayedRecipes.slice(startIndex, endIndex);

    // Display recipes
    if (currentPageRecipes.length === 0) {
      // Set grid to display flex for centering (like original)
      recipeGrid.style.display = 'flex';
      recipeGrid.style.justifyContent = 'center';
      recipeGrid.style.alignItems = 'center';
      recipeGrid.style.minHeight = '200px';

      const noResultsMessage = document.createElement('div');
      noResultsMessage.className = 'no-results';
      noResultsMessage.style.textAlign = 'center';
      noResultsMessage.innerHTML = `
        <p>לא נמצאו מתכונים ${this.currentSearchQuery ? 'תואמים' : 'בקטגוריה זו'}</p>
        ${this.currentSearchQuery ? '<p>נסה לשנות את מילות החיפוש</p>' : ''}
      `;
      recipeGrid.appendChild(noResultsMessage);
    } else {
      // Reset grid to original layout for recipes (like original)
      recipeGrid.style.display = 'grid';
      recipeGrid.style.justifyContent = '';
      recipeGrid.style.alignItems = '';
      recipeGrid.style.minHeight = '';

      const authenticated = authService.getCurrentUser();
      currentPageRecipes.forEach((recipe) => {
        // Create container div like original
        const cardContainer = document.createElement('div');
        cardContainer.className = 'recipe-card-container';

        const recipeCard = document.createElement('recipe-card');
        recipeCard.setAttribute('recipe-id', recipe.id);
        recipeCard.setAttribute('layout', 'vertical');
        if (authenticated) {
          recipeCard.setAttribute('show-favorites', true);
        }
        recipeCard.style.width = '100%';
        recipeCard.style.height = '100%';

        // Add click handler for SPA navigation
        recipeCard.addEventListener('recipe-card-open', (event) => {
          const recipeId = event.detail.recipeId;
          // Use SPA navigation
          if (window.spa?.router) {
            window.spa.router.navigate(`/recipe/${recipeId}`);
            // Update navigation active state after navigation
            setTimeout(() => {
              if (typeof window.updateActiveNavigation === 'function') {
                window.updateActiveNavigation();
              }
            }, 100);
          } else {
            // Fallback to traditional navigation
            window.location.href = `${import.meta.env.BASE_URL}pages/recipe-page.html?id=${recipeId}`;
          }
        });

        cardContainer.appendChild(recipeCard);
        recipeGrid.appendChild(cardContainer);
      });
    }

    // Remove transitioning class to fade back in
    recipeGrid.classList.remove('transitioning');

    // Update pagination info
    this.updatePaginationInfo(this.currentPage, totalPages, totalRecipes);
  },

  // Update pagination buttons and info
  updatePaginationInfo(currentPage, totalPages, totalRecipes) {
    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (pageInfo) {
      pageInfo.textContent = `עמוד ${currentPage} מתוך ${totalPages} (${totalRecipes} מתכונים)`;
    }

    if (prevButton) {
      prevButton.disabled = currentPage <= 1;
    }

    if (nextButton) {
      nextButton.disabled = currentPage >= totalPages;
    }
  },

  // Event Handlers
  handleCategoryClick(event) {
    event.preventDefault();
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    // Parse category from clean URL
    let category = 'all';
    if (href) {
      const url = new URL(href, window.location.origin);
      category = url.searchParams.get('category') || 'all';
    }
    this.changeCategory(category);
  },

  async handleCategoryChange(event) {
    const category = event.target.value;
    await this.changeCategory(category);
    this.updateURLSilently();
  },

  async handleSearchInput(event) {
    const searchQuery = event.detail.searchText || '';

    // Only update if value changed (same as legacy implementation)
    if (this.currentSearchQuery !== searchQuery) {
      this.currentSearchQuery = searchQuery;

      // Immediate search without debouncing for live results
      await this.loadInitialRecipes();
      this.currentPage = 1; // Reset to first page
      this.updateUI();
      await this.displayCurrentPageRecipes();

      // Update filter modal counter if modal exists
      this.updateFilterModalCounter();

      // Update URL without navigation (don't trigger router)
      this.updateURLSilently();
    }
  },

  async handleFilterModalOpen() {
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal) {
      // Pass the base recipes first (after category and search filter, but before advanced filters)
      // This allows the filter modal to work with the correct recipe set
      let baseRecipes = [...this.allRecipes];

      // Apply search filter if exists
      if (this.currentSearchQuery) {
        baseRecipes = this.filterRecipesBySearch(baseRecipes, this.currentSearchQuery);
      }

      // If favorites filter is currently active, also apply it to the base recipes
      // so the filter modal shows the correct count
      if (this.activeFilters.favoritesOnly) {
        const user = authService.getCurrentUser();
        if (user) {
          const favoriteRecipeIds = await this.getUserFavorites();
          baseRecipes = baseRecipes.filter(recipe => favoriteRecipeIds.includes(recipe.id));
        }
      }

      // Set the base recipes for filtering FIRST to prevent category from reloading data
      filterModal.setAttribute('recipes', JSON.stringify(baseRecipes));

      // Then set the category if not 'all'
      if (this.currentCategory !== 'all') {
        filterModal.setAttribute('category', this.currentCategory);
      } else {
        filterModal.removeAttribute('category');
      }

      // If we have active filters, set them on the modal so they appear selected
      if (this.hasActiveFilters) {
        filterModal.setAttribute('current-filters', JSON.stringify(this.activeFilters));
      } else {
        filterModal.removeAttribute('current-filters');
      }

      // Open the modal
      filterModal.open();
    }
  },

  async handleFilterApplied(event) {
    const { recipes, filters } = event.detail;
    console.log('Filter applied:', filters);

    // Store the active filters state
    this.activeFilters = {
      cookingTime: filters.cookingTime || '',
      difficulty: filters.difficulty || '',
      mainIngredient: filters.mainIngredient || '',
      tags: filters.tags || [],
      favoritesOnly: filters.favoritesOnly || false,
    };

    // Check if any filters are actually active
    this.hasActiveFilters = this.checkHasActiveFilters();

    // Update displayed recipes with filtered results
    this.displayedRecipes = recipes;
    this.currentPage = 1; // Reset to first page

    // Update filter badge if filters are active
    this.updateFilterBadge(filters);

    // Update title to reflect favorites filter state
    this.updatePageTitle();

    // Update URL to reflect favorites filter
    this.updateURLSilently();

    // Update navigation active state
    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }

    // Re-render the recipe grid
    await this.displayCurrentPageRecipes();
  },

  async handleFilterReset() {
    console.log('Filter reset');

    // Clear the active filters state
    this.activeFilters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: false,
    };
    this.hasActiveFilters = this.checkHasActiveFilters();

    // Reload recipes without filters
    await this.loadInitialRecipes();
    this.currentPage = 1; // Reset to first page

    // Clear filter badge
    this.updateFilterBadge({});

    // Update title to reflect that favorites filter is removed
    this.updatePageTitle();

    // Update URL to reflect cleared favorites filter
    this.updateURLSilently();

    // Update navigation active state
    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }

    // Re-render the recipe grid
    await this.displayCurrentPageRecipes();
  },

  updateFilterBadge(filters) {
    const filterBadge = document.getElementById('filter-badge');
    if (!filterBadge) return;

    // Count active filters
    let activeFilters = 0;
    if (filters.cookingTime) activeFilters++;
    if (filters.difficulty) activeFilters++;
    if (filters.mainIngredient) activeFilters++;
    if (filters.tags && filters.tags.length > 0) activeFilters++;
    if (filters.favoritesOnly) activeFilters++;

    if (activeFilters > 0) {
      filterBadge.textContent = activeFilters;
      filterBadge.style.display = 'flex';
    } else {
      filterBadge.style.display = 'none';
    }
  },

  // Navigation methods
  async changeCategory(category) {
    if (category === this.currentCategory) return;

    this.currentCategory = category;
    this.currentPage = 1; // Reset to first page

    await this.loadInitialRecipes();
    this.updateUI();
    await this.displayCurrentPageRecipes();

    // Update filter modal counter if modal exists
    this.updateFilterModalCounter();

    // Note: URL update is now handled by the caller to preserve state
  },

  async changeSearch(searchQuery) {
    if (searchQuery === this.currentSearchQuery) return;

    this.currentSearchQuery = searchQuery;
    await this.loadInitialRecipes();
    this.currentPage = 1; // Reset to first page
    this.updateUI();
    await this.displayCurrentPageRecipes();

    // Update URL silently to avoid navigation refresh
    this.updateURLSilently();
  },

  async goToPage(page) {
    const totalPages = Math.ceil(this.displayedRecipes.length / this.recipesPerPage);
    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    await this.displayCurrentPageRecipes();
  },

  // Update URL with current filters (triggers navigation)
  updateURL() {
    const params = {};

    if (this.currentCategory && this.currentCategory !== 'all') {
      params.category = this.currentCategory;
    }

    if (this.currentSearchQuery) {
      params.q = this.currentSearchQuery;
    }

    if (this.activeFilters.favoritesOnly) {
      params.favorites = 'true';
    }

    // Use router to navigate with parameters
    if (window.spa?.router) {
      window.spa.router.navigateWithParams('/categories', params);
    }
  },

  // Update URL without triggering navigation (for live search)
  updateURLSilently() {
    const params = {};

    if (this.currentCategory && this.currentCategory !== 'all') {
      params.category = this.currentCategory;
    }

    if (this.currentSearchQuery) {
      params.q = this.currentSearchQuery;
    }

    if (this.activeFilters.favoritesOnly) {
      params.favorites = 'true';
    }

    // Use router to update parameters silently
    if (window.spa?.router) {
      window.spa.router.updateParams(params);
    }
  },

  // Update filter modal counter if it exists
  updateFilterModalCounter() {
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal && typeof filterModal.updateRecipeCount === 'function') {
      filterModal.updateRecipeCount(this.displayedRecipes.length);
    }
  },

  // Cache management for user favorites
  async getUserFavorites() {
    const user = authService.getCurrentUser();
    if (!user) {
      return [];
    }

    // Check if we have cached favorites for this user
    if (this.userFavoritesCache.userId === user.uid && this.userFavoritesCache.isLoaded) {
      return this.userFavoritesCache.favorites;
    }

    // Fetch favorites from Firestore
    try {
      const userDoc = await FirestoreService.getDocument('users', user.uid);
      const favoriteRecipeIds = userDoc?.favorites || [];
      
      // Update cache
      this.userFavoritesCache = {
        userId: user.uid,
        favorites: favoriteRecipeIds,
        isLoaded: true
      };
      
      return favoriteRecipeIds;
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  },

  // Clear favorites cache (call when user logs out or favorites change)
  clearFavoritesCache() {
    this.userFavoritesCache = {
      userId: null,
      favorites: [],
      isLoaded: false
    };
  },

  // Update favorites cache when a recipe is added/removed from favorites
  updateFavoritesCache(recipeId, isAdding) {
    if (this.userFavoritesCache.isLoaded) {
      if (isAdding) {
        if (!this.userFavoritesCache.favorites.includes(recipeId)) {
          this.userFavoritesCache.favorites.push(recipeId);
        }
      } else {
        this.userFavoritesCache.favorites = this.userFavoritesCache.favorites.filter(id => id !== recipeId);
      }
    }
  },

  // Utility methods
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
  },

  getCategoryDisplayName(category) {
    const categoryNames = {
      appetizers: 'מנות ראשונות',
      'main-courses': 'מנות עיקריות',
      'side-dishes': 'תוספות',
      'soups-stews': 'מרקים ותבשילים',
      salads: 'סלטים',
      desserts: 'קינוחים',
      'breakfast-brunch': 'ארוחות בוקר',
      snacks: 'חטיפים',
      beverages: 'משקאות',
    };

    return categoryNames[category] || category;
  },

  clearTimers() {
    // Clear any timers if we had any
  },

  handleError(error, context = 'unknown') {
    console.error(`Categories page error in ${context}:`, error);

    const recipeGrid = document.getElementById('recipe-grid');
    if (recipeGrid) {
      recipeGrid.innerHTML = `
        <div class="error-message">
          <p>מצטערים, אירעה שגיאה בטעינת המתכונים. אנא נסו שוב מאוחר יותר.</p>
        </div>
      `;
    }
  },
};
