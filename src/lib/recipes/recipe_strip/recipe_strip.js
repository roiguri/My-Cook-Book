import '../recipe-card/recipe-card.js';

class RecipeStrip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._pendingRecipes = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }
      </style>
      <div class="grid"></div>
    `;

    if (this._pendingRecipes) {
      this._renderRecipes(this._pendingRecipes);
      this._pendingRecipes = null;
    }
  }

  /**
   * Populate the strip with recipes.
   * @param {Array<string|Object>} items - Recipe IDs (strings) or recipe objects with an `.id` field.
   *   Passing objects skips the per-card Firestore fetch.
   */
  setRecipes(items) {
    if (!this.shadowRoot.querySelector('.grid')) {
      this._pendingRecipes = items;
      return;
    }
    this._renderRecipes(items);
  }

  _renderRecipes(items) {
    const grid = this.shadowRoot.querySelector('.grid');
    grid.innerHTML = '';

    if (!items || !items.length) return;

    items.forEach((item) => {
      const card = document.createElement('recipe-card');
      if (typeof item === 'string') {
        card.setAttribute('recipe-id', item);
      } else {
        card.setAttribute('recipe-id', item.id);
        card.recipeData = item;
      }
      grid.appendChild(card);
    });
  }
}

customElements.define('recipe-strip', RecipeStrip);
