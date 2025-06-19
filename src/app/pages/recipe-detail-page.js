export default {
  async render() {
    const response = await fetch(new URL('./recipe-detail-page.html', import.meta.url));

    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  },

  async mount(container, params) {
    const recipeId = params.id;
    if (!recipeId) {
      this.showError(container, 'Recipe ID is required');
      return;
    }

    try {
      await this.initializeRecipeComponent(container, recipeId);
      await this.importComponents();
    } catch (error) {
      console.error('Failed to load recipe detail page:', error);
      this.showError(container, 'Failed to load recipe details');
    }
  },

  async initializeRecipeComponent(container, recipeId) {
    await import('../../lib/recipes/recipe_component/recipe_component.js');

    const recipeContainer = container.querySelector('.recipe-container');
    if (recipeContainer) {
      recipeContainer.innerHTML = '';

      const recipeComponent = document.createElement('recipe-component');
      recipeComponent.setAttribute('recipe-id', recipeId);
      recipeContainer.appendChild(recipeComponent);
    } else {
      throw new Error('Recipe container not found in template');
    }
  },

  async importComponents() {},

  showError(container, message) {
    container.innerHTML = `
      <div class="page-error">
        <div class="error-card">
          <h2>Error Loading Recipe</h2>
          <p>Sorry, there was an error loading this recipe.</p>
          <div class="error-details" id="recipe-error-details"></div>
          <button class="reload-button" id="back-button">
            ← Go Back
          </button>
        </div>
      </div>
    `;

    const errorDetails = container.querySelector('#recipe-error-details');
    const backButton = container.querySelector('#back-button');

    errorDetails.textContent = message;
    backButton.addEventListener('click', () => {
      history.back();
    });
  },

  async unmount() {
    // Nothing to clean up
  },

  getTitle(params) {
    return params.id
      ? `Recipe ${params.id} - Our Kitchen Chronicles`
      : 'Recipe - Our Kitchen Chronicles';
  },

  getMeta() {
    return {
      description: 'View detailed recipe instructions, ingredients, and cooking tips.',
      keywords: 'recipe, cooking, instructions, ingredients, kitchen',
    };
  },

  stylePath: '/src/styles/pages/recipe-detail-spa.css',
};
