import authService from '../../js/services/auth-service.js';
import { FirestoreService } from '../../js/services/firestore-service.js';
import { initLazyLoading } from '../../js/utils/lazy-loading.js';
import { AppConfig } from '../../js/config/app-config.js';
import '../../styles/pages/categories-spa.css';

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

  async mount(_container, params) {
    try {
      await this.importComponents();
      this.initializeState(params);
      this.setupAuthObserver();
      await this.loadInitialRecipes();
      this.setupEventListeners();
      await this.updateRecipesPerPage();
      await new Promise((resolve) => setTimeout(resolve, 10));
      this.updateUI();
      await this.displayCurrentPageRecipes();

      // Ensure category navigation is initialized with current state
      await new Promise((resolve) => setTimeout(resolve, 50));
      this.updateCategoryNavigation();
    } catch (error) {
      console.error('Error mounting categories page:', error);
      this.handleError(error, 'mount');
    }
  },

  async unmount() {
    try {
      if (this.authUnsubscribe) {
        this.authUnsubscribe();
      }
      this.removeEventListeners();
    } catch (error) {
      console.error('Error unmounting categories page:', error);
    }
  },

  getTitle(params) {
    const category = params?.category;
    if (category && category !== 'all') {
      return AppConfig.getPageTitle(this.getCategoryDisplayName(category));
    }
    return AppConfig.getPageTitle('מתכונים');
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

  async handleRouteChange(params) {
    const newCategory = params?.category || 'all';
    const newSearchQuery = params?.q || '';
    const favoritesOnly = params?.favorites === 'true';

    let needsReload = false;

    if (newCategory !== this.currentCategory) {
      this.currentCategory = newCategory;
      needsReload = true;
    }

    if (newSearchQuery !== this.currentSearchQuery) {
      this.currentSearchQuery = newSearchQuery;
      needsReload = true;
    }

    // Only update favorites if it's explicitly set to true in URL params
    if (favoritesOnly && favoritesOnly !== this.activeFilters.favoritesOnly) {
      this.activeFilters.favoritesOnly = favoritesOnly;
      this.hasActiveFilters = this.checkHasActiveFilters();
      needsReload = true;
    }

    if (needsReload) {
      const filterSearchBar = document.querySelector('filter-search-bar');
      if (filterSearchBar) {
        filterSearchBar.setValue(this.currentSearchQuery);
      }

      await this.loadInitialRecipes();
      this.updateUI();
      await this.displayCurrentPageRecipes();
    }
  },

  initializeState(params) {
    this.currentCategory = params?.category || 'all';
    this.currentSearchQuery = params?.q || '';
    this.currentPage = 1;
    this.recipesPerPage = 4; // Default fallback, will be calculated dynamically
    this.displayedRecipes = [];
    this.allRecipes = [];
    this.currentUser = authService.getCurrentUser(); // Track current user for auth changes

    this.userFavoritesCache = {
      userId: null,
      favorites: [],
      isLoaded: false,
    };

    this.activeFilters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: params?.favorites === 'true' || false,
    };
    this.hasActiveFilters = this.checkHasActiveFilters();
  },

  checkHasActiveFilters() {
    return !!(
      this.activeFilters.cookingTime ||
      this.activeFilters.difficulty ||
      this.activeFilters.mainIngredient ||
      (this.activeFilters.tags && this.activeFilters.tags.length > 0) ||
      this.activeFilters.favoritesOnly
    );
  },

  async calculateOptimalCardsPerPage() {
    const recipeGrid = document.getElementById('recipe-grid');
    if (!recipeGrid) return 4; // Fallback

    const tempCards = [];

    const existingChildren = Array.from(recipeGrid.children);
    existingChildren.forEach((child) => (child.style.display = 'none'));

    try {
      for (let i = 0; i < 6; i++) {
        const tempCard = document.createElement('div');
        tempCard.className = 'recipe-card-container';
        tempCard.style.minHeight = '200px'; // Realistic card height
        tempCard.style.backgroundColor = 'transparent';
        tempCard.style.border = '1px solid transparent';
        recipeGrid.appendChild(tempCard);
        tempCards.push(tempCard);
      }

      recipeGrid.offsetHeight;

      const result = await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            let actualColumns = this.measureGridColumns(tempCards);

            const rows = 2;
            const cardsPerPage = actualColumns * rows;
            const finalResult = Math.max(2, Math.min(8, cardsPerPage));

            resolve(finalResult);
          });
        });
      });

      return result;
    } catch (error) {
      console.warn('Error measuring grid layout:', error);
      return 4; // Fallback
    } finally {
      tempCards.forEach((card) => card.remove());
      existingChildren.forEach((child) => (child.style.display = ''));
    }
  },

  measureGridColumns(cards) {
    if (cards.length < 2) return 1;

    let actualColumns = 1;

    try {
      const firstCard = cards[0];
      const firstRect = firstCard.getBoundingClientRect();
      const firstRowTop = firstRect.top;

      for (let i = 1; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        if (Math.abs(cardRect.top - firstRowTop) < 10) {
          actualColumns++;
        } else {
          break;
        }
      }

      if (actualColumns === 1 && cards.length >= 2) {
        const recipeGrid = document.getElementById('recipe-grid');
        const containerWidth = recipeGrid.offsetWidth;

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

  async updateRecipesPerPage() {
    const newRecipesPerPage = await this.calculateOptimalCardsPerPage();

    if (newRecipesPerPage !== this.recipesPerPage) {
      const currentStartIndex = (this.currentPage - 1) * this.recipesPerPage;
      this.recipesPerPage = newRecipesPerPage;
      this.currentPage = Math.max(1, Math.floor(currentStartIndex / this.recipesPerPage) + 1);

      return true;
    }

    return false;
  },

  async importComponents() {
    try {
      await Promise.all([
        import('../../lib/recipes/recipe-card/recipe-card.js'),
        import('../../lib/search/filter-search-bar/filter-search-bar.js'),
        import('../../lib/search/search-service/search-service.js'),
        import('../../lib/modals/filter_modal/filter_modal.js'),
        import('../../lib/collections/category-navigation/category-navigation.js'),
        import('../../lib/collections/recipe-pagination/recipe-pagination.js'),
      ]);
    } catch (error) {
      console.error('Error importing categories page components:', error);
    }
  },

  setupAuthObserver() {
    this.authUnsubscribe = authService.addAuthObserver(async (authState) => {
      const wasAuthenticated = !!this.currentUser;
      const isNowAuthenticated = !!authState.user;
      this.currentUser = authState.user;

      if (wasAuthenticated && !isNowAuthenticated && this.activeFilters.favoritesOnly) {
        this.activeFilters.favoritesOnly = false;
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.currentCategory = 'all';
        this.currentSearchQuery = '';

        const filterSearchBar = document.querySelector('filter-search-bar');
        if (filterSearchBar) {
          filterSearchBar.clear();
        }
      }

      if (wasAuthenticated && !isNowAuthenticated) {
        this.clearFavoritesCache();
      } else if (!wasAuthenticated && isNowAuthenticated) {
        this.clearFavoritesCache();
      } else if (
        wasAuthenticated &&
        isNowAuthenticated &&
        this.currentUser?.uid !== authState.user?.uid
      ) {
        this.clearFavoritesCache();
      }

      await this.loadInitialRecipes();
      this.updateUI();
      await this.displayCurrentPageRecipes();

      this.updateFilterModalCounter();

      this.updateURLSilently();

      this.refreshFilterModalIfOpen();
    });
  },

  refreshFilterModalIfOpen() {
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal) {
      const customModal = filterModal.shadowRoot?.querySelector('custom-modal');

      if (customModal?.isOpen) {
        filterModal.render();
        filterModal.setupEventListeners();
      }
    }
  },

  async loadInitialRecipes() {
    try {
      let queryParams = { where: [['approved', '==', true]] };

      if (this.currentCategory !== 'all') {
        queryParams.where.push(['category', '==', this.currentCategory]);
      }

      this.allRecipes = await FirestoreService.queryDocuments('recipes', queryParams);

      let filteredRecipes = [...this.allRecipes];

      if (this.currentSearchQuery) {
        filteredRecipes = this.filterRecipesBySearch(filteredRecipes, this.currentSearchQuery);
      }

      if (this.hasActiveFilters) {
        filteredRecipes = await this.applyActiveFilters(filteredRecipes);
      }

      this.displayedRecipes = filteredRecipes;
      this.currentPage = 1;
    } catch (error) {
      console.error('Error loading recipes:', error);
      this.handleError(error, 'loading recipes');
    }
  },

  filterRecipesBySearch(recipes, searchText) {
    const searchTerms = searchText.toLowerCase().trim().split(/\s+/);

    return recipes.filter((recipe) => {
      const searchableText = [recipe.name, recipe.category, ...(recipe.tags || [])]
        .join(' ')
        .toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });
  },

  async applyActiveFilters(recipes) {
    if (!this.hasActiveFilters) {
      return recipes;
    }

    const { cookingTime, difficulty, mainIngredient, tags, favoritesOnly } = this.activeFilters;

    let filteredRecipes = recipes.filter((recipe) => {
      if (cookingTime) {
        const totalTime = (recipe.prepTime || 0) + (recipe.waitTime || 0);
        if (cookingTime === '0-30' && totalTime > 30) return false;
        if (cookingTime === '31-60' && (totalTime < 31 || totalTime > 60)) return false;
        if (cookingTime === '61' && totalTime <= 60) return false;
      }

      if (difficulty && recipe.difficulty !== difficulty) return false;

      if (mainIngredient && recipe.mainIngredient !== mainIngredient) return false;

      if (tags && tags.length > 0) {
        const recipeTags = recipe.tags || [];
        if (!tags.every((tag) => recipeTags.includes(tag))) return false;
      }

      return true;
    });

    if (favoritesOnly) {
      const user = authService.getCurrentUser();
      if (user) {
        const favoriteRecipeIds = await this.getUserFavorites();
        filteredRecipes = filteredRecipes.filter((recipe) => favoriteRecipeIds.includes(recipe.id));
      }
    }

    return filteredRecipes;
  },

  setupEventListeners() {
    this.resizeHandler = this.debounce(async () => {
      const changed = await this.updateRecipesPerPage();
      if (changed) {
        await this.displayCurrentPageRecipes();
      }
    }, 250);
    window.addEventListener('resize', this.resizeHandler);

    const categoryNavigation = document.getElementById('category-navigation');
    if (categoryNavigation) {
      categoryNavigation.addEventListener(
        'category-changed',
        this.handleCategoryNavigationChange.bind(this),
      );
    }

    const recipePagination = document.getElementById('recipe-pagination');
    if (recipePagination) {
      recipePagination.addEventListener('page-changed', this.handlePaginationChange.bind(this));
    }

    const filterButton = document.getElementById('open-filter-modal');
    if (filterButton) {
      filterButton.addEventListener('click', this.handleFilterModalOpen.bind(this));
    }

    const filterSearchBar = document.querySelector('filter-search-bar');
    if (filterSearchBar) {
      filterSearchBar.setValue(this.currentSearchQuery);
      filterSearchBar.addEventListener('search-input', this.handleSearchInput.bind(this));
    }

    const filterModal = document.getElementById('recipe-filter');
    if (filterModal) {
      filterModal.addEventListener('filter-applied', this.handleFilterApplied.bind(this));
      filterModal.addEventListener('filter-reset', this.handleFilterReset.bind(this));
    }

    document.addEventListener('recipe-favorite-changed', this.handleFavoriteChanged.bind(this));

    this.setupNavigationInterception();
  },

  removeEventListeners() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    document.removeEventListener('recipe-favorite-changed', this.handleFavoriteChanged.bind(this));

    this.removeNavigationInterception();
  },

  handleFavoriteChanged(event) {
    const { recipeId, isFavorite } = event.detail;
    this.updateFavoritesCache(recipeId, isFavorite);

    if (this.activeFilters.favoritesOnly) {
      this.loadInitialRecipes().then(() => {
        this.displayCurrentPageRecipes();
        this.updateFilterModalCounter();
      });
    }
  },

  updateUI() {
    this.updateCategoryNavigation();
    this.updatePageTitle();
    this.updateFilterBadgeFromState();
  },

  updateCategoryNavigation() {
    const categoryNavigation = document.getElementById('category-navigation');
    if (categoryNavigation) {
      categoryNavigation.setCurrentCategory(this.currentCategory);
    }
  },

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

  async activateFavoritesFilter() {
    // Close mobile drawer immediately for consistent timing
    if (window.closeMobileDrawer) {
      window.closeMobileDrawer();
    }

    const user = authService.getCurrentUser();
    if (!user) {
      // If user is not authenticated, show auth modal or redirect
      return;
    }

    this.activeFilters.favoritesOnly = true;
    this.hasActiveFilters = this.checkHasActiveFilters();
    this.currentCategory = 'all';
    this.currentSearchQuery = '';

    const filterSearchBar = document.querySelector('filter-search-bar');
    if (filterSearchBar) {
      filterSearchBar.clear();
    }

    await this.loadInitialRecipes();
    this.updateUI();
    await this.displayCurrentPageRecipes();

    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }

    this.updateFilterModalCounter();

    this.updateURLSilently();
  },

  async resetToAllCategories() {
    // Close mobile drawer immediately for consistent timing
    if (window.closeMobileDrawer) {
      window.closeMobileDrawer();
    }

    this.activeFilters = {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: false,
    };
    this.hasActiveFilters = this.checkHasActiveFilters();

    this.currentCategory = 'all';
    this.currentSearchQuery = '';

    const filterSearchBar = document.querySelector('filter-search-bar');
    if (filterSearchBar) {
      filterSearchBar.clear();
    }

    await this.loadInitialRecipes();
    this.updateUI();
    await this.displayCurrentPageRecipes();

    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }

    this.updateFilterModalCounter();

    this.updateURLSilently();
  },

  updateFilterBadgeFromState() {
    this.updateFilterBadge(this.activeFilters);
  },

  setupNavigationInterception() {
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

      const currentRoute = window.spa?.router?.getCurrentRoute();

      if (currentRoute === '/categories') {
        event.preventDefault();
        this.resetToAllCategories();
      }
    };

    document.addEventListener('click', this.favoritesNavHandler, true);
    document.addEventListener('click', this.categoriesNavHandler, true);
  },

  removeNavigationInterception() {
    if (this.favoritesNavHandler) {
      document.removeEventListener('click', this.favoritesNavHandler, true);
      this.favoritesNavHandler = null;
    }

    if (this.categoriesNavHandler) {
      document.removeEventListener('click', this.categoriesNavHandler, true);
      this.categoriesNavHandler = null;
    }
  },

  async displayCurrentPageRecipes() {
    const recipeGrid = document.getElementById('recipe-grid');
    if (!recipeGrid) return;

    recipeGrid.classList.add('transitioning');

    await new Promise((resolve) => setTimeout(resolve, 150));

    recipeGrid.innerHTML = '';

    const totalRecipes = this.displayedRecipes.length;
    const totalPages = Math.ceil(totalRecipes / this.recipesPerPage);
    const startIndex = (this.currentPage - 1) * this.recipesPerPage;
    const endIndex = startIndex + this.recipesPerPage;
    const currentPageRecipes = this.displayedRecipes.slice(startIndex, endIndex);

    if (currentPageRecipes.length === 0) {
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
      recipeGrid.style.display = 'grid';
      recipeGrid.style.justifyContent = '';
      recipeGrid.style.alignItems = '';
      recipeGrid.style.minHeight = '';

      const authenticated = authService.getCurrentUser();
      currentPageRecipes.forEach((recipe) => {
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

        recipeCard.addEventListener('recipe-card-open', (event) => {
          const recipeId = event.detail.recipeId;
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

      initLazyLoading(recipeGrid);
    }

    recipeGrid.classList.remove('transitioning');

    this.updatePaginationInfo(this.currentPage, totalPages, totalRecipes);
  },

  updatePaginationInfo(currentPage, totalPages, totalRecipes) {
    const recipePagination = document.getElementById('recipe-pagination');
    if (recipePagination) {
      recipePagination.setCurrentPage(currentPage);
      recipePagination.setTotalPages(totalPages);
      recipePagination.setTotalItems(totalRecipes);
    }
  },

  handleCategoryClick(event) {
    event.preventDefault();
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    let category = 'all';
    if (href) {
      const url = new URL(href, window.location.origin);
      category = url.searchParams.get('category') || 'all';
    }
    this.changeCategory(category);
  },

  async handleCategoryNavigationChange(event) {
    const category = event.detail.category;
    await this.changeCategory(category);
    this.updateURLSilently();
  },

  async handlePaginationChange(event) {
    const { page } = event.detail;
    await this.goToPage(page);
  },

  async handleSearchInput(event) {
    const searchQuery = event.detail.searchText || '';

    if (this.currentSearchQuery !== searchQuery) {
      this.currentSearchQuery = searchQuery;

      await this.loadInitialRecipes();
      this.currentPage = 1;
      this.updateUI();
      await this.displayCurrentPageRecipes();

      this.updateFilterModalCounter();

      this.updateURLSilently();
    }
  },

  async handleFilterModalOpen() {
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal) {
      // Set current filters first so modal state is initialized correctly before rendering
      if (this.hasActiveFilters) {
        filterModal.setAttribute('current-filters', JSON.stringify(this.activeFilters));
      } else {
        filterModal.removeAttribute('current-filters');
      }

      let baseRecipes = [...this.allRecipes];

      if (this.currentSearchQuery) {
        baseRecipes = this.filterRecipesBySearch(baseRecipes, this.currentSearchQuery);
      }

      if (this.activeFilters.favoritesOnly) {
        const user = authService.getCurrentUser();
        if (user) {
          const favoriteRecipeIds = await this.getUserFavorites();
          baseRecipes = baseRecipes.filter((recipe) => favoriteRecipeIds.includes(recipe.id));
        }
      }

      filterModal.setAttribute('recipes', JSON.stringify(baseRecipes));

      if (this.currentCategory !== 'all') {
        filterModal.setAttribute('category', this.currentCategory);
      } else {
        filterModal.removeAttribute('category');
      }

      filterModal.open();
    }
  },

  async handleFilterApplied(event) {
    const { recipes, filters } = event.detail;

    // Check if favorites filter changed from true to false
    const wasFavoritesOnly = this.activeFilters.favoritesOnly;
    const isFavoritesOnly = filters.favoritesOnly || false;
    const favoritesDisabled = wasFavoritesOnly && !isFavoritesOnly;

    this.activeFilters = {
      cookingTime: filters.cookingTime || '',
      difficulty: filters.difficulty || '',
      mainIngredient: filters.mainIngredient || '',
      tags: filters.tags || [],
      favoritesOnly: isFavoritesOnly,
    };

    this.hasActiveFilters = this.checkHasActiveFilters();

    // If favorites was disabled, we need to reload all recipes from Firestore
    // because the modal only had favorites recipes to work with
    if (favoritesDisabled) {
      await this.loadInitialRecipes();
    } else {
      this.displayedRecipes = recipes;
    }

    this.currentPage = 1;

    this.updateFilterBadge(filters);

    this.updatePageTitle();

    this.updateURLSilently();

    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }

    await this.displayCurrentPageRecipes();
  },

  async handleFilterReset() {
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
    this.currentPage = 1;

    this.updateFilterBadge({});

    this.updatePageTitle();

    this.updateURLSilently();

    if (window.updateActiveNavigation) {
      setTimeout(window.updateActiveNavigation, 0);
    }

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

  async changeCategory(category) {
    if (category === this.currentCategory) return;

    // Close mobile drawer immediately for consistent timing
    if (window.closeMobileDrawer) {
      window.closeMobileDrawer();
    }

    this.currentCategory = category;
    this.currentPage = 1;

    await this.loadInitialRecipes();
    this.updateUI();
    await this.displayCurrentPageRecipes();

    this.updateFilterModalCounter();
  },

  async changeSearch(searchQuery) {
    if (searchQuery === this.currentSearchQuery) return;

    this.currentSearchQuery = searchQuery;
    await this.loadInitialRecipes();
    this.currentPage = 1;
    this.updateUI();
    await this.displayCurrentPageRecipes();

    this.updateURLSilently();
  },

  async goToPage(page) {
    const totalPages = Math.ceil(this.displayedRecipes.length / this.recipesPerPage);
    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    await this.displayCurrentPageRecipes();
  },

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

    if (window.spa?.router) {
      window.spa.router.navigateWithParams('/categories', params);
    }
  },

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

    if (window.spa?.router) {
      window.spa.router.updateParams(params);
    }
  },

  updateFilterModalCounter() {
    const filterModal = document.getElementById('recipe-filter');
    if (filterModal && typeof filterModal.updateRecipeCount === 'function') {
      filterModal.updateRecipeCount(this.displayedRecipes.length);
    }
  },

  async getUserFavorites() {
    const user = authService.getCurrentUser();
    if (!user) {
      return [];
    }

    if (this.userFavoritesCache.userId === user.uid && this.userFavoritesCache.isLoaded) {
      return this.userFavoritesCache.favorites;
    }

    try {
      const userDoc = await FirestoreService.getDocument('users', user.uid);
      const favoriteRecipeIds = userDoc?.favorites || [];

      this.userFavoritesCache = {
        userId: user.uid,
        favorites: favoriteRecipeIds,
        isLoaded: true,
      };

      return favoriteRecipeIds;
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  },

  clearFavoritesCache() {
    this.userFavoritesCache = {
      userId: null,
      favorites: [],
      isLoaded: false,
    };
  },

  updateFavoritesCache(recipeId, isAdding) {
    if (this.userFavoritesCache.isLoaded) {
      if (isAdding) {
        if (!this.userFavoritesCache.favorites.includes(recipeId)) {
          this.userFavoritesCache.favorites.push(recipeId);
        }
      } else {
        this.userFavoritesCache.favorites = this.userFavoritesCache.favorites.filter(
          (id) => id !== recipeId,
        );
      }
    }
  },

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
