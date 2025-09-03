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
    
    // Track current mode (simple or sections)
    this.isSectionMode = false;
    this.sections = []; // Array of {title, items}
  }

  /**
   * Override template to add section controls
   */
  template() {
    return `
      <div class="${this.containerClass}">
        <label class="recipe-form__label">${this.listTitle}</label>
        <div id="ingredients-container" class="recipe-form__ingredients-list">
          ${this.createInitialItem()}
        </div>
        <button type="button" id="add-section" class="recipe-form__button recipe-form__button--add-section">הוסף קטגוריה</button>
      </div>
    `;
  }

  createInitialItem() {
    return this.createListItem(false); // No remove button for first item initially
  }

  /**
   * Override setupEventListeners to handle both regular list and section events
   */
  setupEventListeners() {
    // Set up event listeners for the ingredients container
    const container = this.shadowRoot.querySelector('#ingredients-container');
    
    if (container) {
      // Create stable bound handler for simple mode
      this._ingredientsContainerHandler = (event) => {
        if (event.target.classList.contains(this.addButtonClass)) {
          this.addIngredientItem(event);
        } else if (event.target.classList.contains(this.removeButtonClass)) {
          this.removeIngredientItem(event);
        }
      };
      
      // Handle add/remove ingredient button clicks (for simple mode)
      container.addEventListener('click', this._ingredientsContainerHandler);
    }
    
    // Handle "Add Section" button and section management
    this.shadowRoot.addEventListener('click', (event) => {
      if (event.target.id === 'add-section') {
        this.transformToSectionMode();
      } else if (event.target.classList.contains('recipe-form__button--remove-section')) {
        this.removeSection(event);
      }
    });
  }

  /**
   * Gets all ingredients data (returns appropriate format based on mode)
   * @returns {Array} Array of ingredient objects or ingredient sections
   */
  getData() {
    if (this.isSectionMode) {
      return this.getSectionsData();
    } else {
      return this.getSimpleIngredients();
    }
  }

  /**
   * Get current ingredients data (alias for getData)
   */
  getIngredients() {
    return this.getData();
  }

  /**
   * Get simple ingredients array
   */
  getSimpleIngredients() {
    const ingredientsContainer = this.shadowRoot.querySelector('#ingredients-container');
    const items = ingredientsContainer.querySelectorAll(`.${this.itemClass}`);
    
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
   * Get sections data
   */
  getSectionsData() {
    const sectionContainers = this.shadowRoot.querySelectorAll('.recipe-form__ingredient-sections[data-section-index]');
    const sections = [];
    
    sectionContainers.forEach((container) => {
      const sectionIndex = parseInt(container.dataset.sectionIndex, 10);
      const sectionNameInput = container.querySelector('.recipe-form__input--section-name');
      const sectionTitle = sectionNameInput ? sectionNameInput.value.trim() : `קטגוריה ${sectionIndex + 1}`;
      
      // Get ingredient items in this section
      const items = Array.from(
        container.querySelectorAll(':scope > .recipe-form__ingredient-entry')
      ).map(item => {
        const quantityInput = item.querySelector('.recipe-form__input--quantity');
        const unitInput = item.querySelector('.recipe-form__input--unit');
        const itemInput = item.querySelector('.recipe-form__input--item');
        
        const quantity = quantityInput ? quantityInput.value.trim() : '';
        const unit = unitInput ? unitInput.value.trim() : '';
        const ingredientItem = itemInput ? itemInput.value.trim() : '';
        
        return { amount: quantity, unit: unit, item: ingredientItem };
      }).filter(item => item.amount || item.unit || item.item);
      
      if (items.length > 0 || sectionTitle !== `קטגוריה ${sectionIndex + 1}`) {
        sections.push({ title: sectionTitle, items });
      }
    });
    
    return sections;
  }

  /**
   * Populates ingredients data
   */
  populateIngredients(data) {
    if (Array.isArray(data)) {
      // Basic ingredients array
      this.populateSimpleIngredients(data);
    } else if (data && data.ingredientSections) {
      // Sectioned ingredients format
      this.populateSectionsData(data.ingredientSections);
    }
  }

  /**
   * Override populateData
   */
  populateData(data) {
    this.populateIngredients(data);
  }

  /**
   * Populate simple ingredients
   */
  populateSimpleIngredients(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) return;
    
    // Ensure we're in simple mode
    if (this.isSectionMode) {
      this.transformToSimpleMode();
    }
    
    const ingredientsContainer = this.shadowRoot.querySelector('#ingredients-container');
    
    // Clear existing and create ingredients
    ingredientsContainer.innerHTML = '';
    
    ingredients.forEach((ingredient, index) => {
      const includeRemove = index > 0 || ingredients.length > 1;
      const itemHTML = this.createIngredientItemHTML(ingredient, includeRemove);
      ingredientsContainer.insertAdjacentHTML('beforeend', itemHTML);
    });
  }

  /**
   * Populate sections data
   */
  populateSectionsData(sections) {
    if (!Array.isArray(sections) || sections.length === 0) return;
    
    this.sections = sections.map(section => ({
      title: section.title || '',
      items: section.items || []
    }));
    
    // Always transform to section mode when explicitly using sectioned data
    // This ensures sectioned format is respected even with single sections
    this.isSectionMode = true;
    this.renderSectionMode();
  }

  /**
   * Clears all ingredients and resets to initial state
   */
  clearIngredients() {
    this.clearList();
  }

  /**
   * Legacy method: Gets ingredients data (alias for getData)
   * @returns {Array} Array of ingredient objects
   */
  getIngredients() {
    return this.getData();
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
   * Create HTML for ingredient item
   */
  createIngredientItemHTML(ingredient, includeRemove) {
    const escapedQuantity = (ingredient.amount || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const escapedUnit = (ingredient.unit || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const escapedItem = (ingredient.item || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    const removeButtonHTML = includeRemove 
      ? `<button type="button" class="recipe-form__button recipe-form__button--remove-ingredient">-</button>`
      : '';

    return `
      <div class="${this.itemClass}">
        <input type="text" class="recipe-form__input recipe-form__input--quantity" 
               placeholder="כמות" name="quantity" value="${escapedQuantity}">
        <input type="text" class="recipe-form__input recipe-form__input--unit" 
               placeholder="יחידה" name="unit" value="${escapedUnit}">
        <input type="text" class="recipe-form__input recipe-form__input--item" 
               placeholder="פריט" name="item" value="${escapedItem}">
        <button type="button" class="recipe-form__button recipe-form__button--add-ingredient">+</button>
        ${removeButtonHTML}
      </div>
    `;
  }

  /**
   * Transform to section mode (creates multiple sections)
   */
  transformToSectionMode() {
    if (this.isSectionMode) {
      // Already in section mode, just add a new section
      this.updateSectionsFromDOM();
      this.sections.push({ title: '', items: [{ amount: '', unit: '', item: '' }] });
      this.renderSectionMode();
      this.dispatchChangeEvent('section-added');
      return;
    }
    
    // Collect current ingredients from simple mode
    const currentIngredients = this.getSimpleIngredients();
    
    // Convert to section mode with first section containing current ingredients
    this.isSectionMode = true;
    
    // Ensure we have at least one ingredient in the first section
    const firstSectionItems = currentIngredients.length > 0 ? currentIngredients : [{ amount: '', unit: '', item: '' }];
    
    this.sections = [
      { title: '', items: firstSectionItems },
      { title: '', items: [{ amount: '', unit: '', item: '' }] }  // Second section starts empty
    ];
    
    // Re-render in section mode
    this.renderSectionMode();
    
    this.dispatchChangeEvent('transformed-to-section-mode');
  }

  /**
   * Transform back to simple mode (single ingredient list)
   */
  transformToSimpleMode() {
    if (!this.isSectionMode) return;
    
    // First update sections from DOM to get latest values
    this.updateSectionsFromDOM();
    
    // Collect all ingredients from all sections, filtering out empty ones
    const allIngredients = this.sections.flatMap(section => 
      section.items.filter(item => item.amount || item.unit || item.item)
    );
    
    // Convert back to simple mode
    this.isSectionMode = false;
    this.sections = [];
    
    // Re-render in simple mode
    this.renderSimpleMode();
    
    // Populate with collected ingredients
    if (allIngredients.length > 0) {
      this.populateSimpleIngredients(allIngredients);
    }
  }

  /**
   * Render in section mode (multiple sections)
   */
  renderSectionMode() {
    const ingredientsContainer = this.shadowRoot.querySelector('#ingredients-container');
    const addSectionButton = this.shadowRoot.querySelector('#add-section');
    
    // Clear existing content
    ingredientsContainer.innerHTML = '';
    
    // Create sections
    this.sections.forEach((section, index) => {
      const sectionDiv = this.createSectionHTML(section, index);
      ingredientsContainer.insertAdjacentHTML('beforeend', sectionDiv);
    });
    
    // Update add section button text
    addSectionButton.textContent = 'הוסף קטגוריה';
    
    // Re-setup event listeners for section mode
    this.setupSectionEventListeners();
  }

  /**
   * Render in simple mode (single ingredient list)
   */
  renderSimpleMode() {
    const ingredientsContainer = this.shadowRoot.querySelector('#ingredients-container');
    const addSectionButton = this.shadowRoot.querySelector('#add-section');
    
    // Clear existing content
    ingredientsContainer.innerHTML = this.createInitialItem();
    
    // Reset add section button
    addSectionButton.textContent = 'הוסף קטגוריה';
    
    // Reset event listeners to simple mode
    this.setupSimpleEventListeners();
  }

  /**
   * Create HTML for a single section
   */
  createSectionHTML(section, sectionIndex) {
    const sectionNumber = sectionIndex + 1;
    const items = section.items || [];
    
    // Create ingredient items
    const ingredientItems = items.map((ingredient, index) => {
      const includeRemove = index > 0 || items.length > 1;
      return this.createIngredientItemHTML(ingredient, includeRemove);
    }).join('');
    
    // If no items, create empty one
    const content = ingredientItems || this.createIngredientItemHTML({ amount: '', unit: '', item: '' }, false);

    const removeSectionButton = this.sections.length > 1 
      ? `<button type="button" class="recipe-form__button recipe-form__button--remove-section">-</button>`
      : '';

    // Escape section title
    const escapedSectionTitle = (section.title || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    return `
      <div class="recipe-form__ingredient-sections" data-section-index="${sectionIndex}">
        <div class="recipe-form__stage-header">
          <h3 class="recipe-form__stage-title">קטגוריה ${sectionNumber}</h3>
          ${removeSectionButton}
        </div>
        <input type="text" class="recipe-form__input recipe-form__input--section-name" 
               placeholder="שם הקטגוריה (אופציונלי)" value="${escapedSectionTitle}">
        ${content}
      </div>
    `;
  }

  /**
   * Update sections data from current DOM state
   */
  updateSectionsFromDOM() {
    if (!this.isSectionMode) return;
    
    const sectionContainers = this.shadowRoot.querySelectorAll('.recipe-form__ingredient-sections[data-section-index]');
    
    sectionContainers.forEach((container) => {
      const sectionIndex = parseInt(container.dataset.sectionIndex, 10);
      
      // Only update if this section exists in our data
      if (this.sections[sectionIndex]) {
        const sectionNameInput = container.querySelector('.recipe-form__input--section-name');
        const sectionTitle = sectionNameInput ? sectionNameInput.value.trim() : '';
        
        // Get ingredient items in this section
        const items = Array.from(
          container.querySelectorAll(':scope > .recipe-form__ingredient-entry')
        ).map(item => {
          const quantityInput = item.querySelector('.recipe-form__input--quantity');
          const unitInput = item.querySelector('.recipe-form__input--unit');
          const itemInput = item.querySelector('.recipe-form__input--item');
          
          return {
            amount: quantityInput ? quantityInput.value.trim() : '',
            unit: unitInput ? unitInput.value.trim() : '',
            item: itemInput ? itemInput.value.trim() : ''
          };
        });
        
        this.sections[sectionIndex] = {
          title: sectionTitle || this.sections[sectionIndex].title,
          items: items.length > 0 ? items : [{ amount: '', unit: '', item: '' }] // Ensure at least one empty item
        };
      }
    });
  }

  /**
   * Setup event listeners for section mode
   */
  setupSectionEventListeners() {
    const ingredientsContainer = this.shadowRoot.querySelector('#ingredients-container');
    
    if (ingredientsContainer) {
      // Remove existing listeners properly
      if (this._ingredientsContainerHandler) {
        ingredientsContainer.removeEventListener('click', this._ingredientsContainerHandler);
      }
      
      // Create stable bound handler for section mode
      this._ingredientsContainerHandler = (event) => {
        if (event.target.classList.contains(this.addButtonClass)) {
          this.addSectionIngredientItem(event);
        } else if (event.target.classList.contains(this.removeButtonClass)) {
          this.removeSectionIngredientItem(event);
        }
      };
      
      // Attach handler to existing container (DO NOT replace/clone to preserve populated data)
      ingredientsContainer.addEventListener('click', this._ingredientsContainerHandler);
    }
  }

  /**
   * Setup event listeners for simple mode
   */
  setupSimpleEventListeners() {
    const ingredientsContainer = this.shadowRoot.querySelector('#ingredients-container');
    
    if (ingredientsContainer) {
      // Remove existing listeners properly
      if (this._ingredientsContainerHandler) {
        ingredientsContainer.removeEventListener('click', this._ingredientsContainerHandler);
      }
      
      // Create stable bound handler for simple mode
      this._ingredientsContainerHandler = (event) => {
        if (event.target.classList.contains(this.addButtonClass)) {
          this.addIngredientItem(event);
        } else if (event.target.classList.contains(this.removeButtonClass)) {
          this.removeIngredientItem(event);
        }
      };
      
      // Attach handler to container
      ingredientsContainer.addEventListener('click', this._ingredientsContainerHandler);
    }
  }

  /**
   * Add ingredient item (for simple mode)
   */
  addIngredientItem(event) {
    const clickedButton = event.target;
    const currentItem = clickedButton.closest('.recipe-form__ingredient-entry');

    // Create new item with remove button
    const newItemHTML = this.createIngredientItemHTML({ amount: '', unit: '', item: '' }, true);
    const newItemDiv = document.createElement('div');
    newItemDiv.innerHTML = newItemHTML;
    const newItem = newItemDiv.firstElementChild;

    // Insert after current item
    if (currentItem.nextSibling) {
      currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
    } else {
      currentItem.parentNode.appendChild(newItem);
    }

    // Add remove button to first item if it doesn't have one
    this.updateFirstItemRemoveButton();

    // Dispatch change event
    this.dispatchChangeEvent('ingredient-added');
  }

  /**
   * Remove ingredient item (for simple mode)
   */
  removeIngredientItem(event) {
    const itemToRemove = event.target.closest('.recipe-form__ingredient-entry');
    
    itemToRemove.remove();

    // Remove remove button from first item if only one remains
    this.updateFirstItemRemoveButton();

    // Dispatch change event
    this.dispatchChangeEvent('ingredient-removed');
  }

  /**
   * Add ingredient item within a section
   */
  addSectionIngredientItem(event) {
    const clickedButton = event.target;
    const currentItem = clickedButton.closest('.recipe-form__ingredient-entry');
    const sectionContainer = clickedButton.closest('.recipe-form__ingredient-sections');
    const sectionIndex = parseInt(sectionContainer.dataset.sectionIndex, 10);

    // Create new item with remove button
    const newItemHTML = this.createIngredientItemHTML({ amount: '', unit: '', item: '' }, true);
    const newItemDiv = document.createElement('div');
    newItemDiv.innerHTML = newItemHTML;
    const newItem = newItemDiv.firstElementChild;

    // Insert after current item
    if (currentItem.nextSibling) {
      currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
    } else {
      currentItem.parentNode.appendChild(newItem);
    }

    // Update the sections data
    if (this.sections[sectionIndex]) {
      this.sections[sectionIndex].items.push({ amount: '', unit: '', item: '' });
    }

    // Ensure first item in section has remove button if needed
    this.updateSectionFirstItemRemoveButton(sectionContainer);

    // Dispatch change event
    this.dispatchChangeEvent('section-ingredient-added');
  }

  /**
   * Remove ingredient item within a section
   */
  removeSectionIngredientItem(event) {
    const itemToRemove = event.target.closest('.recipe-form__ingredient-entry');
    const sectionContainer = itemToRemove.closest('.recipe-form__ingredient-sections');
    const sectionIndex = parseInt(sectionContainer.dataset.sectionIndex, 10);
    
    // Find item index within section
    const sectionItems = Array.from(sectionContainer.querySelectorAll('.recipe-form__ingredient-entry'));
    const itemIndex = sectionItems.indexOf(itemToRemove);

    itemToRemove.remove();

    // Update the sections data
    if (this.sections[sectionIndex] && this.sections[sectionIndex].items[itemIndex] !== undefined) {
      this.sections[sectionIndex].items.splice(itemIndex, 1);
    }

    // Update first item remove button for this section
    this.updateSectionFirstItemRemoveButton(sectionContainer);

    // Dispatch change event
    this.dispatchChangeEvent('section-ingredient-removed');
  }

  /**
   * Update first item remove button within a specific section
   */
  updateSectionFirstItemRemoveButton(sectionContainer) {
    const items = sectionContainer.querySelectorAll('.recipe-form__ingredient-entry');
    const firstItem = items[0];

    if (!firstItem) return;

    if (items.length === 1) {
      // Remove the remove button from first item
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-ingredient');
      if (removeButton) removeButton.remove();
    } else if (items.length > 1) {
      // Add remove button to first item if it doesn't have one
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-ingredient');
      if (!removeButton) {
        const newRemoveButton = document.createElement('button');
        newRemoveButton.type = 'button';
        newRemoveButton.className = 'recipe-form__button recipe-form__button--remove-ingredient';
        newRemoveButton.textContent = '-';
        firstItem.appendChild(newRemoveButton);
      }
    }
  }

  /**
   * Remove a section
   */
  removeSection(event) {
    // First update sections data from DOM
    this.updateSectionsFromDOM();
    
    const sectionDiv = event.target.closest('.recipe-form__ingredient-sections');
    const sectionIndex = parseInt(sectionDiv.dataset.sectionIndex, 10);
    
    if (this.sections.length <= 1) return; // Can't remove last section
    
    this.sections.splice(sectionIndex, 1);
    
    // If only one section left, transform back to simple mode
    if (this.sections.length === 1) {
      this.transformToSimpleMode();
    } else {
      this.renderSectionMode();
    }
    
    this.dispatchChangeEvent('section-removed');
  }

  /**
   * Override updateFirstItemRemoveButton to work with our container
   */
  updateFirstItemRemoveButton() {
    const container = this.shadowRoot.querySelector('#ingredients-container');
    const items = container.querySelectorAll('.recipe-form__ingredient-entry');
    const firstItem = items[0];

    if (!firstItem) return;

    if (items.length === 1) {
      // Remove the remove button from first item
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-ingredient');
      if (removeButton) removeButton.remove();
    } else if (items.length > 1) {
      // Add remove button to first item if it doesn't have one
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-ingredient');
      if (!removeButton) {
        const newRemoveButton = document.createElement('button');
        newRemoveButton.type = 'button';
        newRemoveButton.className = 'recipe-form__button recipe-form__button--remove-ingredient';
        newRemoveButton.textContent = '-';
        firstItem.appendChild(newRemoveButton);
      }
    }
  }

  /**
   * Override dispatchChangeEvent for ingredients
   */
  dispatchChangeEvent(action, additionalData = {}) {
    this.dispatchEvent(new CustomEvent('ingredients-changed', {
      bubbles: true,
      composed: true,
      detail: { 
        action, 
        data: this.getData(),
        isSectionMode: this.isSectionMode,
        ...additionalData 
      }
    }));
  }

  /**
   * Clear ingredients
   */
  clearIngredients() {
    this.isSectionMode = false;
    this.sections = [];
    this.renderSimpleMode();
    
    // Clear the inputs
    const inputs = this.shadowRoot.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
      input.value = '';
    });
  }
}

customElements.define('recipe-ingredients-list', RecipeIngredientsList);