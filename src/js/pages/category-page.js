import authService from '../services/auth-service.js'; // Adjusted path
import { FirestoreService } from '../services/firestore-service.js'; // Adjusted path

let categoryTabs, categoryDropdown, recipeGrid, filterButton, filterModal, pageTitle, filterSearchBar;
let authObserverUnsubscribe = null; // To store the unsubscribe function for the auth observer
let searchService; // Will be created and appended to contentElement's body or a specific part of it

// State variables - these will be reset each time initCategoryPage is called
let currentCategory;
let currentPage;
const recipesPerPage = 4; // This can remain a constant outside if it never changes
let displayedRecipes;
let currentSearchQuery;

// Event listeners that need to be removed
let categoryTabsClickHandler;
let categoryDropdownChangeHandler;
let prevPageClickHandler;
let nextPageClickHandler;
let filterButtonClickHandler;
let filterModalAppliedHandler;
let filterModalResetHandler;
let filterSearchBarInputHandler;


export function initCategoryPage(contentElement) {
  console.log('Initializing Category Page with contentElement:', contentElement);

  // Re-initialize state variables
  currentCategory = window.location.hash.split('?')[0].split('#').pop() || 'all'; // More robust hash parsing
  if (currentCategory === 'categories' || currentCategory === '') currentCategory = 'all'; // Handle base #/categories route

  currentPage = 1;
  displayedRecipes = [];
  currentSearchQuery = '';

  // DOM elements - queried relative to contentElement
  categoryTabs = contentElement.querySelector('.category-tabs ul');
  categoryDropdown = contentElement.querySelector('#category-select');
  recipeGrid = contentElement.querySelector('#recipe-grid');
  filterButton = contentElement.querySelector('#open-filter-modal');
  filterModal = contentElement.querySelector('#recipe-filter');
  pageTitle = contentElement.querySelector('h1.page-title'); // Assuming h1 has a common class or is the main h1
  filterSearchBar = contentElement.querySelector('filter-search-bar');

  if (!categoryTabs || !recipeGrid || !filterButton || !filterModal || !pageTitle) {
    console.error('One or more critical DOM elements not found in contentElement for category page.');
    return;
  }
  
  // Initialize search service (if it's a custom element that needs to be in the DOM)
  // Check if it already exists from a previous load, if so, remove it or re-use.
  // For simplicity, let's assume it's fine to re-add or that it's part of the static HTML of categories.html
  searchService = contentElement.querySelector('#mainSearch'); // Assuming it's in the HTML template
  if (!searchService) {
      searchService = document.createElement('search-service');
      searchService.id = 'mainSearch';
      // contentElement.appendChild(searchService); // Or a more specific location
      // Note: Appending to document.body might cause issues if not handled carefully during cleanup.
      // It's better if searchService is part of the categories.html content.
      // For now, let's assume it's in the template. If not, this needs refinement.
      console.warn('search-service element not found in contentElement. Some features might not work.');
  }


  // Repopulate recipes on authentication change
  // Remove previous observer before adding a new one to prevent multiple listeners
  if (authObserverUnsubscribe) {
    authObserverUnsubscribe();
  }
  authObserverUnsubscribe = authService.addAuthObserver(async (state) => {
    await loadInitialRecipes();
    await displayCurrentPageRecipes();
  });

  // Parse URL parameters for search (if any, from #/recipe?id=X&q=Y)
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const searchQueryFromUrl = urlParams.get('q');
  if (searchQueryFromUrl) {
      currentSearchQuery = searchQueryFromUrl;
  }


  // Initial setup function (formerly initialize)
  async function setupCategoryPage() {
    if (currentSearchQuery && filterSearchBar) {
      filterSearchBar.setValue(currentSearchQuery);
    }

    await loadInitialRecipes();
    setupEventListeners(contentElement); // Pass contentElement
    updateActiveTab();
    updatePageTitle();
    await displayCurrentPageRecipes();
  }

  // Load initial recipes
  async function loadInitialRecipes() {
    let queryParams = { where: [['approved', '==', true]] };
    if (currentCategory !== 'all') {
      queryParams.where.push(['category', '==', currentCategory]);
    }
    displayedRecipes = await FirestoreService.queryDocuments('recipes', queryParams);
    if (currentSearchQuery) {
      displayedRecipes = filterRecipesBySearch(displayedRecipes, currentSearchQuery);
    }
  }

  function filterRecipesBySearch(recipes, searchText) {
    const searchTerms = searchText.toLowerCase().trim().split(/\s+/);
    return recipes.filter((recipe) => {
      const searchableText = [recipe.name, recipe.category, ...(recipe.tags || [])]
        .join(' ')
        .toLowerCase();
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  // Event Listeners
  function setupEventListeners(element) { // Accept element to bind listeners correctly
    categoryTabsClickHandler = handleCategoryClick;
    categoryTabs.addEventListener('click', categoryTabsClickHandler);

    if (categoryDropdown) {
      categoryDropdownChangeHandler = handleCategoryChange;
      categoryDropdown.addEventListener('change', categoryDropdownChangeHandler);
    }

    prevPageClickHandler = () => goToPage(currentPage - 1);
    nextPageClickHandler = () => goToPage(currentPage + 1);
    element.querySelector('#prev-page').addEventListener('click', prevPageClickHandler);
    element.querySelector('#next-page').addEventListener('click', nextPageClickHandler);
    
    filterButtonClickHandler = () => {
      if (currentCategory !== 'all') {
        filterModal.setAttribute('category', currentCategory);
      } else {
        filterModal.removeAttribute('category');
      }
      filterModal.setInitialRecipes(displayedRecipes);
      filterModal.open();
    };
    filterButton.addEventListener('click', filterButtonClickHandler);

    filterModalAppliedHandler = handleFilterApplied;
    filterModalResetHandler = handleFilterReset;
    filterModal.addEventListener('filter-applied', filterModalAppliedHandler);
    filterModal.addEventListener('filter-reset', filterModalResetHandler);

    if (filterSearchBar) {
      filterSearchBarInputHandler = handleFilterSearch;
      filterSearchBar.addEventListener('search-input', filterSearchBarInputHandler);
    }
  }

  async function handleFilterSearch(e) {
    const { searchText } = e.detail;
    if (currentSearchQuery !== searchText) {
      currentSearchQuery = searchText;
      await loadInitialRecipes();
      currentPage = 1;
      await displayCurrentPageRecipes();
      updatePageTitle(); // Update title based on search
    }
  }

  // Category Handlers
  async function handleCategoryClick(e) {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const newCategory = e.target.getAttribute('href').slice(1); // href is like #appetizers
      // Construct new hash for SPA navigation
      window.location.hash = `#/categories#${newCategory}`;
      // No, switchCategory will be called by hashchange now.
      // await switchCategory(newCategory);
    }
  }

  async function handleCategoryChange(e) {
    // Construct new hash for SPA navigation
    window.location.hash = `#/categories#${e.target.value}`;
    // await switchCategory(e.target.value);
  }

  // This function is now primarily called by the router's hashchange listener,
  // or internally when filters/search changes.
  // The actual hash change (window.location.hash = ...) should trigger router.
  async function switchCategory(category) {
    currentCategory = category;
    currentPage = 1;
    // window.location.hash = category; // This was for non-SPA version. For SPA, router handles hash.
                                     // If called from within page, update hash to reflect state.
                                     // window.location.hash = `#/categories#${category}`; // This is better.

    updateActiveTab();
    updatePageTitle();
    await loadInitialRecipes();

    if (filterSearchBar) {
      filterSearchBar.clear();
    }
    currentSearchQuery = '';

    await displayCurrentPageRecipes();

    if (category === 'all') {
      filterModal.removeAttribute('category');
    } else {
      filterModal.setAttribute('category', category);
    }
  }

  // Filter Handlers
  async function handleFilterApplied(event) {
    const { recipes } = event.detail;
    displayedRecipes = recipes;
    currentPage = 1;
    if (currentSearchQuery) {
      displayedRecipes = filterRecipesBySearch(displayedRecipes, currentSearchQuery);
    }
    await displayCurrentPageRecipes();
    updateFilterBadge(event.detail.filters);
  }

  async function handleFilterReset() {
    await loadInitialRecipes();
    if (currentSearchQuery) {
      displayedRecipes = filterRecipesBySearch(displayedRecipes, currentSearchQuery);
    }
    currentPage = 1;
    await displayCurrentPageRecipes();
    updateFilterBadge();
  }

  // Display Functions
  async function displayCurrentPageRecipes() {
    const startIndex = (currentPage - 1) * recipesPerPage;
    const paginatedRecipes = displayedRecipes.slice(startIndex, startIndex + recipesPerPage);
    await displayRecipes(paginatedRecipes);
    updatePagination();
  }

  async function displayRecipes(recipes) {
    if (!recipeGrid) {
        console.error("recipeGrid is not available for displayRecipes");
        return;
    }
    recipeGrid.innerHTML = '';

    if (recipes.length === 0) {
      recipeGrid.style.display = 'flex';
      recipeGrid.style.justifyContent = 'center';
      recipeGrid.style.alignItems = 'center';
      recipeGrid.style.minHeight = '200px';
      const noResultsMessage = document.createElement('div');
      noResultsMessage.className = 'no-results';
      noResultsMessage.style.textAlign = 'center';
      noResultsMessage.innerHTML = `
          <p>לא נמצאו מתכונים ${currentSearchQuery ? 'תואמים' : 'בקטגוריה זו'}</p>
          ${currentSearchQuery ? '<p>נסה לשנות את מילות החיפוש</p>' : ''}
      `;
      recipeGrid.appendChild(noResultsMessage);
      return;
    }

    recipeGrid.style.display = 'grid'; // Reset to grid
    recipeGrid.style.justifyContent = '';
    recipeGrid.style.alignItems = '';
    recipeGrid.style.minHeight = '';

    const authenticated = authService.getCurrentUser();
    recipes.forEach((recipe) => {
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
        // UPDATED NAVIGATION for SPA
        window.location.hash = `#/recipe?id=${event.detail.recipeId}`;
      });
      cardContainer.appendChild(recipeCard);
      recipeGrid.appendChild(cardContainer);
    });
  }

  // UI Update Functions
  function updateActiveTab() {
    if (!categoryTabs) return;
    categoryTabs.querySelectorAll('a').forEach((tab) => {
      // href is like #appetizers, currentCategory is appetizers
      if (tab.getAttribute('href').slice(1) === currentCategory) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    if (categoryDropdown) {
      categoryDropdown.value = currentCategory;
    }
  }

  function updatePageTitle() {
    if (!pageTitle) return;
    if (currentSearchQuery) {
      pageTitle.textContent = `תוצאות חיפוש`;
      if (currentCategory !== 'all') {
        pageTitle.textContent += ` - ${getCategoryName(currentCategory)}`;
      }
    } else {
      pageTitle.textContent =
        currentCategory === 'all' ? 'מתכונים' : `${getCategoryName(currentCategory)}`;
    }
  }

  function getCategoryName(categoryId) {
    const categoryMap = {
      all: 'כל המתכונים', // Added for clarity
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
    return categoryMap[categoryId] || categoryId;
  }

  function updatePagination() {
    const totalPages = Math.ceil(displayedRecipes.length / recipesPerPage);
    const prevButton = contentElement.querySelector('#prev-page'); // Query relative to contentElement
    const nextButton = contentElement.querySelector('#next-page'); // Query relative to contentElement
    const pageInfo = contentElement.querySelector('#page-info');   // Query relative to contentElement

    if (!prevButton || !nextButton || !pageInfo) return;

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    pageInfo.textContent = totalPages > 0 ? `עמוד ${currentPage} מתוך ${totalPages}` : 'אין תוצאות';
  }

  function updateFilterBadge(filters = null) {
    const badge = contentElement.querySelector('#filter-badge'); // Query relative to contentElement
    if (!badge) return;

    if (!filters) {
      badge.style.display = 'none';
      return;
    }
    const activeFilters = [
      filters.cookingTime,
      filters.difficulty,
      filters.mainIngredient,
      filters.tags?.length > 0,
    ].filter(Boolean).length;

    if (activeFilters > 0) {
      badge.textContent = activeFilters;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }
  
  // This function will be called when navigating away from the categories page
  // It's also part of the export.
  // cleanupCategoryPage = () => { ... } defined below

  function goToPage(page) {
    const totalPages = Math.ceil(displayedRecipes.length / recipesPerPage);
    if (page > 0 && page <= totalPages) {
      currentPage = page;
      displayCurrentPageRecipes();
      contentElement.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll contentElement, not window
    }
  }
  
  // Call the setup function for the category page
  setupCategoryPage();

  // Expose a function to handle internal navigation (e.g. from hash change)
  // This is needed because the router will detect #/categories#appetizers
  // and we need to tell category-page.js to switch to 'appetizers'
  // This is effectively the new entry point if the category part of the hash changes.
  this.handleCategoryChangeForRouter = async (newCategory) => {
    if (newCategory && newCategory !== currentCategory) {
        console.log(`Router triggered category switch to: ${newCategory}`);
        await switchCategory(newCategory);
    } else if (!newCategory && currentCategory !== 'all') {
        // Handles case where hash is just #/categories, default to 'all'
        await switchCategory('all');
    }
  };
  
  // Initial check for sub-category from hash
  const hashParts = window.location.hash.split('#');
  if (hashParts.length > 2 && hashParts[1] === 'categories') {
      const subCategory = hashParts[2];
      if (subCategory && subCategory !== currentCategory) {
          // Delay slightly to ensure DOM is ready
          setTimeout(() => switchCategory(subCategory), 0);
      }
  }

} // End of initCategoryPage

export function cleanupCategoryPage() {
  console.log('Cleanup for categories page called');
  if (authObserverUnsubscribe) {
    authObserverUnsubscribe();
    authObserverUnsubscribe = null;
  }

  // Remove event listeners
  if (categoryTabs && categoryTabsClickHandler) {
    categoryTabs.removeEventListener('click', categoryTabsClickHandler);
  }
  if (categoryDropdown && categoryDropdownChangeHandler) {
    categoryDropdown.removeEventListener('change', categoryDropdownChangeHandler);
  }
  // Assuming prev/next buttons are within contentElement that gets replaced.
  // If they were attached to contentElement directly:
  // if (contentElement.querySelector('#prev-page') && prevPageClickHandler) {
  //   contentElement.querySelector('#prev-page').removeEventListener('click', prevPageClickHandler);
  // }
  // if (contentElement.querySelector('#next-page') && nextPageClickHandler) {
  //   contentElement.querySelector('#next-page').removeEventListener('click', nextPageClickHandler);
  // }
  // For simplicity, this assumes the elements are gone. If not, they need explicit removal.

  if (filterButton && filterButtonClickHandler) {
    filterButton.removeEventListener('click', filterButtonClickHandler);
  }
  if (filterModal) { // Check if filterModal exists before removing listeners
    if (filterModalAppliedHandler) filterModal.removeEventListener('filter-applied', filterModalAppliedHandler);
    if (filterModalResetHandler) filterModal.removeEventListener('filter-reset', filterModalResetHandler);
  }
  if (filterSearchBar && filterSearchBarInputHandler) {
    filterSearchBar.removeEventListener('search-input', filterSearchBarInputHandler);
  }
  
  // Nullify DOM element references
  categoryTabs = null;
  categoryDropdown = null;
  recipeGrid = null;
  filterButton = null;
  filterModal = null;
  pageTitle = null;
  filterSearchBar = null;
  searchService = null; // if it was created and appended to body, it might need to be removed from DOM too

  console.log('Category page cleanup finished.');
}
// Removed getImageUrl as it used a global 'storage' which is not defined here.
// If needed, it should be part of FirestoreService or another service.
// The recipe-card component is responsible for displaying images.
