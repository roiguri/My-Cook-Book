/**
 * Recipe Card Web Component
 * A simplified card component for displaying recipe information in vertical layout
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

class RecipeCard extends HTMLElement {
  // Define observed attributes
  static get observedAttributes() {
    return [
      'recipe-id',
      'card-width',
      'card-height',
    ];
  }

  constructor() {
    super();
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });

    // Initialize default values
    this._defaults = {
      width: '200px',
      height: '300px',
    };
    this._isLoading = true;
    this._recipeData = null;
    this._imageUrl = null;
    this._error = null;

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
    this._setupStyles();
    await Promise.all([this._fetchRecipeData(), this._fetchUserFavorites()]);
    this._render();
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Remove existing listeners first to prevent duplicates
    this._removeEventListeners();

    const card = this.shadowRoot.querySelector('.recipe-card');

    if (card) {
      card.addEventListener('click', this._handleCardClick);
    }

    // Store references for cleanup
    this._card = card;

    const favoriteBtn = this.shadowRoot.querySelector('.favorite-btn');
    if (favoriteBtn && !favoriteBtn.hasAttribute('listener-attached')) {
      favoriteBtn.setAttribute('listener-attached', 'true');
      favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent card click

        const isFavorite = favoriteBtn.classList.contains('active');
        favoriteBtn.classList.toggle('active');

        await this._toggleFavorite();

        this.dispatchEvent(
          new CustomEvent(isFavorite ? 'remove-favorite' : 'add-favorite', {
            bubbles: true,
            composed: true,
            detail: {
              recipeId: this.recipeId,
            },
          }),
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
    const customEvent = new CustomEvent('recipe-card-open', {
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
      this._render();
      this._recipeData = await getRecipeById(this.recipeId);
      if (!this._recipeData) {
        throw new Error('Recipe not found');
      }
      await this._fetchRecipeImage();
      this._isLoading = false;
      this._render();
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
    this._error = error.message;
    this._render();
  }

  // Styles
  _setupStyles() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.shadowRoot.appendChild(style);
  }

  _getStyles() {
    return `
        ${this._getBaseStyles()}
        ${this._getLayoutStyles()}
        ${this._getLoadingStyles()}
        ${this._getErrorStyles()}
        ${this._getCollapseStyles()}
    `;
  }

  _getBaseStyles() {
    return `
        :host {
              display: block;
              width: var(--card-width, 200px);
              height: var(--card-height, 300px);
          }

          .recipe-card {
              position: relative; /* Added for absolute positioning of arrow */
              background: var(--card-bg, white);
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
              height: 100%;
              display: flex;
              flex-direction: column;
              cursor: pointer;
              overflow: hidden;
              transform: translateY(0);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .recipe-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
          }

          .badge {
              display: inline-flex;
              align-items: center;
              padding: 0.25rem 0.75rem;
              border-radius: 12px;
              font-size: 0.85rem;
              font-weight: 500;
              color: white;
              width: auto;
              flex-wrap: nowrap;
              white-space: nowrap;
              overflow: hidden;
          }

          /* Cooking Time Badges */
          .badge.time {
              background: linear-gradient(135deg, #60a5fa, #3b82f6);  /* Sky Blue to Blue */
          }
          .badge.time.quick { /* <= 30 mins */
              background: linear-gradient(135deg, #93c5fd, #60a5fa);  /* Lighter Sky Blue to Sky Blue */
          }
          .badge.time.medium { /* 31-60 mins */
              background: linear-gradient(135deg, #60a5fa, #3b82f6);  /* Sky Blue to Blue */
          }
          .badge.time.long { /* > 60 mins */
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);  /* Blue to Dark Blue */
          }

          /* Difficulty Badges */
          .badge.difficulty.easy {
              background: linear-gradient(135deg, #86efac, #22c55e);  /* Light Green to Green */
          }
          .badge.difficulty.medium {
              background: linear-gradient(135deg, #fde047, #eab308);  /* Light Yellow to Yellow */
          }
          .badge.difficulty.hard {
              background: linear-gradient(135deg, #fca5a5, #ef4444);  /* Light Red to Red */
          }

          /* Category Badges */
          .badge.category.appetizers {
              background: linear-gradient(135deg, #f9a8d4, #ec4899);  /* Light Pink to Pink */
          }
          .badge.category.main-courses {
              background: linear-gradient(135deg, #c084fc, #a855f7);  /* Light Purple to Purple */
          }
          .badge.category.side-dishes {
              background: linear-gradient(135deg, #5eead4, #0d9488);  /* Light Teal to Teal */
          }
          .badge.category.soups-stews {
              background: linear-gradient(135deg, #bef264, #84cc16);  /* Light Lime to Lime */
          }
          .badge.category.salads {
              background: linear-gradient(135deg, #6ee7b7, #10b981);  /* Light Emerald to Emerald */
          }
          .badge.category.desserts {
              background: linear-gradient(135deg, #fb923c, #ea580c);  /* Light Orange-Red to Orange-Red */
          }
          .badge.category.breakfast-brunch {
              background: linear-gradient(135deg, #fcd34d, #d97706);  /* Light Amber to Amber */
          } 
          .badge.category.snacks {
              background: linear-gradient(135deg, #fdba74, #f97316);  /* Light Orange to Orange */
          }
          .badge.category.beverages {
              background: linear-gradient(135deg, #a5b4fc, #6366f1);  /* Light Indigo to Indigo */
          }


          .recipe-image {
              position: relative;
              width: 100%;
              height: 50%;
              object-fit: cover;
              flex-shrink: 0;
              box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
              opacity: 0;
              transition: opacity 0.3s ease;
              background-color: #f0f0f0; /* Placeholder color while loading */
          }

          .recipe-image.loaded {
              opacity: 1;
          }

          .recipe-content {
              padding: 0.5rem;
              height: 50%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              gap: 0.5rem;
              overflow: hidden;
              box-sizing: border-box;
          }

          .recipe-title {
              text-align: center;
              margin: 0 auto;
              font-size: 1.2rem;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.2;
          }


          .recipe-meta {
              display: flex;
              padding: 0.5rem;
              align-items: right;
              gap: 0.3rem;
              flex-direction: column;
          }

          .recipe-meta span {
              text-align: right;
              white-space: nowrap; /* Allow text to wrap naturally */
              line-height: 1.4;    /* Added for better readability */
              display: block;      /* Added to ensure block-level behavior */
              font-size: 0.9rem;
          }

          .recipe-info {
              text-align: center;
              width: 100%;
          }

          .category-container {
              width: 100%;
              display: flex;
              justify-content: center;
          }

          .stats-container {
              width: 100%;
              display: flex;
              justify-content: center;
              flex-wrap: nowrap;
              gap: 0.3rem;
          }

          .favorite-btn {
              position: absolute;
              top: 8px;
              right: 8px;
              width: 24px;
              height: 24px;
              padding: 0;
              background: none;
              border: none;
              cursor: pointer;
              z-index: 10;
          }

          .favorite-btn svg {
              width: 100%;
              height: 100%;
              stroke: rgba(0, 0, 0, 0.2);
              fill: white;
              transition: fill 0.3s ease, transform 0.3s ease; /* Added fill transition */
          }

          .favorite-btn.active svg {
              fill: #ff4b4b;
          }

          .favorite-btn:hover svg {
              transform: scale(1.1);
          }
              

          /* Responsive adjustments */
          @media (max-width: 260px) {
              .stats-container {
                  flex-direction: column;
                  align-items: center;
              }

              .badge {
                  width: 90%;  /* Take most of the width but leave some margin */
                  justify-content: center;
              }
          }
      `;
  }

  _getLayoutStyles() {
    return ``;
  }

  _getLoadingStyles() {
    return `
          .recipe-card.loading {
              position: relative;
              height: 100%;
          }

          .loading::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
          }

          @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
          }
      `;
  }

  _getErrorStyles() {
    return `
          .error-state {
              padding: 1rem;
              text-align: center;
              color: #721c24;
              background-color: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 10px;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
          }
      `;
  }

  _getCollapseStyles() {
    return ``;
  }

  // Rendering
  _render() {
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
    this.shadowRoot.innerHTML = `
          <style>${this._getStyles()}</style>
          <div class="recipe-card loading"></div>
      `;
  }

  _renderErrorState() {
    this.shadowRoot.innerHTML = `
          <style>${this._getStyles()}</style>
          <div class="error-state">
              ${this._error}
          </div>
      `;
  }

  _renderRecipe() {
    const { name, category, prepTime, waitTime, difficulty } = this._recipeData;
    const totalTime = prepTime + waitTime;
    const timeClass = getTimeClass(totalTime);
    const difficultyClass = getDifficultyClass(difficulty);
    const favoriteButton = this.hasAttribute('show-favorites')
      ? `
        <button class="favorite-btn ${this._isFavorite() ? 'active' : ''}" 
                aria-label="Add to favorites">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      stroke-width="2" />
            </svg>
        </button>
    `
      : '';
    this.shadowRoot.innerHTML = `
        <style>${this._getStyles()}</style>
        <div class="recipe-card">
            ${favoriteButton}
            <img class="recipe-image" 
              data-src="${this._imageUrl}" 
              alt="${name}"
              data-fallback="/img/placeholder.jpg">
            <div class="recipe-content">
                <h3 class="recipe-title">
                    ${name}
                </h3>
                <div class="recipe-details">
                    <div class="recipe-meta">
                        <div class="category-container">
                            <span class="badge category ${category}">
                                ${getLocalizedCategoryName(category)}
                            </span>
                        </div>
                        <div class="stats-container">
                            <span dir="rtl" class="badge time ${timeClass}">
                                ${formatCookingTime(totalTime)}
                            </span>
                            <span class="badge difficulty ${difficultyClass}">
                                <span class="icon">${this._getDifficultyIcon()} ${difficulty}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    this._setupEventListeners();

    // Initialize lazy loading for images in this component
    initLazyLoading(this.shadowRoot);
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
        new CustomEvent('recipe-favorite-changed', {
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
        new CustomEvent('recipe-favorite-changed', {
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
    return this._userFavorites.has(this.recipeId); // Update this line
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

// Register the custom element
customElements.define('recipe-card', RecipeCard);
