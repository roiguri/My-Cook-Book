/**
 * Recipe Card Web Component
 * A customizable card component for displaying recipe information
 * 
 * @dependencies
 * - Font Awesome 6.4.2 (CDN): <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
 * 
 * @attributes
 * - recipe-id: ID of the recipe to fetch from Firestore
 * - layout: 'vertical' (default) or 'horizontal'
 * - is-collapsed: Whether the card starts collapsed (requires is-collapsible)
 * - is-collapsible: Whether the card can be collapsed/expanded
 * - has-more-info-icon: Whether to show the ingredients tooltip
 * - card-width: Width of the card (default: 300px)
 * - card-height: Height of the card (default: 400px)
 * 
 * @events
 * - recipe-card-open: Emitted when the card is clicked
 *   detail: { recipeId: string }
 */
class RecipeCard extends HTMLElement {
  // Define observed attributes
  static get observedAttributes() {
      return [
          'recipe-id',
          'layout',
          'is-collapsed',
          'is-collapsible',
          'has-more-info-icon',
          'card-width',
          'card-height'
      ];
  }

  constructor() {
      super();
      // Create shadow DOM
      this.attachShadow({ mode: 'open' });
      
      this._categoryMap = {
        'appetizers': 'מנות ראשונות',
        'main-courses': 'מנות עיקריות',
        'side-dishes': 'תוספות',
        'soups-stews': 'מרקים ותבשילים',
        'salads': 'סלטים',
        'desserts': 'קינוחים',
        'breakfast-brunch': 'ארוחות בוקר',
        'snacks': 'חטיפים',
        'beverages': 'משקאות'
    };

      // Initialize default values
      this._defaults = {
        vertical: {
            width: '200px',
            height: '300px'
        },
        horizontal: {
            width: '300px',
            height: '200px'
        }
      };
      
      this._currentLayout = 'vertical';
      this._isLoading = true;
      this._recipeData = null;
      this._imageUrl = null;
      this._error = null;
      
      
      
      // Bind methods
      this._handleArrowClick = this._handleArrowClick.bind(this);
      this._handleCardClick = this._handleCardClick.bind(this);
  }

  // Getters for attribute values
  get recipeId() {
      return this.getAttribute('recipe-id');
  }

  get layout() {
      return this.getAttribute('layout') || 'vertical';
  }

  get isCollapsed() {
      return this.hasAttribute('is-collapsed');
  }

  get isCollapsible() {
      return this.hasAttribute('is-collapsible');
  }

  get hasMoreInfoIcon() {
      return this.hasAttribute('has-more-info-icon');
  }

  get cardWidth() {
      return this.getAttribute('card-width') || this._defaultWidth;
  }

  get cardHeight() {
      return this.getAttribute('card-height') || this._defaultHeight;
  }

  _getCurrentDimensions() {
    const layout = this.getAttribute('layout') || 'vertical';
    return {
        width: this.getAttribute('card-width') || this._defaults[layout].width,
        height: this.getAttribute('card-height') || this._defaults[layout].height
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
          case 'layout':
              this._updateLayout();
              break;
          case 'is-collapsed':
              if (this.isCollapsible) this._updateCollapseState();
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
      await this._fetchRecipeData();
      this._render();
      this._setupEventListeners();
  }

  _setupEventListeners() {
    // Remove existing listeners first to prevent duplicates
    this._removeEventListeners();

    const card = this.shadowRoot.querySelector('.recipe-card');
    const arrow = this.shadowRoot.querySelector('.collapse-arrow');

    if (card) {
        card.addEventListener('click', this._handleCardClick);
    }

    if (arrow) {
        arrow.addEventListener('click', this._handleArrowClick);
    }

    // Store references for cleanup
    this._card = card;
    this._arrow = arrow;
  }

  _removeEventListeners() {
    if (this._card) {
        this._card.removeEventListener('click', this._handleCardClick);
    }
    if (this._arrow) {
        this._arrow.removeEventListener('click', this._handleArrowClick);
    }
  }

  _handleCardClick(event) {
    // Prevent handling if clicking the arrow
    if (event.target.closest('.collapse-arrow')) {
        return;
    }

    console.log('Card clicked, emitting event for recipe:', this.recipeId);
    
    // Emit recipe-card-open event for the modal
    const customEvent = new CustomEvent('recipe-card-open', {
        detail: { recipeId: this.recipeId },
        bubbles: true,
        composed: true
    });
    this.dispatchEvent(customEvent);
  }

  _handleArrowClick(event) {
    console.log('Arrow clicked, current collapsed state:', this.isCollapsed);
    
    // Stop event propagation to prevent card click
    event.stopPropagation();
    
    if (this.isCollapsible) {
        this.toggleAttribute('is-collapsed');
        this._updateCollapseState();
    }
  }

  _translateCategory(category) {
      return this._categoryMap[category] || category; // fallback to original if not found
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

          const recipeDoc = await firebase.firestore()
              .collection('recipes')
              .doc(this.recipeId)
              .get();

          if (!recipeDoc.exists) {
              throw new Error('Recipe not found');
          }

          this._recipeData = {
              id: recipeDoc.id,
              ...recipeDoc.data()
          };

          await this._fetchRecipeImage();

          this._isLoading = false;
          this._render();
      } catch (error) {
          this._handleError(error);
      }
  }

