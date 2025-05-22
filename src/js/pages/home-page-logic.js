import { FirestoreService } from '../services/firestore-service.js'; // Adjusted path

// Module-scoped variables to store elements and handlers for cleanup
let currentFeaturedRecipesGrid = null;
let currentRecipeCardOpenHandler = null;
let currentRecipesContainer = null;
let currentMessageContainer = null; // To remove the message container during cleanup

/**
 * Initializes the featured recipes section on the home page.
 * @param {HTMLElement} contentElement - The parent DOM element where the home page content is loaded.
 */
export async function initFeaturedRecipes(contentElement) {
  if (!contentElement) {
    console.error('initFeaturedRecipes: contentElement is null or undefined.');
    return;
  }

  // Reset module-scoped variables in case of re-initialization
  cleanupFeaturedRecipes(contentElement); // Call cleanup to ensure clean state

  currentFeaturedRecipesGrid = contentElement.querySelector('#featured-recipes-grid');
  const sectionContainer = contentElement.querySelector('.featured-recipes'); // Parent of grid and message

  if (!currentFeaturedRecipesGrid || !sectionContainer) {
    console.error('Featured recipes grid or its section container not found within contentElement.');
    return;
  }

  // Create and add loading message
  currentMessageContainer = document.createElement('p');
  currentMessageContainer.dir = 'rtl';
  currentMessageContainer.style.fontSize = 'var(--size-header2)'; // Assuming CSS var is globally available
  currentMessageContainer.innerHTML = 'טוען את המתכונים הכי חדשים...';
  sectionContainer.insertBefore(currentMessageContainer, currentFeaturedRecipesGrid);

  const elementScroller = contentElement.querySelector('element-scroller');
  if (!elementScroller) {
      console.error('element-scroller not found within contentElement.');
      if(currentMessageContainer) currentMessageContainer.innerHTML = 'שגיאה בטעינת אזור המתכונים.';
      return;
  }
  currentRecipesContainer = elementScroller.querySelector('[slot="items"]');
  if (!currentRecipesContainer) {
      console.error('Recipes container slot ("items") not found within element-scroller.');
      if(currentMessageContainer) currentMessageContainer.innerHTML = 'שגיאה בטעינת אזור המתכונים.';
      return;
  }
  currentRecipesContainer.innerHTML = ''; // Clear previous recipes

  try {
    const queryParams = { where: [['approved', '==', true]] };
    const recipes = await FirestoreService.queryDocuments('recipes', queryParams);

    if (!recipes.length) {
      console.log('No featured recipes found.');
      if(currentMessageContainer) currentMessageContainer.innerHTML = 'לא נמצאו מתכונים מומלצים.';
      // Do not return here, allow cleanup to remove the message if needed, or leave message.
    } else {
        // Sort by creationTime if exists, newest first
        recipes.sort((a, b) => {
          const timeA = a.creationTime?.seconds || 0;
          const timeB = b.creationTime?.seconds || 0;
          return timeB - timeA;
        });
        // Take only first 3
        const recentRecipes = recipes.slice(0, 3);
        
        if(currentMessageContainer) currentMessageContainer.remove(); // Remove loading message
        currentMessageContainer = null; // Nullify after removal

        recentRecipes.forEach((doc) => {
          const recipeCard = document.createElement('recipe-card');
          recipeCard.setAttribute('recipe-id', doc.id);
          recipeCard.setAttribute('layout', 'vertical');
          recipeCard.setAttribute('card-width', '200px'); // These could be CSS
          recipeCard.setAttribute('card-height', '300px'); // These could be CSS
          if(currentRecipesContainer) currentRecipesContainer.appendChild(recipeCard);
        });

        // Define the handler
        currentRecipeCardOpenHandler = (event) => {
          const recipeId = event.detail.recipeId;
          window.location.hash = `#/recipe?id=${recipeId}`; // SPA Navigation
        };
        // Add event listener
        if(currentFeaturedRecipesGrid) currentFeaturedRecipesGrid.addEventListener('recipe-card-open', currentRecipeCardOpenHandler);
    }

    // Initialize the element-scroller after content is loaded/changed
    if (elementScroller) {
      // Force recalculation of scroller dimensions if it has such a method or re-set attributes
      // These might need to be part of the element-scroller's own lifecycle callbacks.
      // Forcing re-init might be okay if the component is designed for it.
      elementScroller.setAttribute('item-width', '200'); 
      elementScroller.setAttribute('padding', '20');
      if (typeof elementScroller.handleResize === 'function') {
          setTimeout(() => { // Delay to ensure DOM updates are processed
            elementScroller.handleResize();
          }, 100);
      } else if (typeof elementScroller.connectedCallback === 'function' && recipes.length > 0) {
          // If it's a custom element that re-initializes on attribute change or re-append
          // This is a bit of a hack. Ideally, the component handles dynamic content better.
          // elementScroller.disconnectedCallback(); // If it has one
          // elementScroller.connectedCallback();
      }
    }
  } catch (error) {
    console.error('Error fetching or displaying featured recipes:', error);
    if(currentMessageContainer) currentMessageContainer.innerHTML = 'שגיאה בטעינת המתכונים המומלצים. נסה שוב מאוחר יותר.';
  }
}

/**
 * Cleans up the featured recipes section.
 * @param {HTMLElement} contentElement - The parent DOM element where the home page content was loaded.
 *                                     (Note: contentElement is not strictly needed if module vars are used,
 *                                     but good for consistency or if module vars aren't successfully set).
 */
export function cleanupFeaturedRecipes(passedContentElement) {
  console.log('Cleaning up featured recipes...');
  
  // Use module-scoped variables if they exist, otherwise query from passedContentElement as a fallback
  const gridToClean = currentFeaturedRecipesGrid || (passedContentElement ? passedContentElement.querySelector('#featured-recipes-grid') : null);
  const containerToClear = currentRecipesContainer || (passedContentElement ? passedContentElement.querySelector('element-scroller [slot="items"]') : null);
  const messageToRemove = currentMessageContainer || (passedContentElement ? passedContentElement.querySelector('.featured-recipes > p') : null); // Assuming message is a p direct child

  if (gridToClean && currentRecipeCardOpenHandler) {
    gridToClean.removeEventListener('recipe-card-open', currentRecipeCardOpenHandler);
    console.log('recipe-card-open event listener removed.');
  }
  if (containerToClear) {
    containerToClear.innerHTML = '';
    console.log('Featured recipes container cleared.');
  }

  if(messageToRemove && messageToRemove.parentNode) {
      messageToRemove.remove();
      console.log('Loading/error message removed.');
  }

  // Reset module-scoped variables
  currentFeaturedRecipesGrid = null;
  currentRecipeCardOpenHandler = null;
  currentRecipesContainer = null;
  currentMessageContainer = null;
  console.log('Featured recipes cleanup finished.');
}
