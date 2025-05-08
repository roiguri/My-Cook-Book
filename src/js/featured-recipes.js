import { FirestoreService } from '../js/services/firestore-service.js';

async function displayFeaturedRecipes() {
  const featuredRecipesGrid = document.getElementById('featured-recipes-grid');

  // create a message container
  const sectionContainer = document.querySelector('.featured-recipes');
  const messageContainer = document.createElement('p');
  messageContainer.dir = 'rtl';
  messageContainer.style.fontSize = 'var(--size-header2)';
  sectionContainer.insertBefore(messageContainer, featuredRecipesGrid);
  // Add loading message
  messageContainer.innerHTML = 'טוען את המתכונים הכי חדשים...';

  // Get the recipes container
  const elementScroller = document.querySelector('element-scroller');
  const recipesContainer = elementScroller.querySelector('[slot="items"]');

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
      window.location.href = `${import.meta.env.BASE_URL}pages/recipe-page.html?id=${recipeId}`;
    });

    // Initialize the element-scroller after content is loaded
    const scroller = document.querySelector('element-scroller');
    if (scroller) {
      // Force recalculation of scroller dimensions
      scroller.setAttribute('item-width', '200');
      scroller.setAttribute('padding', '20');
      setTimeout(() => {
        scroller.handleResize();
      }, 100);
    }
  } catch (error) {
    console.error('Error fetching featured recipes:', error);
    messageContainer.innerHTML = 'Error loading featured recipes. Please try again later.';
  }
}

document.addEventListener('DOMContentLoaded', displayFeaturedRecipes);
