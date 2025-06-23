/**
 * Recipe Card Web Component
 * A simplified card component for displaying recipe information in vertical layout
 *
 * Architecture: Separated HTML, CSS, and JS files
 * - recipe-card.html: HTML templates
 * - recipe-card.css: Component styles
 * - recipe-card-config.js: Configuration constants
 * - recipe-card.js: Component logic (this file)
 *
 * @attributes
 * - recipe-id: ID of the recipe to fetch from Firestore (required)
 * - show-favorites: Whether to show the favorite button (optional)
 * - card-width: Width of the card (default: 200px)
 * - card-height: Height of the card (default: 300px)
 *
 * @events
 * - recipe-card-open: Emitted when the card is clicked
 *   detail: { recipeId: string }
 * - recipe-favorite-changed: Emitted when favorite status changes
 *   detail: { recipeId: string, isFavorite: boolean, userId: string }
 * - add-favorite: Emitted when recipe is added to favorites
 *   detail: { recipeId: string }
 * - remove-favorite: Emitted when recipe is removed from favorites
 *   detail: { recipeId: string }
 *
 * @features
 * - Displays recipe image (50% of card height)
 * - Shows recipe title, category, cooking time, and difficulty
 * - Loading state with skeleton animation
 * - Error state handling
 * - Favorite functionality for authenticated users
 * - Lazy loading for images
 * - Consistent dimensions to prevent layout shifts
 */
import { getFirestoreInstance } from '../../../js/services/firebase-service.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import authService from '../../../js/services/auth-service.js';
import {
  getLocalizedCategoryName,
  formatCookingTime,
  getTimeClass,
  getDifficultyClass,
  getRecipeById,
} from '../../../js/utils/recipes/recipe-data-utils.js';
import {
  getPrimaryImageUrl,
  getPlaceholderImageUrl,
} from '../../../js/utils/recipes/recipe-image-utils.js';
import { initLazyLoading } from '../../../js/utils/lazy-loading.js';
import RECIPE_CARD_CONFIG from './recipe-card-config.js';
import { recipeCardStyles } from './recipe-card-styles.js';

