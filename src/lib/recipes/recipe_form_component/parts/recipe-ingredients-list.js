
/**
 * RecipeIngredientsList Component
 * -------------------------------
 * Specialized dynamic list component for managing recipe ingredients.
 * Extends SectionedListComponent to provide 3-field ingredients (quantity, unit, item).
 */

import { SectionedListComponent } from './sectioned-list-component.js';

class RecipeIngredientsList extends SectionedListComponent {
  constructor() {
    super();
    this.listTitle = this.getAttribute('title') || 'מצרכים:';
    this.containerClass = 'recipe-form__ingredients';
    this.itemClass = 'recipe-form__ingredient-entry';
    this.addButtonClass = 'recipe-form__button--add-ingredient';
    this.removeButtonClass = 'recipe-form__button--remove-ingredient';
    
    // Override selector configuration for ingredients-specific DOM structure
    this.sectionContainerSelector = '.recipe-form__ingredient-sections[data-section-index]';
    this.sectionNameInputSelector = '.recipe-form__input--section-name';
    this.sectionValidationErrorKey = 'sectionTitles';
    this.sectionValidationErrorMessage = 'חובה למלא לפחות 2 קטגוריות עם כותרת ומצרכים.';
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupInputListeners();
  }

  /**
   * Sets up input event listeners to clear errors on value change
   */
  setupInputListeners() {
    // Use event delegation since ingredient inputs are added dynamically
    this.shadowRoot.addEventListener('input', (event) => {
      const target = event.target;
      if (target.matches('.recipe-form__input--quantity, .recipe-form__input--unit, .recipe-form__input--item, .recipe-form__input--section-name')) {
        // Clear error highlighting when user changes the value
        target.classList.remove('recipe-form__input--invalid');
      }
    });
  }

