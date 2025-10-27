import authService from '../../../js/services/auth-service.js';
import { AppConfig } from '../../../js/config/app-config.js';
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
import { getMediaInstructionUrl } from '../../../js/utils/recipes/recipe-media-utils.js';

import '../../utilities/image-carousel/image-carousel.js';
import '../../utilities/media-scroller/media-scroller.js';
import '../../utilities/fullscreen-media-viewer/fullscreen-media-viewer.js';
import './parts/cook-mode-container.js';

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

  static get observedAttributes() {
    return ['recipe-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Only reload if the component is already connected and the recipe-id actually changed
    if (name === 'recipe-id' && oldValue !== newValue && this.isConnected && this.shadowRoot) {
      this.recipeId = newValue;
      this.fetchAndPopulateRecipeData();
    }
  }

  connectedCallback() {
    this.render();
    this.recipeId = this.getAttribute('recipe-id');
    this.fetchAndPopulateRecipeData();
  }

  disconnectedCallback() {
    // Clean up event listener to prevent memory leaks
    const scroller = this.shadowRoot?.getElementById('Recipe_component__media-scroller');
    if (scroller && this._handleMediaClick) {
      scroller.removeEventListener('itemclick', this._handleMediaClick);
    }

    // Release handler reference for garbage collection
    this._handleMediaClick = null;
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
        <cook-mode-container></cook-mode-container>
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
        <div class="Recipe_component__media-instructions" id="Recipe_component__media-section" style="display: none;">
          <h2>טיפים מצולמים:</h2>
          <media-scroller
            id="Recipe_component__media-scroller"
            item-height="auto"
            item-width="280px">
          </media-scroller>
        </div>
        <fullscreen-media-viewer id="Recipe_component__media-viewer"></fullscreen-media-viewer>
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
    .Recipe_component__media-instructions h2,
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

    .Recipe_component__section-title,
    .Recipe_component__stage-title {
      font-family: var(--heading-font-he);
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-color);
      margin: 16px 0 8px 0;
    }

    .Recipe_component__section-ingredients {
      list-style-type: none;
      padding: 0;
      margin-bottom: 20px;
    }

    .Recipe_component__section-ingredients li {
      margin-bottom: 8px;
      padding-right: 15px;
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

      .Recipe_component__section-title,
      .Recipe_component__stage-title {
        font-size: 1.1rem;
        margin: 12px 0 6px 0;
      }

      .Recipe_component__section-ingredients li {
        padding-right: 10px;
      }
    }
    `;
  }

  updatePageTitle(recipeName) {
    if (recipeName && typeof recipeName === 'string') {
      document.title = AppConfig.getPageTitle(recipeName);
    }
  }

  async fetchAndPopulateRecipeData() {
    try {
      const recipe = await getRecipeById(this.recipeId);
      if (recipe) {
        this.updatePageTitle(recipe.name);
        this.populateRecipeDetails(recipe);
        this.setRecipeImage(recipe);
        this.populateIngredientsList(recipe);
        this.populateInstructions(recipe);
        this.populateCommentList(recipe);
        this.setupServingsAdjuster(recipe);
        await this.displayMediaInstructions(recipe);
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
        imageContainer.style.display = 'none';
      } else {
        imageContainer.style.display = '';
        if (accessibleImages.length === 1) {
          await this.showSingleImage(imageContainer, accessibleImages[0]);
        } else {
          this.showCarousel(imageContainer, accessibleImages);
        }
      }
      // TODO: add fallback to previous load system
    } catch (error) {
      console.error('Error setting recipe images:', error);
      const container = this.shadowRoot.querySelector('.Recipe_component__image-container');
      if (container) {
        container.style.display = 'none';
      }
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

    // Check if ingredients are sectioned or flat format
    if (recipe.ingredientSections && Array.isArray(recipe.ingredientSections)) {
      // Handle sectioned ingredients format (Firebase uses ingredientSections field)
      recipe.ingredientSections.forEach((section) => {
        // Create section title if section has a title
        if (section.title && section.title.trim()) {
          const sectionTitle = document.createElement('h3');
          sectionTitle.textContent = section.title;
          sectionTitle.classList.add('Recipe_component__section-title');
          ingredientsList.appendChild(sectionTitle);
        }

        // Create ingredient list for this section
        const sectionList = document.createElement('ul');
        sectionList.classList.add('Recipe_component__section-ingredients');
        section.items.forEach((ingredient) => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span class="amount">${formatIngredientAmount(ingredient.amount)}</span>
            <span class="unit">${ingredient.unit}</span>
            <span class="item">${ingredient.item}</span>
          `;
          sectionList.appendChild(li);
        });
        ingredientsList.appendChild(sectionList);
      });
    } else if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      // Fallback to flat ingredients array (original format)
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

  async displayMediaInstructions(recipe) {
    const section = this.shadowRoot.getElementById('Recipe_component__media-section');
    const scroller = this.shadowRoot.getElementById('Recipe_component__media-scroller');
    const viewer = this.shadowRoot.getElementById('Recipe_component__media-viewer');

    // Only display if recipe has media instructions
    if (
      !recipe.mediaInstructions ||
      !Array.isArray(recipe.mediaInstructions) ||
      recipe.mediaInstructions.length === 0
    ) {
      section.style.display = 'none';
      return;
    }

    try {
      // Sort by order field
      const sortedMedia = [...recipe.mediaInstructions].sort((a, b) => a.order - b.order);

      // Get Firebase Storage URLs for all media
      const mediaWithUrls = await Promise.all(
        sortedMedia.map(async (media) => {
          try {
            const url = await getMediaInstructionUrl(media.path);
            return {
              ...media,
              path: url,
            };
          } catch (error) {
            console.error(`[MediaInstructions] Error loading media ${media.path}:`, error);
            return null;
          }
        }),
      );

      // Filter out any failed media loads
      const validMedia = mediaWithUrls.filter((media) => media !== null);

      if (validMedia.length > 0) {
        scroller.setAttribute('media-data', JSON.stringify(validMedia));
        section.style.display = 'block';

        // Set up fullscreen viewer
        viewer.setAttribute('media-data', JSON.stringify(validMedia));

        // Listen for itemclick events to open fullscreen viewer
        // Store handler as instance property to prevent memory leaks
        this._handleMediaClick = (event) => {
          const { index } = event.detail;
          viewer.open(index);
        };

        // Remove any existing listener before adding new one
        scroller.removeEventListener('itemclick', this._handleMediaClick);
        scroller.addEventListener('itemclick', this._handleMediaClick);
      } else {
        section.style.display = 'none';
      }
    } catch (error) {
      console.error('[MediaInstructions] Error displaying media instructions:', error);
      section.style.display = 'none';
    }
  }

  setupServingsAdjuster(recipe) {
    const servingsInput = this.shadowRoot.getElementById('Recipe_component__servings');
    servingsInput.setAttribute('value', recipe.servings);

    // Store original data in closure scope to avoid instance state issues
    const originalIngredients = recipe.ingredientSections || recipe.ingredients;
    const originalRecipeFormat = recipe.ingredientSections ? 'sectioned' : 'flat';
    const originalServings = recipe.servings;

    servingsInput.addEventListener('change', () => {
      const newServings = parseInt(servingsInput.value);

      const scaledIngredients = scaleIngredients(
        originalIngredients,
        originalServings,
        newServings,
      );

      // Pass scaled ingredients in the same format as the original data
      const scaledRecipe =
        originalRecipeFormat === 'sectioned'
          ? { ingredientSections: scaledIngredients }
          : { ingredients: scaledIngredients };

      this.populateIngredientsList(scaledRecipe);
    });
  }

  /**
   * Check if recipe has any accessible images
   * @param {Object} recipe - Recipe object with images array
   * @param {string} userRole - User role for access control
   * @returns {boolean} True if recipe has at least one accessible image
   */
  _hasImages(recipe, userRole) {
    const accessibleImages = getRecipeImages(recipe, userRole);
    return accessibleImages && accessibleImages.length > 0;
  }
}

customElements.define('recipe-component', RecipeComponent);
