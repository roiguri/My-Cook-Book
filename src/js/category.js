import { getFirestoreInstance } from '../js/services/firebase-service.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import authService from '../js/services/auth-service.js';

document.addEventListener('DOMContentLoaded', async function () {
  // DOM elements
  const categoryTabs = document.querySelector('.category-tabs ul');
  const categoryDropdown = document.getElementById('category-select');
  const recipeGrid = document.getElementById('recipe-grid');
  const filterButton = document.getElementById('open-filter-modal');
  const filterModal = document.getElementById('recipe-filter');
  const pageTitle = document.querySelector('h1');
  const filterSearchBar = document.querySelector('filter-search-bar');

  let initialAuthSetup = false;
  // Repopulate recipes on authentication change
  authService.addAuthObserver(async (state) => {
    // Repopulate recipes when the authentication state changes
    await loadInitialRecipes();
    await displayCurrentPageRecipes();
  });

  // State
  let currentCategory = window.location.hash ? window.location.hash.slice(1) : 'all';
  let currentPage = 1;
  const recipesPerPage = 4;
  let displayedRecipes = [];
  let currentSearchQuery = '';

  // Parse URL parameters for search
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');

  // Initialize search service
  const searchService = document.createElement('search-service');
  searchService.id = 'mainSearch';
  document.body.appendChild(searchService);

  // Initial setup
  async function initialize() {
    if (searchQuery) {
      currentSearchQuery = searchQuery;
      updatePageTitle();
    }

    if (filterSearchBar) {
      filterSearchBar.setValue(currentSearchQuery);
    }

    await loadInitialRecipes();
    setupEventListeners();
    updateActiveTab();
    updatePageTitle();
    await displayCurrentPageRecipes();
  }

  // Load initial recipes
  async function loadInitialRecipes() {
    const db = getFirestoreInstance();
    let recipesQuery = query(collection(db, 'recipes'), where('approved', '==', true));

    if (currentCategory !== 'all') {
      recipesQuery = query(
        collection(db, 'recipes'),
        where('approved', '==', true),
        where('category', '==', currentCategory),
      );
    }

    const snapshot = await getDocs(recipesQuery);
    displayedRecipes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter if exists
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
  function setupEventListeners() {
    // Category navigation
    categoryTabs.addEventListener('click', handleCategoryClick);
    if (categoryDropdown) {
      categoryDropdown.addEventListener('change', handleCategoryChange);
    }

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('next-page').addEventListener('click', () => goToPage(currentPage + 1));

    // Filter modal
    filterButton.addEventListener('click', () => {
      if (currentCategory !== 'all') {
        filterModal.setAttribute('category', currentCategory);
      } else {
        filterModal.removeAttribute('category');
      }
      // Set current recipes before opening modal
      filterModal.setInitialRecipes(displayedRecipes);
      filterModal.open();
    });

    // Filter events
    filterModal.addEventListener('filter-applied', handleFilterApplied);
    filterModal.addEventListener('filter-reset', handleFilterReset);
    if (filterSearchBar) {
      filterSearchBar.addEventListener('search-input', handleFilterSearch);
    }
  }

  async function handleFilterSearch(e) {
    const { searchText } = e.detail;
    if (currentSearchQuery !== searchText) {
      // Only update if value changed
      currentSearchQuery = searchText;
      await loadInitialRecipes();
      currentPage = 1;
      await displayCurrentPageRecipes();
    }
  }

  // Category Handlers
  async function handleCategoryClick(e) {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const newCategory = e.target.getAttribute('href').slice(1);
      await switchCategory(newCategory);
    }
  }

  async function handleCategoryChange(e) {
    await switchCategory(e.target.value);
  }

  async function switchCategory(category) {
    currentCategory = category;
    currentPage = 1;
    window.location.hash = category;

    updateActiveTab();
    updatePageTitle();
    await loadInitialRecipes();

    if (filterSearchBar) {
      filterSearchBar.clear(); // Reset search bar when switching categories
    }
    currentSearchQuery = ''; // Reset search query

    await displayCurrentPageRecipes();

    // Reset filter modal for new category
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
    recipeGrid.innerHTML = '';

    if (recipes.length === 0) {
      // Set grid to display flex for centering
      recipeGrid.style.display = 'flex';
      recipeGrid.style.justifyContent = 'center';
      recipeGrid.style.alignItems = 'center';
      recipeGrid.style.minHeight = '200px'; // Give some vertical space

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

    // Reset grid to original layout for recipes
    recipeGrid.style.display = 'grid';
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
        window.location.href = `recipe-page.html?id=${event.detail.recipeId}`;
      });

      cardContainer.appendChild(recipeCard);
      recipeGrid.appendChild(cardContainer);
    });
  }

  // UI Update Functions
  function updateActiveTab() {
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

  function updatePageTitle() {
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

  // Helper function for category names
  function getCategoryName(categoryId) {
    const categoryMap = {
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
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    pageInfo.textContent = totalPages > 0 ? `עמוד ${currentPage} מתוך ${totalPages}` : 'אין תוצאות';
  }

  function updateFilterBadge(filters = null) {
    const badge = document.getElementById('filter-badge');

    // If no filters or filters is null, hide badge
    if (!filters) {
      badge.style.display = 'none';
      return;
    }

    // Count active filters
    const activeFilters = [
      filters.cookingTime,
      filters.difficulty,
      filters.mainIngredient,
      filters.tags?.length > 0,
    ].filter(Boolean).length;

    // Update badge visibility and count
    if (activeFilters > 0) {
      badge.textContent = activeFilters;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }

  // Utility Functions
  async function getImageUrl(recipe) {
    try {
      let imagePath;
      if (recipe.pendingImage && recipe.pendingImage.compressed) {
        imagePath = recipe.pendingImage.compressed;
      } else if (recipe.image) {
        // Check if image exists
        imagePath = `img/recipes/compressed/${recipe.category}/${recipe.image}`;
      } else {
        // If no image property exists, throw error to use placeholder
        throw new Error('No image defined');
      }
      const imageRef = storage.ref().child(imagePath);
      return await imageRef.getDownloadURL();
    } catch (error) {
      const imagePath = `img/recipes/compressed/place-holder-missing.png`;
      const imageRef = storage.ref().child(imagePath);
      return await imageRef.getDownloadURL();
    }
  }

  function formatCookingTime(time) {
    if (time <= 60) return `${time} דקות`;
    if (time < 120) return `שעה ו-${time % 60} דקות`;
    if (time === 120) return 'שעתיים';
    if (time < 180) return `שעתיים ו-${time % 60} דקות`;
    if (time % 60 === 0) return `${time / 60} שעות`;
    return `${Math.floor(time / 60)} שעות ו-${time % 60} דקות`;
  }

  function goToPage(page) {
    const totalPages = Math.ceil(displayedRecipes.length / recipesPerPage);
    if (page > 0 && page <= totalPages) {
      currentPage = page;
      displayCurrentPageRecipes();

      // Scroll to top of page smoothly
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  // Initialize the page
  initialize();
});