  createListItemHTML(ingredient, includeRemove) {
    const escapedQuantity = String(ingredient.amount || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const escapedUnit = (ingredient.unit || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const escapedItem = (ingredient.item || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const removeButtonHTML = includeRemove
      ? `<button type="button" class="recipe-form__button ${this.removeButtonClass}">-</button>`
      : '';

    return `
      <div class="${this.itemClass}">
        <input type="text" class="recipe-form__input recipe-form__input--quantity"
               placeholder="כמות" name="quantity" value="${escapedQuantity}">
        <input type="text" class="recipe-form__input recipe-form__input--unit"
               placeholder="יחידה" name="unit" value="${escapedUnit}">
        <input type="text" class="recipe-form__input recipe-form__input--item"
               placeholder="פריט" name="item" value="${escapedItem}">
        <button type="button" class="recipe-form__button ${this.addButtonClass}">+</button>
        ${removeButtonHTML}
      </div>
    `;
  }

  getItemData(itemElement) {
    const quantityInput = itemElement.querySelector('.recipe-form__input--quantity');
    const unitInput = itemElement.querySelector('.recipe-form__input--unit');
    const itemInput = itemElement.querySelector('.recipe-form__input--item');

    return {
      amount: quantityInput ? quantityInput.value.trim() : '',
      unit: unitInput ? unitInput.value.trim() : '',
      item: itemInput ? itemInput.value.trim() : ''
    };
  }

  getInitialItems() {
    return [{ amount: '', unit: '', item: '' }];
  }

  isItemPopulated(itemData) {
    return itemData.amount || itemData.unit || itemData.item;
  }

  /**
   * Validates individual ingredient fields
   * @param {Object} item - Ingredient item to validate
   * @returns {Object} Object with field names as keys for invalid fields
   */
  validateItemFields(item) {
    const errors = {};
    
    if (!item.amount || !item.amount.trim()) {
      errors.amount = true;
    }
    if (!item.unit || !item.unit.trim()) {
      errors.unit = true;
    }
    if (!item.item || !item.item.trim()) {
      errors.item = true;
    }
    
    return errors;
  }

  setValidationState(errors) {
    // Clear all existing error states including section name inputs
    this.shadowRoot.querySelectorAll('.recipe-form__input--invalid').forEach(input => {
        input.classList.remove('recipe-form__input--invalid');
    });

    if (!errors || Object.keys(errors).length === 0) return;

    const fieldMapping = { amount: 'quantity', unit: 'unit', item: 'item' };

    Object.keys(errors).forEach(key => {
      // Handle section mode validation errors
      if (key.startsWith('sections[')) {
        this.handleSectionValidationError(key, errors[key]);
      }
      // Handle basic mode validation errors  
      else if (key.startsWith('items[')) {
        this.handleBasicModeValidationError(key, errors[key], fieldMapping);
      }
      // Handle legacy ingredient format errors for backward compatibility
      else if (key.startsWith('ingredients[')) {
        this.handleLegacyIngredientError(key, errors[key], fieldMapping);
      }
    });
  }

  /**
   * Handles validation errors for section mode
   * @param {string} key - Error key (e.g., "sections[0].title" or "sections[0].items[1].amount")
   * @param {*} errorValue - Error value (usually true)
   */
  handleSectionValidationError(key, errorValue) {
    const sectionMatch = key.match(/sections\[(\d+)\]\.(.+)/);
    if (!sectionMatch) return;

    const sectionIndex = parseInt(sectionMatch[1], 10);
    const remainder = sectionMatch[2];
    
    const sectionElement = this.shadowRoot.querySelector(`[data-section-index="${sectionIndex}"]`);
    if (!sectionElement) return;

    if (remainder === 'title') {
      // Highlight section title input
      const titleInput = sectionElement.querySelector('.recipe-form__input--section-name');
      if (titleInput) {
        titleInput.classList.add('recipe-form__input--invalid');
      }
    } else if (remainder.startsWith('items[')) {
      // Handle item-specific errors within a section
      const itemMatch = remainder.match(/items\[(\d+)\]\.(\w+)/);
      if (itemMatch) {
        const itemIndex = parseInt(itemMatch[1], 10);
        const field = itemMatch[2];
        
        const itemElements = sectionElement.querySelectorAll(`.${this.itemClass}`);
        const itemElement = itemElements[itemIndex];
        if (!itemElement) return;
        
        const cssClass = { amount: 'quantity', unit: 'unit', item: 'item' }[field] || field;
        const input = itemElement.querySelector(`.recipe-form__input--${cssClass}`);
        if (input) input.classList.add('recipe-form__input--invalid');
      }
    }
  }

  /**
   * Handles validation errors for basic mode
   * @param {string} key - Error key (e.g., "items[0].amount")
   * @param {*} errorValue - Error value
   * @param {Object} fieldMapping - Field name mapping
   */
  handleBasicModeValidationError(key, errorValue, fieldMapping) {
    const itemMatch = key.match(/items\[(\d+)\]\.(\w+)/);
    if (!itemMatch) return;

    const itemIndex = parseInt(itemMatch[1], 10);
    const field = itemMatch[2];

    const itemElements = this.shadowRoot.querySelectorAll(`.${this.itemClass}`);
    const itemElement = itemElements[itemIndex];
    if (!itemElement) return;

    const cssClass = fieldMapping[field] || field;
    const input = itemElement.querySelector(`.recipe-form__input--${cssClass}`);
    if (input) input.classList.add('recipe-form__input--invalid');
  }

  /**
   * Handles legacy ingredient validation errors for backward compatibility
   * @param {string} key - Error key (e.g., "ingredients[0].amount")
   * @param {*} errorValue - Error value
   * @param {Object} fieldMapping - Field name mapping
   */
  handleLegacyIngredientError(key, errorValue, fieldMapping) {
    const allItemElements = [];
    if (this.isSectionMode) {
        const sectionElements = this.shadowRoot.querySelectorAll('[data-section-index]');
        Array.from(sectionElements)
            .sort((a, b) => a.dataset.sectionIndex - b.dataset.sectionIndex)
            .forEach(sectionEl => {
                sectionEl.querySelectorAll(`.${this.itemClass}`).forEach(itemEl => {
                    allItemElements.push(itemEl);
                });
            });
    } else {
        this.shadowRoot.querySelectorAll(`.${this.itemClass}`).forEach(itemEl => {
            allItemElements.push(itemEl);
        });
    }

    const match = key.match(/ingredients\[(\d+)\]\.?(\w+)?/);
    if (match) {
        const itemIndex = parseInt(match[1], 10);
        const field = match[2];

        const itemEl = allItemElements[itemIndex];
        if (!itemEl) return;

        if (field) {
            const cssClass = fieldMapping[field] || field;
            const input = itemEl.querySelector(`.recipe-form__input--${cssClass}`);
            if (input) input.classList.add('recipe-form__input--invalid');
        } else {
            itemEl.querySelectorAll('input').forEach(input => {
                input.classList.add('recipe-form__input--invalid');
            });
        }
    }
  }
}

customElements.define('recipe-ingredients-list', RecipeIngredientsList);