  async _fetchRecipeImage() {
      try {
          const imagePath = `img/recipes/compressed/${this._recipeData.category}/${this._recipeData.image}`;
          const imageRef = firebase.storage().ref().child(imagePath);
          this._imageUrl = await imageRef.getDownloadURL();
      } catch (error) {
        const placeholderPath = 'img/recipes/compressed/place-holder-missing.png';
        const placeholderRef = firebase.storage().ref().child(placeholderPath);
        this._imageUrl = await placeholderRef.getDownloadURL();
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
              width: var(--card-width, ${this._defaultWidth});
              height: var(--card-height, ${this._defaultHeight});
          }

          .recipe-card {
              position: relative; /* Added for absolute positioning of arrow */
              background: white;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              transition: all 0.3s ease;
              height: 100%;
              display: flex;
              flex-direction: column;
              cursor: pointer; /* Added to show card is clickable */
          }


          .collapse-arrow {
              position: absolute;
              top: 8px;
              left: 8px;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.1);
              border-radius: 50%;
              cursor: pointer;
              z-index: 10;
              transition: all 0.5s ease;
          }

          .collapse-arrow::before {
              content: "▼";
              font-size: 12px;
              color: #666;
              transition: color 0.5s ease;
          }

          .collapse-arrow:hover {
              background: rgba(0, 0, 0, 0.2);
          }

          .recipe-card.collapsed .collapse-arrow {
              transform: rotate(-90deg);
          }

          .recipe-image {
              width: 100%;
              height: 50%;  /* Changed from fixed 200px to 50% */
              object-fit: cover;
          }

          .recipe-content {
              padding: 0.5rem;
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;  /* Center content vertically */
              gap: 0.5rem;  /* Consistent spacing between elements */
          }

          .recipe-title {
              text-align: center;
              margin: 0 auto;
              display: flex;
              gap: 0.5rem;
              font-size: 1.2rem;              
          }

          .more-info {
            order: -1;
          }

          .recipe-meta {
              display: flex;
              padding: 10px;
              flex-direction: column;
              align-items: center;
              gap: 0.5rem;
          }

          .recipe-meta span {
              text-align: right;
              width: 100%;      /* Added to ensure full width */
              white-space: normal; /* Allow text to wrap naturally */
              line-height: 1.4;    /* Added for better readability */
              display: block;      /* Added to ensure block-level behavior */
              font-size: clamp(0.9rem, 1.5vw, 0.9rem);
          }

          .recipe-info {
              text-align: center;
              width: 100%;
          }
      `;
  }

  _getLayoutStyles() {
    return `
        .recipe-card[data-layout="horizontal"] {
            display: flex;
            flex-direction: row-reverse;
        }

        .recipe-card[data-layout="horizontal"] .recipe-image {
            width: 50%;  /* Changed from 40% to 50% */
            height: 100%;
        }

        .recipe-card[data-layout="horizontal"] .recipe-content {
            width: 50%;  /* Changed from 60% to 50% */
            padding: 1rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
    `;
  }

  _getLoadingStyles() {
      return `
          .recipe-card.loading {
              position: relative;
              min-height: 200px;
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
      return `
          .recipe-card.collapsed .recipe-content > *:not(.recipe-title) {
              display: none;
          }

          .recipe-card.collapsed {
              height: auto;
              min-height: 80px;
          }

          .recipe-card.collapsed .recipe-image {
              display: none;
          }

          .recipe-details {
              max-height: 0;
              overflow: hidden;
              transition: max-height 0.3s ease-out;
          }

          .recipe-card:not(.collapsed) .recipe-details {
              max-height: 500px;
              transition: max-height 0.3s ease-in;
          }
      `;
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
    const translatedCategory = this._translateCategory(category);
    const ingredients = this._recipeData.ingredients.map(i => i.item).join(', ');
    
    this.shadowRoot.innerHTML = `
        <style>${this._getStyles()}</style>
        <div class="recipe-card ${this.isCollapsed ? 'collapsed' : ''}" 
             data-layout="${this.layout}">
            ${this.isCollapsible ? `
                <div class="collapse-arrow"></div>
            ` : ''}
            ${!this.isCollapsed ? `
                <img class="recipe-image" 
                     src="${this._imageUrl}" 
                     alt="${name}">
            ` : ''}
            <div class="recipe-content">
                <h3 class="recipe-title">
                    ${name}
                    ${this.hasMoreInfoIcon ? `
                        <span class="more-info" title="${ingredients}">ℹ️</span>
                    ` : ''}
                </h3>
                <div class="recipe-details">
                    <div class="recipe-meta">
                        <span>זמן הכנה: ${this._formatCookingTime(prepTime+waitTime)}</span>
                        <span>רמת קושי: ${difficulty}</span>
                        <span>קטגוריה: ${translatedCategory}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    this._setupEventListeners();
}

  // Utility methods
  _updateCollapseState() {
      const card = this.shadowRoot.querySelector('.recipe-card');
      if (card) {
          card.classList.toggle('collapsed', this.isCollapsed);
      }
  }

  _updateLayout() {
    const layout = this.getAttribute('layout') || 'vertical';
    this._currentLayout = layout;
    const dimensions = this._getCurrentDimensions();
    
    this.style.setProperty('--card-width', dimensions.width);
    this.style.setProperty('--card-height', dimensions.height);
    
    const card = this.shadowRoot.querySelector('.recipe-card');
    if (card) {
        card.setAttribute('data-layout', layout);
    }
  }

  _updateDimensions() {
      this.style.setProperty('--card-width', this.cardWidth);
      this.style.setProperty('--card-height', this.cardHeight);
  }

  _formatCookingTime(time) {
    if (time <= 60) return `${time} דקות`;
    if (time < 120) return `שעה ו-${time%60} דקות`;
    if (time === 120) return "שעתיים";
    if (time < 180) return `שעתיים ו-${time%60} דקות`;
    if (time % 60 === 0) return `${time/60} שעות`;
    return `${Math.floor(time/60)} שעות ו-${time%60} דקות`;
  }
}

// Register the custom element
customElements.define('recipe-card', RecipeCard);