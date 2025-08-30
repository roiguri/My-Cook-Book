/**
 * RecipeIngredientsList Component
 * -------------------------------
 * Specialized dynamic list component for managing recipe ingredients.
 * Extends DynamicListComponent to provide 3-field ingredients (quantity, unit, item).
 * Future-ready for ingredient sections grouping.
 */

import { DynamicListComponent } from './dynamic-list-component.js';

class RecipeIngredientsList extends DynamicListComponent {
  constructor() {
    super();
    
    // Configure for ingredients
    this.listTitle = this.getAttribute('title') || 'מצרכים:';
    this.containerClass = 'recipe-form__ingredients';
    this.itemClass = 'recipe-form__ingredient-entry';
    this.addButtonClass = 'recipe-form__button--add-ingredient';
    this.removeButtonClass = 'recipe-form__button--remove-ingredient';
    
    // Define the three fields for ingredients
    this.itemFields = [
      { placeholder: 'כמות', className: 'recipe-form__input--quantity', name: 'quantity' },
      { placeholder: 'יחידה', className: 'recipe-form__input--unit', name: 'unit' },
      { placeholder: 'פריט', className: 'recipe-form__input--item', name: 'item' }
    ];
  }

  createInitialItem() {
    return this.createListItem(false); // No remove button for first item initially
  }

  /**
   * Gets all ingredients data
   * @returns {Array} Array of ingredient objects
   */
  getData() {
    const container = this.shadowRoot.querySelector('.list-items-container');
    const items = container.querySelectorAll(`.${this.itemClass}`);
    
    const ingredients = [];
    items.forEach(item => {
      const quantityInput = item.querySelector('.recipe-form__input--quantity');
      const unitInput = item.querySelector('.recipe-form__input--unit');
      const itemInput = item.querySelector('.recipe-form__input--item');
      
      const quantity = quantityInput ? quantityInput.value.trim() : '';
      const unit = unitInput ? unitInput.value.trim() : '';
      const ingredientItem = itemInput ? itemInput.value.trim() : '';
      
      // Only add if at least one field has content
      if (quantity || unit || ingredientItem) {
        ingredients.push({
          amount: quantity,
          unit: unit,
          item: ingredientItem
        });
      }
    });
    
    return ingredients;
  }

  /**
   * Populates the ingredients list with data
   * @param {Array} ingredients - Array of ingredient objects
   */
  populateData(ingredients) {
    if (!ingredients || !Array.isArray(ingredients)) return;
    
    const container = this.shadowRoot.querySelector('.list-items-container');
    
    // Clear existing items except first
    const existingItems = container.querySelectorAll(`.${this.itemClass}`);
    existingItems.forEach((item, index) => {
      if (index > 0) item.remove();
    });
    
    // Populate ingredients
    ingredients.forEach((ingredient, index) => {
      let item;
      
      if (index === 0) {
        // Use existing first item
        item = container.querySelector(`.${this.itemClass}`);
      } else {
        // Create new item
        const newItemDiv = document.createElement('div');
        newItemDiv.innerHTML = this.createListItem(true);
        item = newItemDiv.firstElementChild;
        container.appendChild(item);
      }
      
      // Populate the item fields
      if (item) {
        const quantityInput = item.querySelector('.recipe-form__input--quantity');
        const unitInput = item.querySelector('.recipe-form__input--unit');
        const itemInput = item.querySelector('.recipe-form__input--item');
        
        if (quantityInput) quantityInput.value = ingredient.amount || '';
        if (unitInput) unitInput.value = ingredient.unit || '';
        if (itemInput) itemInput.value = ingredient.item || '';
      }
    });
    
    // Update remove button state
    this.updateFirstItemRemoveButton();
    
    // Dispatch change event
    this.dispatchChangeEvent('data-populated');
  }

  /**
   * Clears all ingredients and resets to initial state
   */
  clearIngredients() {
    this.clearList();
  }

  /**
   * Gets ingredients data (alias for getData)
   * @returns {Array} Array of ingredient objects
   */
  getIngredients() {
    return this.getData();
  }

  /**
   * Populates ingredients (alias for populateData)
   * @param {Array} ingredients - Array of ingredient objects
   */
  populateIngredients(ingredients) {
    this.populateData(ingredients);
  }

  /**
   * Sets validation state for ingredient fields
   * @param {Object} errors - Validation errors object with ingredient field errors
   */
  setValidationState(errors) {
    // Clear all validation states first
    const inputs = this.shadowRoot.querySelectorAll('input');
    inputs.forEach(input => {
      input.classList.remove('recipe-form__input--invalid');
    });

    // Apply ingredient-specific validation errors
    if (errors && typeof errors === 'object') {
      Object.keys(errors).forEach(errorKey => {
        // Handle ingredient-specific errors like "ingredients[0].amount"
        const match = errorKey.match(/ingredients\[(\d+)\]\.(\w+)/);
        if (match) {
          const [, indexStr, field] = match;
          const index = parseInt(indexStr, 10);
          const container = this.shadowRoot.querySelector('.list-items-container');
          const items = container.querySelectorAll(`.${this.itemClass}`);
          
          if (items[index]) {
            // Map validation field names to actual CSS class names
            const fieldMapping = {
              amount: 'quantity',
              unit: 'unit', 
              item: 'item'
            };
            const cssClass = fieldMapping[field] || field;
            const input = items[index].querySelector(`.recipe-form__input--${cssClass}`);
            if (input) {
              input.classList.add('recipe-form__input--invalid');
            }
          }
        }
      });
    }
  }

  /**
   * Future enhancement: Add ingredient section
   * @param {string} sectionTitle - Title for the ingredient section
   */
  addSection(sectionTitle) {
    // Future implementation for ingredient sections
    console.log('addSection feature will be implemented in future enhancement:', sectionTitle);
  }
}

customElements.define('recipe-ingredients-list', RecipeIngredientsList);