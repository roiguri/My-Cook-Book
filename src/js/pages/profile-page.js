import authService from '../services/auth-service.js'; // Adjusted path
import { FirestoreService } from '../services/firestore-service.js'; // Adjusted path

// DOM element references, will be initialized in initProfilePage
let recipeGrid, filterButton, filterModal, pageTitle, categoryTabs, categoryDropdown, filterSearchBar;
let searchService; // Will be created if not part of the HTML template

// State variables
let allFavoriteRecipes = [];
let currentPage = 1;
const recipesPerPage = 4; // Constant
let displayedRecipes = [];
let currentCategory = 'all';
let currentSearchQuery = '';

// Event listener handlers - to be assigned in init and removed in cleanup
let authObserverUnsubscribe = null;
let removeFavoriteHandler;
let prevPageClickHandler, nextPageClickHandler;
let filterButtonClickHandler, filterModalAppliedHandler, filterModalResetHandler;
let categoryTabsClickHandler, categoryDropdownChangeHandler;
let filterSearchBarInputHandler;

export function initProfilePage(contentElement) {
  console.log('Initializing Profile Page with contentElement:', contentElement);

  // Reset state variables
  allFavoriteRecipes = [];
  currentPage = 1;
  displayedRecipes = [];
  currentCategory = 'all';
  currentSearchQuery = '';

  // DOM elements - queried relative to contentElement
  recipeGrid = contentElement.querySelector('#favorite-recipes');
  filterButton = contentElement.querySelector('#open-filter-modal');
  filterModal = contentElement.querySelector('#recipe-filter');
  pageTitle = contentElement.querySelector('h1.page-title') || contentElement.querySelector('h1'); // More robust selector for title
  categoryTabs = contentElement.querySelector('.category-tabs ul');
  categoryDropdown = contentElement.querySelector('#category-select');
  filterSearchBar = contentElement.querySelector('filter-search-bar');

  if (!recipeGrid || !filterButton || !filterModal || !pageTitle || !categoryTabs) {
    console.error('One or more critical DOM elements not found in contentElement for profile page.');
    // Potentially return or throw an error if critical elements are missing
  }
  
  // Initialize search service (if it's a custom element that needs to be in the DOM)
  // Assuming it's part of the profile.html template loaded into contentElement
  searchService = contentElement.querySelector('#profileSearch');
  if (!searchService) {
      console.warn('search-service element with id "profileSearch" not found in contentElement. Search might not work.');
      // If it needs to be created dynamically:
      // searchService = document.createElement('search-service');
      // searchService.id = 'profileSearch';
      // contentElement.appendChild(searchService); // Or a more specific location
  }

  // Auth observer setup
  if (authObserverUnsubscribe) {
    authObserverUnsubscribe(); // Clean up previous observer
  }
  authObserverUnsubscribe = authService.addAuthObserver(async (state) => {
    if (state.user) {
      if (filterSearchBar) {
        filterSearchBar.setValue(''); // Reset search bar
      }
      await loadAllFavorites(contentElement); // Pass contentElement if needed by display
      await updateDisplayedRecipes(contentElement); // Pass contentElement
      setupEventListeners(contentElement); // Pass contentElement
      currentCategory = 'all'; // Reset category
      updateActiveTab(contentElement); // Pass contentElement

      // Setup 'remove-favorite' listener
      removeFavoriteHandler = async () => {
        await loadAllFavorites(contentElement);
        await updateDisplayedRecipes(contentElement);
        const filterComponent = contentElement.querySelector('recipe-filter-component'); // Query relative to contentElement
        if (filterComponent) {
          filterComponent.applyFilters();
        }
      };
      window.addEventListener('remove-favorite', removeFavoriteHandler);

    } else {
      console.log('User not logged in for profile page. Clearing content or redirecting.');
      if (recipeGrid) recipeGrid.innerHTML = '<p>Please log in to see your favorite recipes.</p>';
      // No automatic redirect, router handles navigation.
      // Consider redirecting via hash change if profile is not accessible logged out:
      // window.location.hash = '#/';
    }
  });
} // End of initProfilePage

async function loadAllFavorites(contentElement) {
  allFavoriteRecipes = await fetchFavoriteRecipes();
}

