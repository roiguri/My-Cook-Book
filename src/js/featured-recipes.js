import { FirestoreService } from '../js/services/firestore-service.js';

async function initFeaturedRecipes() {
  const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
  const sectionContainer = document.querySelector('.featured-recipes');

  if (!featuredRecipesGrid || !sectionContainer) {
    console.error('Featured recipes elements not found for initFeaturedRecipes');
    return;
  }

  // create a message container
  const messageContainer = document.createElement('p');
  messageContainer.dir = 'rtl';
  messageContainer.style.fontSize = 'var(--size-header2)';
  sectionContainer.insertBefore(messageContainer, featuredRecipesGrid);
  // Add loading message
  messageContainer.innerHTML = 'טוען את המתכונים הכי חדשים...';

  // Get the recipes container
  const elementScroller = document.querySelector('element-scroller');
  if (!elementScroller) {
    console.error('Element scroller not found for initFeaturedRecipes');
    messageContainer.innerHTML = 'Error loading featured recipes section.'; // Update user
    return;
  }
  const recipesContainer = elementScroller.querySelector('[slot="items"]');
  if (!recipesContainer) {
    console.error('Recipes container (slot="items") not found in element-scroller');
    messageContainer.innerHTML = 'Error loading featured recipes section.'; // Update user
    return;
  }

  try {
    // Get most recent approved recipes using modular API
    const queryParams = { where: [['approved', '==', true]] };
    const recipes = await FirestoreService.queryDocuments('recipes', queryParams);
    if (!recipes.length) {
      console.log('No matching documents.');
      messageContainer.innerHTML = 'לא נמצאו מתכונים מומלצים.';
      return;
    }
    // Sort by creationTime if exists, newest first
    recipes.sort((a, b) => {
      const timeA = a.creationTime?.seconds || 0;
      const timeB = b.creationTime?.seconds || 0;
      return timeB - timeA;
    });
    // Take only first 3
    const recentRecipes = recipes.slice(0, 3);
    // Remove loading message
    messageContainer.remove();
    // Create recipe-card elements
    recentRecipes.forEach((doc) => {
      const recipeCard = document.createElement('recipe-card');
      recipeCard.setAttribute('recipe-id', doc.id);
      recipeCard.setAttribute('layout', 'vertical');
      recipeCard.setAttribute('card-width', '200px');
      recipeCard.setAttribute('card-height', '300px');
      recipesContainer.appendChild(recipeCard);
    });

    // Add event listener for recipe card clicks
    featuredRecipesGrid.addEventListener('recipe-card-open', (event) => {
      const recipeId = event.detail.recipeId;
      // Ensure BASE_URL is correctly handled, assuming it's set globally or accessible
      const baseUrl = import.meta.env.BASE_URL || '/';
      window.location.href = `${baseUrl}pages/recipe-page.html?id=${recipeId}`;
    });

    // Initialize the element-scroller after content is loaded
    // The 'element-scroller' itself should handle its initialization when its content changes
    // or when it becomes visible. If direct re-initialization is needed,
    // ensure the component provides a method for it.
    // For now, we assume the component handles this.
    // If scroller.handleResize() is a custom method, ensure it's still valid.
    if (elementScroller.handleResize && typeof elementScroller.handleResize === 'function') {
       setTimeout(() => {
        elementScroller.setAttribute('item-width', '200'); // Redundant if already set in HTML
        elementScroller.setAttribute('padding', '20'); // Redundant if already set in HTML
        elementScroller.handleResize();
      }, 100);
    }

  } catch (error) {
    console.error('Error fetching featured recipes:', error);
    messageContainer.innerHTML = 'Error loading featured recipes. Please try again later.';
  }
}

document.addEventListener('pageContentLoaded', initFeaturedRecipes);
