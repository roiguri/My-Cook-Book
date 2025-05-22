/**
 * Initializes the recipe detail page by creating and appending a recipe-component.
 * @param {HTMLElement} contentElement - The parent DOM element where the recipe page content is loaded.
 * @param {string} recipeId - The ID of the recipe to display.
 */
export function initRecipeDetailPage(contentElement, recipeId) {
  if (!contentElement) {
    console.error('initRecipeDetailPage: contentElement is null or undefined.');
    return;
  }

  const recipeContainer = contentElement.querySelector('.recipe-container');

  if (recipeContainer) {
    // Clear any previous content in case of re-initialization without full cleanup
    recipeContainer.innerHTML = ''; 
    
    const recipeComponent = document.createElement('recipe-component');
    recipeComponent.setAttribute('recipe-id', recipeId);
    recipeContainer.appendChild(recipeComponent);
    console.log(`Recipe component for ID ${recipeId} created and appended to .recipe-container.`);
  } else {
    console.error('Element with class "recipe-container" not found within contentElement.');
    // Optionally, display an error in the contentElement itself
    // contentElement.innerHTML = '<p>Error: Recipe display area not found.</p>';
  }
}

/**
 * Cleans up the recipe detail page by clearing the recipe container.
 * @param {HTMLElement} contentElement - The parent DOM element where the recipe page content was loaded.
 */
export function cleanupRecipeDetailPage(contentElement) {
  if (!contentElement) {
    console.error('cleanupRecipeDetailPage: contentElement is null or undefined.');
    return;
  }

  const recipeContainer = contentElement.querySelector('.recipe-container');
  if (recipeContainer) {
    recipeContainer.innerHTML = '';
    console.log('.recipe-container cleared.');
  } else {
    console.warn('Element with class "recipe-container" not found during cleanup.');
  }
}