async function updateDisplayedRecipes(contentElement) {
  let filteredRecipes = [...allFavoriteRecipes];
  if (currentCategory !== 'all') {
    filteredRecipes = filteredRecipes.filter((recipe) => recipe.category === currentCategory);
  }
  if (currentSearchQuery) {
    filteredRecipes = filterRecipesBySearch(filteredRecipes, currentSearchQuery);
  }
  displayedRecipes = filteredRecipes;
  currentPage = 1;
  await displayCurrentPageRecipes(contentElement);
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

function setupEventListeners(element) {
  // Pagination
  prevPageClickHandler = () => goToPage(currentPage - 1, element);
  nextPageClickHandler = () => goToPage(currentPage + 1, element);
  element.querySelector('#prev-page').addEventListener('click', prevPageClickHandler);
  element.querySelector('#next-page').addEventListener('click', nextPageClickHandler);

  // Filter modal
  filterButtonClickHandler = () => {
    if (filterModal) { // Ensure filterModal exists
        filterModal.setInitialRecipes(displayedRecipes); // Use local displayedRecipes
        filterModal.open();
    }
  };
  if (filterButton) filterButton.addEventListener('click', filterButtonClickHandler);


  filterModalAppliedHandler = (event) => handleFilterApplied(event, element);
  filterModalResetHandler = () => handleFilterReset(element);
  if (filterModal) {
      filterModal.addEventListener('filter-applied', filterModalAppliedHandler);
      filterModal.addEventListener('filter-reset', filterModalResetHandler);
  }
  

  // Category events
  categoryTabsClickHandler = (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const newCategory = e.target.getAttribute('href').slice(1);
      switchCategory(newCategory, element);
    }
  };
  if (categoryTabs) categoryTabs.addEventListener('click', categoryTabsClickHandler);

  categoryDropdownChangeHandler = (e) => switchCategory(e.target.value, element);
  if (categoryDropdown) categoryDropdown.addEventListener('change', categoryDropdownChangeHandler);
  

  // Search events
  filterSearchBarInputHandler = (e) => handleFilterSearch(e, element);
  if (filterSearchBar) filterSearchBar.addEventListener('search-input', filterSearchBarInputHandler);
}

async function handleFilterSearch(e, contentElement) {
  const { searchText } = e.detail;
  if (currentSearchQuery !== searchText) {
    currentSearchQuery = searchText;
    await updateDisplayedRecipes(contentElement);
  }
}

async function handleFilterApplied(event, contentElement) {
  const { recipes, filters } = event.detail;
  displayedRecipes = recipes;
  if (currentSearchQuery) {
    displayedRecipes = filterRecipesBySearch(displayedRecipes, currentSearchQuery);
  }
  currentPage = 1;
  await displayCurrentPageRecipes(contentElement);
  updateFilterBadge(filters, contentElement);
}

async function handleFilterReset(contentElement) {
  await updateDisplayedRecipes(contentElement);
  updateFilterBadge(null, contentElement); // Pass null to hide badge
}

async function displayCurrentPageRecipes(contentElement) {
  const startIndex = (currentPage - 1) * recipesPerPage;
  const paginatedRecipes = displayedRecipes.slice(startIndex, startIndex + recipesPerPage);
  await displayRecipes(paginatedRecipes, contentElement);
  updatePagination(contentElement);
}

async function displayRecipes(recipes, contentElement) {
  if (!recipeGrid) {
      console.error("recipeGrid is not available in displayRecipes (profile page).");
      return;
  }
  recipeGrid.innerHTML = ''; // Clear existing

  if (recipes.length === 0) {
    recipeGrid.style.display = 'flex';
    recipeGrid.style.justifyContent = 'center';
    recipeGrid.style.alignItems = 'center';
    recipeGrid.style.minHeight = '200px';
    const noResultsMessage = document.createElement('div');
    noResultsMessage.className = 'no-results';
    noResultsMessage.style.textAlign = 'center';
    noResultsMessage.innerHTML = `<p>לא נמצאו מתכונים מועדפים ${currentSearchQuery ? 'התואמים את החיפוש' : (currentCategory !== 'all' ? 'בקטגוריה זו' : '')}.</p>`;
    recipeGrid.appendChild(noResultsMessage);
    return;
  }

  recipeGrid.style.display = 'grid'; // Reset to grid
  recipeGrid.style.justifyContent = '';
  recipeGrid.style.alignItems = '';
  recipeGrid.style.minHeight = '';

  recipes.forEach((recipe) => {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'recipe-card-container';
    const recipeCard = document.createElement('recipe-card');
    recipeCard.setAttribute('recipe-id', recipe.id);
    recipeCard.setAttribute('layout', 'vertical');
    recipeCard.setAttribute('show-favorites', 'true'); // String true
    recipeCard.style.width = '100%';
    recipeCard.style.height = '100%';
    recipeCard.addEventListener('recipe-card-open', (event) => {
      window.location.hash = `#/recipe?id=${event.detail.recipeId}`; // SPA Navigation
    });
    cardContainer.appendChild(recipeCard);
    recipeGrid.appendChild(cardContainer);
  });
}

