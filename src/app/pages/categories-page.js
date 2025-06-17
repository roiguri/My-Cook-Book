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
      
      // Update UI based on current state
      this.updateUI();
      
      // Display recipes
      await this.displayCurrentPageRecipes();
      
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
      keywords: 'recipes, cooking, categories, search, food, kitchen'
    };
  },

  // Handle route parameter changes (for browser back/forward or direct URL access)
  async handleRouteChange(params) {
    const newCategory = params?.category || 'all';
    const newSearchQuery = params?.q || '';
    
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
    
    // Initialize filter state to maintain filters across category changes
    this.activeFilters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: false
    };
    this.hasActiveFilters = false;
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
    existingChildren.forEach(child => child.style.display = 'none');
    
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
      const result = await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            let actualColumns = this.measureGridColumns(tempCards);
            
            // Calculate cards per page for 2 complete rows
            const rows = 2;
            const cardsPerPage = actualColumns * rows;
            
            // Ensure minimum of 2 cards and maximum of 12 cards per page
            const finalResult = Math.max(2, Math.min(12, cardsPerPage));
            
            console.log(`Grid measurement: ${actualColumns} columns × ${rows} rows = ${finalResult} cards per page (container width: ${recipeGrid.offsetWidth}px)`);
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
      tempCards.forEach(card => card.remove());
      existingChildren.forEach(child => child.style.display = '');
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
        import('../../lib/modals/filter_modal/filter_modal.js')
      ]);
    } catch (error) {
      console.error('Error importing categories page components:', error);
    }
  },

  // Setup authentication observer
  setupAuthObserver() {
    this.authUnsubscribe = authService.addAuthObserver(async (state) => {
      // Repopulate recipes when the authentication state changes
      await this.loadInitialRecipes();
      await this.displayCurrentPageRecipes();
    });
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
        filteredRecipes = this.applyActiveFilters(filteredRecipes);
        console.log('Applied filters to recipes:', this.activeFilters, 'Filtered count:', filteredRecipes.length);
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
  applyActiveFilters(recipes) {
    if (!this.hasActiveFilters) {
      return recipes;
    }

    const { cookingTime, difficulty, mainIngredient, tags } = this.activeFilters;

    return recipes.filter((recipe) => {
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
  },

  // Setup event listeners
  setupEventListeners() {
    // Category tabs navigation
    const categoryTabs = document.querySelector('.category-tabs ul');
    if (categoryTabs) {
      categoryTabs.addEventListener('click', this.handleCategoryClick.bind(this));
    }
    
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
  },

  // Remove event listeners
  removeEventListeners() {
    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  },

  // Update UI elements based on current state
  updateUI() {
    this.updateActiveTab();
    this.updatePageTitle();
    this.updateCategoryDropdown();
  },

  // Update active tab styling
  updateActiveTab() {
    const categoryTabs = document.querySelectorAll('.category-tabs a');
    categoryTabs.forEach(tab => {
      const href = tab.getAttribute('href');
      const category = href ? href.substring(1) : '';
      
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
      if (this.currentSearchQuery) {
        pageTitle.textContent = `תוצאות חיפוש: "${this.currentSearchQuery}"`;
      } else if (this.currentCategory !== 'all') {
        pageTitle.textContent = this.getCategoryDisplayName(this.currentCategory);
      } else {
        pageTitle.textContent = 'מתכונים';
      }
    }
  },

  // Update category dropdown selection
  updateCategoryDropdown() {
    const dropdown = document.getElementById('category-select');
    if (dropdown) {
      dropdown.value = this.currentCategory;
    }
  },

  // Display recipes for current page
  async displayCurrentPageRecipes() {
    const recipeGrid = document.getElementById('recipe-grid');
    if (!recipeGrid) return;
    
    // Add transitioning class for smooth fade effect
    recipeGrid.classList.add('transitioning');
    
    // Wait for fade out transition to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
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
    const category = href ? href.substring(1) : 'all';
    this.changeCategory(category);
  },

  handleCategoryChange(event) {
    const category = event.target.value;
    this.changeCategory(category);
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
      
      // Update URL without navigation (don't trigger router)
      this.updateURLSilently();
    }
  },

  handleFilterModalOpen() {
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal) {
      // Set the category if not 'all'
      if (this.currentCategory !== 'all') {
        filterModal.setAttribute('category', this.currentCategory);
      } else {
        filterModal.removeAttribute('category');
      }
      
      // Pass the base recipes (after category and search filter, but before advanced filters)
      // This allows the filter modal to work with the correct recipe set
      let baseRecipes = [...this.allRecipes];
      
      // Apply search filter if exists
      if (this.currentSearchQuery) {
        baseRecipes = this.filterRecipesBySearch(baseRecipes, this.currentSearchQuery);
      }
      
      // Set the base recipes for filtering (not the already filtered ones)
      filterModal.setAttribute('recipes', JSON.stringify(baseRecipes));
      
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
      favoritesOnly: filters.favoritesOnly || false
    };
    
    // Check if any filters are actually active
    this.hasActiveFilters = !!(
      this.activeFilters.cookingTime ||
      this.activeFilters.difficulty ||
      this.activeFilters.mainIngredient ||
      (this.activeFilters.tags && this.activeFilters.tags.length > 0) ||
      this.activeFilters.favoritesOnly
    );
    
    // Update displayed recipes with filtered results
    this.displayedRecipes = recipes;
    this.currentPage = 1; // Reset to first page
    
    // Update filter badge if filters are active
    this.updateFilterBadge(filters);
    
    // Re-render the recipe grid
    await this.displayCurrentPageRecipes();
  },

  async handleFilterReset(event) {
    console.log('Filter reset');
    
    // Clear the active filters state
    this.activeFilters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: false
    };
    this.hasActiveFilters = false;
    
    // Reload recipes without filters
    await this.loadInitialRecipes();
    this.currentPage = 1; // Reset to first page
    
    // Clear filter badge
    this.updateFilterBadge({});
    
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
    
    // Clear search when switching categories (like legacy behavior)
    const filterSearchBar = document.querySelector('filter-search-bar');
    if (filterSearchBar && this.currentSearchQuery) {
      filterSearchBar.clear(); // This will trigger the search-input event
      this.currentSearchQuery = ''; // Reset search query
    }
    
    await this.loadInitialRecipes();
    this.updateUI();
    await this.displayCurrentPageRecipes();
    
    // Update URL silently to avoid navigation refresh
    this.updateURLSilently();
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
    
    // Use router to update parameters silently
    if (window.spa?.router) {
      window.spa.router.updateParams(params);
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
      'appetizers': 'מנות ראשונות',
      'main-courses': 'מנות עיקריות',
      'side-dishes': 'תוספות',
      'soups-stews': 'מרקים ותבשילים',
      'salads': 'סלטים',
      'desserts': 'קינוחים',
      'breakfast-brunch': 'ארוחות בוקר',
      'snacks': 'חטיפים',
      'beverages': 'משקאות'
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
  }
};