document.addEventListener('DOMContentLoaded', async function() {
  // DOM elements
  const categoryTabs = document.querySelector('.category-tabs ul');
  const categoryDropdown = document.getElementById('category-select');
  const recipeGrid = document.getElementById('recipe-grid');
  const filterButton = document.getElementById('open-filter-modal');
  const filterModal = document.getElementById('recipe-filter');
  const pageTitle = document.querySelector('h1');

  // Repopulate recipes on authentication change
  firebase.auth().onAuthStateChanged(async (user) => {
    // Repopulate recipes when the authentication state changes
    await loadInitialRecipes();
    await displayCurrentPageRecipes();
  });
  
  // State
  let currentCategory = window.location.hash ? window.location.hash.slice(1) : 'all';
  let currentPage = 1;
  const recipesPerPage = 4;
  let displayedRecipes = [];

  // Initial setup
  async function initialize() {
      await loadInitialRecipes();
      setupEventListeners();
      updateActiveTab();
      updatePageTitle();
      await displayCurrentPageRecipes();
  }

  // Load initial recipes
  async function loadInitialRecipes() {
      const query = currentCategory === 'all' 
          ? db.collection('recipes').where('approved', '==', true)
          : db.collection('recipes').where('approved', '==', true).where('category', '==', currentCategory);
          
      const snapshot = await query.get();
      displayedRecipes = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
      }));
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
        }        filterModal.open();
      });

      // Filter events
      filterModal.addEventListener('filter-applied', handleFilterApplied);
      filterModal.addEventListener('filter-reset', handleFilterReset);
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
      await displayCurrentPageRecipes();
      
      // Reset filter modal for new category
      if (category === 'all') {
        filterModal.removeAttribute('category');
      } else {
          filterModal.setAttribute('category', category);
      }    }

  // Filter Handlers
  async function handleFilterApplied(event) {
      const { recipes } = event.detail;
      displayedRecipes = recipes;
      currentPage = 1;
      await displayCurrentPageRecipes();
      updateFilterBadge(event.detail.filters);
  }

  async function handleFilterReset() {
      await loadInitialRecipes();
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
    const authenticated = firebase.auth().currentUser;
    // Create and append new recipe cards
    recipes.forEach(recipe => {
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
            window.location.href = `./recipe-page.html?id=${event.detail.recipeId}`;
        });
        
        cardContainer.appendChild(recipeCard);
        recipeGrid.appendChild(cardContainer);
    });
  }

  // UI Update Functions
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

  function updatePageTitle() {
      const categoryName = currentCategory === 'all' 
          ? 'All Recipes' 
          : currentCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      pageTitle.textContent = categoryName;
  }

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

  // Utility Functions
  async function getImageUrl(recipe) {
      try {
          let imagePath;
          if (recipe.pendingImage && recipe.pendingImage.compressed) {
              imagePath = recipe.pendingImage.compressed;
          } else {
              imagePath = `img/recipes/compressed/${recipe.category}/${recipe.image}`;
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
      if (time < 120) return `שעה ו-${time%60} דקות`;
      if (time === 120) return "שעתיים";
      if (time < 180) return `שעתיים ו-${time%60} דקות`;
      if (time % 60 === 0) return `${time/60} שעות`;
      return `${Math.floor(time/60)} שעות ו-${time%60} דקות`;
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

  // Initialize the page
  initialize();
});