async function switchCategory(category, contentElement) {
  currentCategory = category;
  updateActiveTab(contentElement);
  if (filterSearchBar) {
    filterSearchBar.clear();
  }
  currentSearchQuery = '';
  await updateDisplayedRecipes(contentElement);
}

function updateActiveTab(contentElement) {
  if (!categoryTabs) return;
  categoryTabs.querySelectorAll('a').forEach((tab) => {
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

function updatePagination(contentElement) {
  const totalPages = Math.ceil(displayedRecipes.length / recipesPerPage);
  const prevButton = contentElement.querySelector('#prev-page');
  const nextButton = contentElement.querySelector('#next-page');
  const pageInfo = contentElement.querySelector('#page-info');
  
  if (!prevButton || !nextButton || !pageInfo) return;

  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
  pageInfo.textContent = totalPages > 0 ? `עמוד ${currentPage} מתוך ${totalPages}` : 'אין תוצאות';
}

function updateFilterBadge(filters = null, contentElement) {
  const badge = contentElement.querySelector('#filter-badge');
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

function goToPage(page, contentElement) {
  const totalPages = Math.ceil(displayedRecipes.length / recipesPerPage);
  if (page > 0 && page <= totalPages) {
    currentPage = page;
    displayCurrentPageRecipes(contentElement);
    contentElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function fetchFavoriteRecipes() {
  try {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.uid) {
        console.log("No user logged in, cannot fetch favorites.");
        return [];
    }
    const userId = currentUser.uid;
    const userDoc = await FirestoreService.getDocument('users', userId);
    const favoriteRecipeIds = userDoc?.favorites || [];
    if (favoriteRecipeIds.length === 0) return [];

    const chunks = [];
    for (let i = 0; i < favoriteRecipeIds.length; i += 10) { // Firestore 'in' query limit is 10 (now 30, but 10 is safer)
      chunks.push(favoriteRecipeIds.slice(i, i + 10));
    }
    const fetchPromises = chunks.map((chunk) =>
      FirestoreService.queryDocuments('recipes', {
        where: [[FirestoreService.documentId ? FirestoreService.documentId() : '__name__', 'in', chunk]],
      })
    );
    const results = await Promise.all(fetchPromises);
    const recipes = results.flat().filter(recipe => recipe.approved); // Ensure only approved recipes
    
    const recipesMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    return favoriteRecipeIds
      .map((id) => recipesMap.get(id))
      .filter((recipe) => recipe !== undefined);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}

export function cleanupProfilePage() {
  console.log('Cleaning up Profile Page...');
  if (authObserverUnsubscribe) {
    authObserverUnsubscribe();
    authObserverUnsubscribe = null;
  }
  if (removeFavoriteHandler) {
    window.removeEventListener('remove-favorite', removeFavoriteHandler);
    removeFavoriteHandler = null;
  }

  // Remove event listeners using stored handlers
  // Note: Elements are queried from the *original* contentElement passed to init.
  // If contentElement was replaced, these might not be the same.
  // However, router replaces innerHTML of #app-content, so these elements are gone.
  // This cleanup is more for listeners on `window` or `document` or external elements.
  // For elements within contentElement, their listeners are wiped when innerHTML changes.
  // But it's good practice if elements could persist or if listeners were on parent.
  
  // Since the elements are children of contentElement which gets its innerHTML replaced,
  // we don't strictly need to remove listeners from them IF initProfilePage is always
  // called with a fresh contentElement. But if not, or for safety:
  // if (recipeGrid && specificListenersToRecipeGrid...) recipeGrid.removeEventListener...
  // This example focuses on global listeners and nullifying variables.

  // Nullify DOM references
  recipeGrid = null;
  filterButton = null;
  filterModal = null;
  pageTitle = null;
  categoryTabs = null;
  categoryDropdown = null;
  filterSearchBar = null;
  searchService = null; // If created dynamically and appended to body, it might need DOM removal.

  // Reset state
  allFavoriteRecipes = [];
  displayedRecipes = [];
  currentCategory = 'all';
  currentSearchQuery = '';
  currentPage = 1;
  
  // Nullify handler references
  prevPageClickHandler = null; nextPageClickHandler = null;
  filterButtonClickHandler = null; filterModalAppliedHandler = null; filterModalResetHandler = null;
  categoryTabsClickHandler = null; categoryDropdownChangeHandler = null;
  filterSearchBarInputHandler = null;

  console.log('Profile Page cleanup finished.');
}
