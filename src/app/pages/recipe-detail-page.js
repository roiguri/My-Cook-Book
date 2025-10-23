import { AppConfig } from '../../js/config/app-config.js';
import '../../styles/pages/recipe-detail-spa.css';

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
      this.setupMenuHandlers(container, recipeId);
    } catch (error) {
      console.error('Failed to load recipe detail page:', error);
      this.showError(container, 'Failed to load recipe details');
    }
  },

  async initializeRecipeComponent(container, recipeId) {
    await import('../../lib/recipes/recipe_component/recipe_component.js');

    const recipeContainer = container.querySelector('.recipe-container');
    if (recipeContainer) {
      // Remove only existing recipe-component, preserve menu
      const existingComponent = recipeContainer.querySelector('recipe-component');
      if (existingComponent) {
        existingComponent.remove();
      }

      const recipeComponent = document.createElement('recipe-component');
      recipeComponent.setAttribute('recipe-id', recipeId);
      recipeContainer.appendChild(recipeComponent);
    } else {
      throw new Error('Recipe container not found in template');
    }
  },

  async importComponents() {
    // Import modal dependencies
    await import('../../lib/utilities/modal/modal.js');
    await import('../../lib/utilities/loading-spinner/loading-spinner.js');
    await import('../../lib/images/image-handler.js');
    await import('../../lib/images/image-proposal-modal.js');
  },

  setupMenuHandlers(container, recipeId) {
    const menuButton = container.querySelector('.recipe-menu-button');
    const menuDropdown = container.querySelector('.recipe-menu-dropdown');
    const suggestImagesBtn = container.querySelector('#suggest-images-btn');

    if (!menuButton || !menuDropdown || !suggestImagesBtn) {
      console.warn('Menu elements not found in container');
      return;
    }

    // Toggle dropdown on button click
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    const closeDropdown = (e) => {
      if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
        menuDropdown.classList.remove('open');
      }
    };
    document.addEventListener('click', closeDropdown);

    // Store cleanup function for unmount
    this._menuCleanup = () => {
      document.removeEventListener('click', closeDropdown);
    };

    // Handle "Suggest Images" click
    suggestImagesBtn.addEventListener('click', () => {
      menuDropdown.classList.remove('open');
      const modal = container.querySelector('image-proposal-modal');
      if (modal) {
        modal.openForRecipe(recipeId);
      } else {
        console.error('Image proposal modal not found');
      }
    });
  },

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
    // Clean up menu event listeners
    if (this._menuCleanup) {
      this._menuCleanup();
      this._menuCleanup = null;
    }
  },

  getTitle(params) {
    return params.id
      ? AppConfig.getPageTitle(`Recipe ${params.id}`)
      : AppConfig.getPageTitle('Recipe');
  },

  getMeta() {
    return {
      description: 'View detailed recipe instructions, ingredients, and cooking tips.',
      keywords: 'recipe, cooking, instructions, ingredients, kitchen',
    };
  },

  stylePath: '/src/styles/pages/recipe-detail-spa.css',
};
