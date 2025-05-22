let recipeProposedSuccessHandler = null;

/**
 * Initializes the propose recipe page logic.
 * @param {HTMLElement} contentElement - The parent DOM element where the page content is loaded.
 */
export function initProposeRecipePage(contentElement) {
  // Handler to scroll to top on successful recipe proposal
  recipeProposedSuccessHandler = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  document.addEventListener('recipe-proposed-success', recipeProposedSuccessHandler);
}

/**
 * Cleans up the propose recipe page logic.
 * @param {HTMLElement} contentElement - The parent DOM element where the page content was loaded.
 */
export function cleanupProposeRecipePage(contentElement) {
  if (recipeProposedSuccessHandler) {
    document.removeEventListener('recipe-proposed-success', recipeProposedSuccessHandler);
    recipeProposedSuccessHandler = null;
  }
}
