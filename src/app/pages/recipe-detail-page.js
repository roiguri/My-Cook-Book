export default {
  async render() {
    // Resolve relative to this module so it works no matter where the SPA is mounted
    const response = await fetch(new URL('./recipe-detail-page.html', import.meta.url));
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  },

  async mount(container, params) {
    console.log('🍳 Mounting recipe detail page with params:', params);
    
    // Get recipe ID from URL parameters
    const recipeId = params.id;
    if (!recipeId) {
      this.showError(container, 'Recipe ID is required');
      return;
    }

    try {
      // Import and initialize the recipe component
      await this.initializeRecipeComponent(container, recipeId);
      
      // Import any additional components needed
      await this.importComponents();
      
    } catch (error) {
      console.error('Failed to load recipe detail page:', error);
      this.showError(container, 'Failed to load recipe details');
    }
  },

  async initializeRecipeComponent(container, recipeId) {
    // Import the recipe component
    await import('../../lib/recipes/recipe_component/recipe_component.js');
    
    // Find the recipe container and add the recipe component
    const recipeContainer = container.querySelector('.recipe-container');
    if (recipeContainer) {
      // Clear any existing content
      recipeContainer.innerHTML = '';
      
      // Create and configure the recipe component
      const recipeComponent = document.createElement('recipe-component');
      recipeComponent.setAttribute('recipe-id', recipeId);
      recipeContainer.appendChild(recipeComponent);
      
      console.log(`✅ Recipe component initialized with ID: ${recipeId}`);
    } else {
      throw new Error('Recipe container not found in template');
    }
  },

  async importComponents() {
    // Import any additional components that might be needed
    // Most components are already loaded by the recipe-component itself
    console.log('📦 Additional components imported');
  },

  showError(container, message) {
    container.innerHTML = `
      <div class="page-error">
        <div class="error-card">
          <h2>❌ Error Loading Recipe</h2>
          <p>Sorry, there was an error loading this recipe.</p>
          <div class="error-details" id="recipe-error-details"></div>
          <button class="reload-button" id="back-button">
            ← Go Back
          </button>
        </div>
      </div>
    `;
    
    // Safely set error message and attach event listener
    const errorDetails = container.querySelector('#recipe-error-details');
    const backButton = container.querySelector('#back-button');
    
    errorDetails.textContent = message;
    backButton.addEventListener('click', () => {
      history.back();
    });
  },

  async unmount() {
    // Clean up any event listeners or resources if needed
    console.log('🧹 Recipe detail page unmounted');
  },

  getTitle(params) {
    // Dynamic title will be updated by the recipe component itself
    return params.id ? `Recipe ${params.id} - Our Kitchen Chronicles` : 'Recipe - Our Kitchen Chronicles';
  },

  getMeta() {
    return {
      description: 'View detailed recipe instructions, ingredients, and cooking tips.',
      keywords: 'recipe, cooking, instructions, ingredients, kitchen'
    };
  },

  // Optional: Dynamic style loading
  stylePath: '/src/styles/pages/recipe-detail-spa.css'
};