class RecipeCard extends HTMLElement {
  // Define observed attributes
  static get observedAttributes() {
    return RECIPE_CARD_CONFIG.OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super();
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });

    // Initialize default values
    this._defaults = RECIPE_CARD_CONFIG.DEFAULT_DIMENSIONS;
    this._isLoading = true;
    this._recipeData = null;
    this._imageUrl = null;
    this._error = null;
    this._templatesLoaded = false;
    this._stylesLoaded = false;

    // Bind methods
    this._handleCardClick = this._handleCardClick.bind(this);

    this._userFavorites = new Set();
  }

  // Getters for attribute values
  get recipeId() {
    return this.getAttribute('recipe-id');
  }

  get cardWidth() {
    return this.getAttribute('card-width') || this._defaultWidth;
  }

  get cardHeight() {
    return this.getAttribute('card-height') || this._defaultHeight;
  }

  _getCurrentDimensions() {
    return {
      width: this.getAttribute('card-width') || this._defaults.width,
      height: this.getAttribute('card-height') || this._defaults.height,
    };
  }

  // Lifecycle methods
  connectedCallback() {
    this._initialize();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'recipe-id':
        if (this.isConnected) this._fetchRecipeData();
        break;
      case 'card-width':
      case 'card-height':
        this._updateDimensions();
        break;
    }
  }

  // Initialization
  async _initialize() {
    this._loadStyles();
    this._showImmediateLoadingState();

    const templatesPromise = this._loadTemplates();

    const dataPromise = Promise.all([this._fetchRecipeData(), this._fetchUserFavorites()]);

    await templatesPromise;
    this._render();
    await dataPromise;
    this._render();
    this._setupEventListeners();
  }

  _showImmediateLoadingState() {
    // Show a simple loading state immediately, even before templates load
    const simpleLoading = document.createElement('div');
    simpleLoading.className = 'recipe-card loading';
    this.shadowRoot.appendChild(simpleLoading);
  }

  _loadStyles() {
    if (this._stylesLoaded) return;

    const style = document.createElement('style');
    style.textContent = recipeCardStyles;
    this.shadowRoot.appendChild(style);

    this._stylesLoaded = true;
  }

  async _loadTemplates() {
    if (this._templatesLoaded) return;

    // Use static cache to avoid loading templates multiple times
    if (RecipeCard._templateCache) {
      this._templates = RecipeCard._templateCache;
      this._templatesLoaded = true;
      return;
    }

    // If another instance is already loading, wait for it
    if (RecipeCard._templatePromise) {
      await RecipeCard._templatePromise;
      this._templates = RecipeCard._templateCache;
      this._templatesLoaded = true;
      return;
    }

    // This instance will load templates for everyone
    RecipeCard._templatePromise = this._loadTemplatesFromFile();

    try {
      await RecipeCard._templatePromise;
      this._templates = RecipeCard._templateCache;
      this._templatesLoaded = true;
    } catch (error) {
      console.error('Failed to load recipe card templates:', error);
      // Fallback to inline templates
      this._setupInlineTemplates();
    } finally {
      RecipeCard._templatePromise = null;
    }
  }

  async _loadTemplatesFromFile() {
    const response = await fetch(new URL('./recipe-card.html', import.meta.url));
    const htmlText = await response.text();

    // Create a temporary container to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;

    // Store templates in static cache
    RecipeCard._templateCache = {
      main: tempDiv.querySelector('#recipe-card-template'),
      loading: tempDiv.querySelector('#loading-template'),
      error: tempDiv.querySelector('#error-template'),
    };
  }

  _setupInlineStyles() {
    // This method is no longer needed since we import styles directly
    // Kept for backward compatibility
    this._loadStyles();
  }

  _setupInlineTemplates() {
    // Create minimal inline templates as fallback
    this._templates = {
      main: this._createInlineMainTemplate(),
      loading: this._createInlineLoadingTemplate(),
      error: this._createInlineErrorTemplate(),
    };
    this._templatesLoaded = true;
  }

  _createInlineMainTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `
      <div class="recipe-card">
        <img class="recipe-image" data-src="" alt="" data-fallback="/img/placeholder.jpg">
        <div class="recipe-content">
          <h3 class="recipe-title"></h3>
          <div class="recipe-details"></div>
        </div>
      </div>
    `;
    return template;
  }

  _createInlineLoadingTemplate() {
    const template = document.createElement('template');
    template.innerHTML = '<div class="recipe-card loading"></div>';
    return template;
  }

  _createInlineErrorTemplate() {
    const template = document.createElement('template');
    template.innerHTML = '<div class="error-state"></div>';
    return template;
  }

  _setupEventListeners() {
    // Remove existing listeners first to prevent duplicates
    this._removeEventListeners();

    const card = this.shadowRoot.querySelector(`.${RECIPE_CARD_CONFIG.CSS_CLASSES.card}`);

    if (card) {
      card.addEventListener('click', this._handleCardClick);
    }

    // Store references for cleanup
    this._card = card;

    const favoriteBtn = this.shadowRoot.querySelector(
      `.${RECIPE_CARD_CONFIG.CSS_CLASSES.favoriteBtn}`,
    );
    if (favoriteBtn && !favoriteBtn.hasAttribute('listener-attached')) {
      favoriteBtn.setAttribute('listener-attached', 'true');
      favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent card click

        const isFavorite = favoriteBtn.classList.contains(
          RECIPE_CARD_CONFIG.CSS_CLASSES.favoriteBtnActive,
        );
        favoriteBtn.classList.toggle(RECIPE_CARD_CONFIG.CSS_CLASSES.favoriteBtnActive);

        await this._toggleFavorite();

        this.dispatchEvent(
          new CustomEvent(
            isFavorite
              ? RECIPE_CARD_CONFIG.EVENTS.removeFavorite
              : RECIPE_CARD_CONFIG.EVENTS.addFavorite,
            {
              bubbles: true,
              composed: true,
              detail: {
                recipeId: this.recipeId,
              },
            },
          ),
        );
      });
    }
  }

  _removeEventListeners() {
    if (this._card) {
      this._card.removeEventListener('click', this._handleCardClick);
    }
  }

  _handleCardClick(event) {
    // For modifier keys and non-left clicks, create and click a temporary link
    // This ensures proper browser behavior for opening in new tabs
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      if (this.recipeId) {
        // Create a temporary link element
        const tempLink = document.createElement('a');
        tempLink.href = `/recipe/${this.recipeId}`;
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);

        // Create a new click event with the same properties
        const linkClickEvent = new MouseEvent('click', {
          button: event.button,
          buttons: event.buttons,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          bubbles: true,
          cancelable: true,
        });

        // Click the link (this will be handled by the global navigation script)
        tempLink.dispatchEvent(linkClickEvent);

        // Clean up
        document.body.removeChild(tempLink);
      }
      return;
    }

    // Emit recipe-card-open event for the modal
    const customEvent = new CustomEvent(RECIPE_CARD_CONFIG.EVENTS.cardOpen, {
      detail: { recipeId: this.recipeId },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(customEvent);
  }

  // Data fetching
  async _fetchRecipeData() {
    if (!this.recipeId) {
      this._handleError('No recipe ID provided');
      return;
    }
    try {
      this._isLoading = true;
      this._recipeData = await getRecipeById(this.recipeId);
      if (!this._recipeData) {
        throw new Error('Recipe not found');
      }
      await this._fetchRecipeImage();
      this._isLoading = false;
    } catch (error) {
      this._handleError(error);
    }
  }

  async _fetchRecipeImage() {
    try {
      this._imageUrl = await getPrimaryImageUrl(this._recipeData);
    } catch (error) {
      console.error('Error fetching recipe image:', error);
      this._imageUrl = await getPlaceholderImageUrl();
    }
  }

  // Error handling
  _handleError(error) {
    console.error('Recipe Card Error:', error);
    this._isLoading = false;
    this._error = error.message || RECIPE_CARD_CONFIG.FALLBACKS.errorMessage;
  }

  // Rendering
  _render() {
    if (!this._templatesLoaded || !this._stylesLoaded) {
      // Templates/styles not loaded yet, wait
      return;
    }

    if (this._isLoading) {
      this._renderLoadingState();
      return;
    }

    if (this._error) {
      this._renderErrorState();
      return;
    }

    if (this._recipeData) {
      this._renderRecipe();
    }
  }

  _renderLoadingState() {
    this._clearShadowRoot();
    const template = this._templates.loading;
    const clone = template.content.cloneNode(true);
    this.shadowRoot.appendChild(clone);
  }

  _renderErrorState() {
    this._clearShadowRoot();
    const template = this._templates.error;
    const clone = template.content.cloneNode(true);
    const errorElement = clone.querySelector(`.${RECIPE_CARD_CONFIG.CSS_CLASSES.error}`);
    if (errorElement) {
      errorElement.textContent = this._error;
    }
    this.shadowRoot.appendChild(clone);
  }

  _renderRecipe() {
    const { name, category, prepTime, waitTime, difficulty } = this._recipeData;
    const totalTime = prepTime + waitTime;
    const timeClass = getTimeClass(totalTime);
    const difficultyClass = getDifficultyClass(difficulty);

    this._clearShadowRoot();
    const template = this._templates.main;
    const clone = template.content.cloneNode(true);

    // Populate template with data
    const favoriteBtn = clone.querySelector(`.${RECIPE_CARD_CONFIG.CSS_CLASSES.favoriteBtn}`);
    const recipeImage = clone.querySelector(`.${RECIPE_CARD_CONFIG.CSS_CLASSES.recipeImage}`);
    const recipeTitle = clone.querySelector(`.${RECIPE_CARD_CONFIG.CSS_CLASSES.recipeTitle}`);
    const categoryBadge = clone.querySelector(`.${RECIPE_CARD_CONFIG.CSS_CLASSES.badgeCategory}`);
    const timeBadge = clone.querySelector(`.${RECIPE_CARD_CONFIG.CSS_CLASSES.badgeTime}`);
    const difficultyBadge = clone.querySelector(
      `.${RECIPE_CARD_CONFIG.CSS_CLASSES.badgeDifficulty}`,
    );

    // Handle favorite button visibility
    if (!this.hasAttribute('show-favorites') && favoriteBtn) {
      favoriteBtn.remove();
    } else if (favoriteBtn) {
      favoriteBtn.classList.toggle(
        RECIPE_CARD_CONFIG.CSS_CLASSES.favoriteBtnActive,
        this._isFavorite(),
      );
    }

    // Set image
    if (recipeImage) {
      recipeImage.setAttribute('data-src', this._imageUrl);
      recipeImage.setAttribute('alt', name);
      recipeImage.setAttribute('data-fallback', RECIPE_CARD_CONFIG.FALLBACKS.image);
    }

    // Set title
    if (recipeTitle) {
      recipeTitle.textContent = name;
    }

    // Set category badge
    if (categoryBadge) {
      categoryBadge.className = `${RECIPE_CARD_CONFIG.CSS_CLASSES.badge} ${RECIPE_CARD_CONFIG.CSS_CLASSES.badgeCategory} ${category}`;
      categoryBadge.textContent = getLocalizedCategoryName(category);
    }

    // Set time badge
    if (timeBadge) {
      timeBadge.className = `${RECIPE_CARD_CONFIG.CSS_CLASSES.badge} ${RECIPE_CARD_CONFIG.CSS_CLASSES.badgeTime} ${timeClass}`;
      timeBadge.textContent = formatCookingTime(totalTime);
    }

    // Set difficulty badge
    if (difficultyBadge) {
      difficultyBadge.className = `${RECIPE_CARD_CONFIG.CSS_CLASSES.badge} ${RECIPE_CARD_CONFIG.CSS_CLASSES.badgeDifficulty} ${difficultyClass}`;
      const iconSpan = difficultyBadge.querySelector('.icon');
      if (iconSpan) {
        iconSpan.textContent = `${this._getDifficultyIcon()} ${difficulty}`;
      }
    }

    this.shadowRoot.appendChild(clone);
    this._setupEventListeners();

    // Initialize lazy loading for images in this component
    initLazyLoading(this.shadowRoot);
  }

  _clearShadowRoot() {
    // Clear shadow root but preserve styles if they exist
    const existingStyle = this.shadowRoot.querySelector('style');
    this.shadowRoot.innerHTML = '';
    if (existingStyle) {
      this.shadowRoot.appendChild(existingStyle);
    }
  }

  // TODO: create and extract to favorites-utils file
  async _fetchUserFavorites() {
    try {
      const user = authService.getCurrentUser();
      const userId = user?.uid;
      if (!userId) return; // No user logged in
      const db = getFirestoreInstance();
      const userDoc = await getDoc(doc(db, 'users', userId));
      const favoriteRecipeIds = userDoc.data()?.favorites || [];
      this._userFavorites = new Set(favoriteRecipeIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }

  async _toggleFavorite() {
    try {
      const user = authService.getCurrentUser();
      const userId = user?.uid;
      if (!userId) return; // No user logged in

      const wasFavorite = this._isFavorite();
      const db = getFirestoreInstance();
      const userDocRef = doc(db, 'users', userId);

      if (wasFavorite) {
        // Remove from favorites
        await updateDoc(userDocRef, {
          favorites: arrayRemove(this.recipeId),
        });
        this._userFavorites.delete(this.recipeId);
      } else {
        // Add to favorites
        await updateDoc(userDocRef, {
          favorites: arrayUnion(this.recipeId),
        });
        this._userFavorites.add(this.recipeId);
      }

      // Dispatch event to notify other components about the favorite change
      this.dispatchEvent(
        new CustomEvent(RECIPE_CARD_CONFIG.EVENTS.favoriteChanged, {
          bubbles: true,
          composed: true,
          detail: {
            recipeId: this.recipeId,
            isFavorite: !wasFavorite,
            userId: userId,
          },
        }),
      );

      // Also dispatch to document for global listeners
      document.dispatchEvent(
        new CustomEvent(RECIPE_CARD_CONFIG.EVENTS.favoriteChanged, {
          detail: {
            recipeId: this.recipeId,
            isFavorite: !wasFavorite,
            userId: userId,
          },
        }),
      );

      this._renderRecipe(); // Re-render to reflect the change
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Consider adding user-facing error handling
    }
  }

  _isFavorite() {
    return this._userFavorites.has(this.recipeId);
  }

  _getDifficultyIcon() {
    return '';
  }

  // Utility methods
  _updateDimensions() {
    const dimensions = this._getCurrentDimensions();
    this.style.setProperty('--card-width', dimensions.width);
    this.style.setProperty('--card-height', dimensions.height);
  }
}

// Initialize static properties for template caching
RecipeCard._templateCache = null;
RecipeCard._templatePromise = null;

// Register the custom element
customElements.define('recipe-card', RecipeCard);
