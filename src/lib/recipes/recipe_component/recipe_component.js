import authService from '../../../js/services/auth-service.js';
import {
  getRecipeById,
  getLocalizedCategoryName,
  formatCookingTime,
} from '../../../js/utils/recipes/recipe-data-utils.js';
import {
  getRecipeImages,
  getImageUrl,
  getPlaceholderImageUrl,
} from '../../../js/utils/recipes/recipe-image-utils.js';
import {
  formatIngredientAmount,
  scaleIngredients,
} from '../../../js/utils/recipes/recipe-ingredients-utils.js';

import '../../utilities/image-carousel/image-carousel.js';

// TODO - add support for missing image upload

/**
 * Recipe Component
 *
 * A reusable web component for displaying recipe information.
 *
 * Usage:
 *
 * 1. Include the `recipe-component.js` script in your HTML file.
 * 2. Add the `<recipe-component>` element to your page.
 * 3. Set the `recipe-id` attribute to the ID of the recipe you want to display.
 *
 * Example:
 *
 * <recipe-component recipe-id="recipe123"></recipe-component>
 *
 * Attributes:
 *
 * - `recipe-id`: The ID of the recipe to display.
 */
class RecipeComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._originalIngredients = null;
  }

  connectedCallback() {
    this.render();
    this.recipeId = this.getAttribute('recipe-id');
    this.fetchAndPopulateRecipeData();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>
      <div dir="rtl" class="Recipe_component">
        <header class="recipe_component__header">
          <h1 id="Recipe_component__name" class="Recipe_component__title"></h1>
          <div class="Recipe_component__meta">
            <span id="Recipe_component__prepTime" class="Recipe_component__prepTime"></span>
            <span id="Recipe_component__waitTime" class="Recipe_component__waitTime"></span>
            <span id="Recipe_component__difficulty" class="Recipe_component__difficulty"></span>
            <span id="Recipe_component__category" class="Recipe_component__category"></span>
          </div>
        </header>
        <div class="Recipe_component__content">
          <div class="Recipe_component__details">
            <div class="Recipe_component__serving-adjuster">
              <!-- disable password manager -->
              <input name="disable-pwd-mgr-1" type="password" id="disable-pwd-mgr-1" style="display: none;" value="disable-pwd-mgr-1" />
              <input name="disable-pwd-mgr-2" type="password" id="disable-pwd-mgr-2" style="display: none;" value="disable-pwd-mgr-2" />
              <input name="disable-pwd-mgr-3" type="password" id="disable-pwd-mgr-3" style="display: none;" value="disable-pwd-mgr-3" />

              <label for="Recipe_component__servings">מספר מנות</label>
              <input type="number" id="Recipe_component__servings" name="servings" value="4" min="1">
            </div>
            <div class="Recipe_component__ingredients">
              <h2>מצרכים:</h2>
              <ul id="Recipe_component__ingredients-list" class="Recipe_component__ingredients-list"></ul>
            </div>
          </div>
          <div class="Recipe_component__image-container">
            <img id="Recipe_component__image" src="" alt="" class="Recipe_component__image">
          </div>
        </div>
        <div class="Recipe_component__instructions">
          <h2>הוראות הכנה:</h2>
          <ol id="Recipe_component__instructions-list"></ol>
        </div>
        <div class="Recipe_component__comments" style="display: none;">
          <h2>הערות:</h2>
          <ol id="Recipe_component__comments-list"></ol>
        </div>
      </div>
    `;
  }

  styles() {
    return `
    .Recipe_component {
      display: flex;
      flex-direction: column;
      width: 100%;
      font-family: var(--body-font);
      direction: rtl;
    }

    .Recipe_component__content {
      display: flex;
      gap: 2rem;
      margin-bottom: 40px;
    }

    .Recipe_component__image-container {
      flex: 1;
      min-width: 300px;
    }

    .Recipe_component__image {
      width: 100%;
      height: auto;
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .Recipe_component__details {
      flex: 1;
    }

    .Recipe_component__title {
      font-family: var(--heading-font-he);
      font-size: 3rem;
      color: var(--primary-color);
      text-align: center;
      margin-bottom: 20px;
    }

    .Recipe_component__meta {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 1rem;
      color: var(--text-color);
    }

    .Recipe_component__serving-adjuster {
      margin-top: 10px;  
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }

    .Recipe_component__serving-adjuster label {
      margin-left: 10px;
    }

    .Recipe_component__serving-adjuster input {
      width: 60px;
      padding: 5px;
      font-size: 1rem;
    }

    .Recipe_component__ingredients h2,
    .Recipe_component__instructions h2,
    .Recipe_component__comments h2 {
      font-family: var(--heading-font-he);
      font-size: 2rem;
      color: var(--primary-color);
      margin-bottom: 20px;
    }

    .Recipe_component__ingredients-list {
      list-style-type: none;
      padding: 0;
    }

    .Recipe_component__ingredients-list li {
      margin-bottom: 10px;
    }

    .Recipe_component__instructions ol {
      padding-right: 20px;
      margin-bottom: 20px;
    }

    .Recipe_component__instructions > ol {
      padding-right: 0;
    }

    .Recipe_component__instructions li {
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .Recipe_component__comments ol {
      padding-right: 20px;
      margin-bottom: 20px;
    }

    .Recipe_component__comments li {
      margin-bottom: 10px;
      line-height: 1.6;
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
      .Recipe_component{
        padding: 30px;
        width: auto;  
      }
      .Recipe_component__content {
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 10px;
      }

      .Recipe_component__details,
      .Recipe_component__image-container {
        width: 100%;
      }

      .Recipe_component__meta {
        flex-direction: column;
        align-items: center;
      }
    }
    `;
  }

  async fetchAndPopulateRecipeData() {
    try {
      const recipe = await getRecipeById(this.recipeId);
      if (recipe) {
        this.populateRecipeDetails(recipe);
        this.setRecipeImage(recipe);
        this.populateIngredientsList(recipe);
        this.populateInstructions(recipe);
        this.populateCommentList(recipe);
        this.setupServingsAdjuster(recipe);
        this._originalIngredients = recipe.ingredients;
      } else {
        console.warn('No such document!');
        // TODO: Handle the case where the recipe doesn't exist
      }
    } catch (error) {
      console.error('Error getting recipe: ', error);
      // TODO: Handle potential errors during data fetching
    }
  }

  populateRecipeDetails(recipe) {
    this.shadowRoot.getElementById('Recipe_component__name').textContent = recipe.name;
    this.shadowRoot.getElementById('Recipe_component__prepTime').textContent =
      `זמן הכנה: ${formatCookingTime(recipe.prepTime)}`;
    this.shadowRoot.getElementById('Recipe_component__waitTime').textContent =
      `זמן המתנה: ${formatCookingTime(recipe.waitTime)}`;
    this.shadowRoot.getElementById('Recipe_component__difficulty').textContent =
      `רמת קושי: ${recipe.difficulty}`;
    this.shadowRoot.getElementById('Recipe_component__category').textContent =
      `קטגוריה: ${getLocalizedCategoryName(recipe.category)}`;
  }

  async setRecipeImage(recipe) {
    try {
      const imageContainer = this.shadowRoot.querySelector('.Recipe_component__image-container');

      let userRole = await authService.getCurrentUserRole();
      if (userRole === 'user') userRole = 'public';
      const accessibleImages = getRecipeImages(recipe, userRole);

      imageContainer.innerHTML = '';
      if (accessibleImages.length === 0) {
        await this.showPlaceholder(imageContainer);
      } else if (accessibleImages.length === 1) {
        await this.showSingleImage(imageContainer, accessibleImages[0]);
      } else {
        this.showCarousel(imageContainer, accessibleImages);
      }
      // TODO: add fallback to previous load system
    } catch (error) {
      console.error('Error setting recipe images:', error);
      await this.showPlaceholder(
        this.shadowRoot.querySelector('.Recipe_component__image-container'),
      );
    }
  }

  async showPlaceholder(container) {
    const img = document.createElement('img');
    img.className = 'Recipe_component__image';
    img.alt = 'תמונת מתכון לא זמינה';
    try {
      img.src = await getPlaceholderImageUrl();
    } catch (error) {
      console.error('Could not load placeholder image', error);
    }
    container.appendChild(img);
  }

  async showSingleImage(container, image) {
    const img = document.createElement('img');
    try {
      // Get download URL from util
      const url = await getImageUrl(image.full);
      if (!url) {
        throw new Error('Failed to get image URL');
      }
      img.src = url;
      img.alt = 'תמונת מתכון';
      img.className = 'Recipe_component__image';
      container.appendChild(img);
    } catch (error) {
      console.error('Error loading image:', error);
      await this.showPlaceholder(container);
    }
  }

  async showCarousel(container, images) {
    try {
      // Sort images to ensure primary image is first
      const sortedImages = [...images].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return 0;
      });

      // Just pass the full paths directly
      const imagePaths = sortedImages.map((img) => img.full);

      const carousel = document.createElement('image-carousel');
      carousel.setAttribute('images', JSON.stringify(imagePaths));
      container.appendChild(carousel);
    } catch (error) {
      console.error('Error setting up carousel:', error);
      await this.showPlaceholder(container);
    }
  }

  // TODO: add bullets and grid layout (align amounts)
  populateIngredientsList(recipe) {
    const ingredientsList = this.shadowRoot.getElementById('Recipe_component__ingredients-list');
    ingredientsList.innerHTML = '';
    recipe.ingredients.forEach((ingredient) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="amount">${formatIngredientAmount(ingredient.amount)}</span>
        <span class="unit">${ingredient.unit}</span>
        <span class="item">${ingredient.item}</span>
      `;
      ingredientsList.appendChild(li);
    });
  }

  populateInstructions(recipe) {
    const instructionsList = this.shadowRoot.getElementById('Recipe_component__instructions-list');
    instructionsList.innerHTML = '';

    if (recipe.stages && recipe.stages.length > 0) {
      recipe.stages.forEach((stage, index) => {
        const stageTitle = document.createElement('h3');
        stageTitle.textContent = `שלב ${index + 1}: ${stage.title}`;
        stageTitle.classList.add('Recipe_component__stage-title');
        instructionsList.appendChild(stageTitle);

        const stageList = document.createElement('ol');
        stageList.classList.add('Recipe_component__instruction-list');
        stage.instructions.forEach((instruction) => {
          const li = document.createElement('li');
          li.textContent = instruction;
          stageList.appendChild(li);
        });
        instructionsList.appendChild(stageList);
      });
    } else {
      // Fallback to the original instructions array
      const singleStageList = document.createElement('ol');
      singleStageList.classList.add('Recipe_component__instruction-list');
      recipe.instructions.forEach((instruction) => {
        const li = document.createElement('li');
        li.textContent = instruction;
        singleStageList.appendChild(li);
      });
      instructionsList.appendChild(singleStageList);
    }
  }

  populateCommentList(recipe) {
    const commentsList = this.shadowRoot.getElementById('Recipe_component__comments-list');
    const commentsSection = commentsList.parentNode;
    if (Array.isArray(recipe.comments) && recipe.comments.length > 0) {
      commentsList.innerHTML = '';
      recipe.comments.forEach((comment) => {
        const li = document.createElement('li');
        li.textContent = comment;
        commentsList.appendChild(li);
      });
      commentsSection.style.display = '';
    }
  }

  setupServingsAdjuster(recipe) {
    const servingsInput = this.shadowRoot.getElementById('Recipe_component__servings');
    servingsInput.setAttribute('value', recipe.servings);
    this._originalIngredients = recipe.ingredients;

    servingsInput.addEventListener('change', () => {
      const newServings = parseInt(servingsInput.value);
      const scaledIngredients = scaleIngredients(
        this._originalIngredients,
        recipe.servings,
        newServings,
      );
      this.populateIngredientsList({ ingredients: scaledIngredients });
    });
  }
}

customElements.define('recipe-component', RecipeComponent);
