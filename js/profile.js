document.addEventListener('DOMContentLoaded', async function() {
  // DOM elements
  const recipeGrid = document.getElementById('favorite-recipes');
  const filterButton = document.getElementById('open-filter-modal');
  const filterModal = document.getElementById('recipe-filter');
  const pageTitle = document.querySelector('h1');
  const categoryTabs = document.querySelector('.category-tabs ul');
  const categoryDropdown = document.getElementById('category-select');

  // State
  let currentPage = 1;
  const recipesPerPage = 4;
  let displayedRecipes = [];
  let currentCategory = 'all';

  // Initial setup
  async function initialize() {
      firebase.auth().onAuthStateChanged(async function(user) {
          if (user) {
              // User is signed in
              await loadFavoriteRecipes();
              setupEventListeners();
              await displayCurrentPageRecipes(); // Call the function to load favorites
              currentCategory = 'all';
              updateActiveTab();

              window.addEventListener('remove-favorite', async () => {
                // Update the displayed recipes
                await loadFavoriteRecipes();
                // Get the filter component
                const filterComponent = document.querySelector('recipe-filter-component');

                // Reapply the filter
                if (filterComponent) {
                    filterComponent.applyFilters();
                }
              });
          } else {
              // User is signed out
              // Handle the case where the user is not logged in
              console.log("User not logged in");
              // You might want to redirect to the login page or display a message
          }
      });
  }

  // Load favorite recipes
  async function loadFavoriteRecipes(category = null) {
    const favoriteRecipes = await fetchFavoriteRecipes();
    if (category == 'all') {
      category = null;
    }
    if (category) {
      displayedRecipes = favoriteRecipes.filter(recipe => recipe.category === category);
    } else {
      displayedRecipes = favoriteRecipes;
    }
  }

  // Event Listeners
  function setupEventListeners() {
      // Pagination
      document.getElementById('prev-page').addEventListener('click', () => goToPage(currentPage - 1));
      document.getElementById('next-page').addEventListener('click', () => goToPage(currentPage + 1));

      // Filter modal
      filterButton.addEventListener('click', () => {
        filterModal.open();
      });

      // Filter events
      filterModal.addEventListener('filter-applied', handleFilterApplied);
      filterModal.addEventListener('filter-reset', handleFilterReset);

      categoryTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          e.preventDefault();
          const newCategory = e.target.getAttribute('href').slice(1);
          switchCategory(newCategory);
        }
      });
    
      if (categoryDropdown) {
        categoryDropdown.addEventListener('change', (e) => {
          switchCategory(e.target.value);
        });
      }
  }

  // Filter Handlers
  async function handleFilterApplied(event) {
      const { recipes } = event.detail;
      displayedRecipes = recipes;
      currentPage = 1;
      await displayCurrentPageRecipes();
      updateFilterBadge(event.detail.filters);
  }

  async function handleFilterReset() {
      await loadFavoriteRecipes();
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
    // Clear existing recipe cards
    recipeGrid.innerHTML = '';
    
    // Create and append new recipe cards
    recipes.forEach(recipe => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'recipe-card-container';
        
        const recipeCard = document.createElement('recipe-card');
        recipeCard.setAttribute('recipe-id', recipe.id);
        recipeCard.setAttribute('layout', 'vertical');
        recipeCard.setAttribute('show-favorites', true);
        recipeCard.style.width = '100%';
        recipeCard.style.height = '100%';
        
        recipeCard.addEventListener('recipe-card-open', (event) => {
            window.location.href = `./recipe-page.html?id=${event.detail.recipeId}`;
        });
        
        cardContainer.appendChild(recipeCard);
        recipeGrid.appendChild(cardContainer);
    });
  }

  async function switchCategory(category) {
    currentCategory = category;
    currentPage = 1;
    updateActiveTab(); // Assuming you have this function
    await loadFavoriteRecipes(category); // Load favorites for the category
    await displayCurrentPageRecipes();
  }

  function updateActiveTab() {
    categoryTabs.querySelectorAll('a').forEach(tab => {
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

  // UI Update Functions
  function updatePagination() {
      const totalPages = Math.ceil(displayedRecipes.length / recipesPerPage);
      const prevButton = document.getElementById('prev-page');
      const nextButton = document.getElementById('next-page');
      const pageInfo = document.getElementById('page-info');

      prevButton.disabled = currentPage <= 1;
      nextButton.disabled = currentPage >= totalPages;
      pageInfo.textContent = totalPages > 0 
          ? `עמוד ${currentPage} מתוך ${totalPages}` 
          : 'אין תוצאות';
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
        filters.tags?.length > 0
    ].filter(Boolean).length;

    // Update badge visibility and count
    if (activeFilters > 0) {
        badge.textContent = activeFilters;
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
  }

  function goToPage(page) {
      const totalPages = Math.ceil(displayedRecipes.length / recipesPerPage);
      if (page > 0 && page <= totalPages) {
          currentPage = page;
          displayCurrentPageRecipes();

          // Scroll to top of page smoothly
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
      }
  }

  // Fetch favorite recipes from Firestore
  async function fetchFavoriteRecipes() {
    const userId = firebase.auth().currentUser.uid; // Assuming you're using Firebase Authentication
    const userDoc = await firebase.firestore().collection('users').doc(userId).get();
    const favoriteRecipeIds = userDoc.data().favorites || [];
    const favoriteRecipes = [];
    for (const recipeId of favoriteRecipeIds) {
        const recipeDoc = await firebase.firestore().collection('recipes').doc(recipeId).get();
        if (recipeDoc.exists) {
            favoriteRecipes.push({id: recipeId, ...recipeDoc.data()});
        }
    }
    console.log(favoriteRecipes);
    return favoriteRecipes;
  }

  // Initialize the page
  initialize();
});