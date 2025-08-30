/**
 * SectionedListComponent - Extended Dynamic List with Section Support
 * ------------------------------------------------------------------
 * Generic sectioned list component that extends DynamicListComponent 
 * to support both flat lists and grouped sections with dynamic mode switching.
 * 
 * Features:
 * - Dynamic mode switching between 'flat' and 'sectioned' modes
 * - Section management (add, remove, move sections)
 * - Data preservation during mode changes
 * - Event propagation through Shadow DOM
 * - Modern ES6+ features with proper lifecycle management
 * 
 * Data Formats:
 * - Flat mode: Simple array of items
 * - Sectioned mode: Object with sections containing arrays of items
 */

import { DynamicListComponent } from './dynamic-list-component.js';

export class SectionedListComponent extends DynamicListComponent {
  constructor() {
    super();
    
    // Mode configuration
    this.mode = this.getAttribute('mode') || 'flat'; // 'flat' | 'sectioned'
    this.sections = []; // Array of section objects: { title: string, items: array }
    this.flatData = []; // Backup of flat data when switching modes
    
    // Section-specific CSS classes
    this.sectionClass = 'sectioned-list-section';
    this.sectionHeaderClass = 'sectioned-list-section-header';
    this.sectionContentClass = 'sectioned-list-section-content';
    this.sectionTitleClass = 'sectioned-list-section-title';
    this.sectionControlsClass = 'sectioned-list-section-controls';
    this.addSectionButtonClass = 'sectioned-list-add-section-button';
    this.removeSectionButtonClass = 'sectioned-list-remove-section-button';
    this.moveSectionUpButtonClass = 'sectioned-list-move-section-up-button';
    this.moveSectionDownButtonClass = 'sectioned-list-move-section-down-button';
    
    // Override container class to include mode
    this.containerClass = `${this.containerClass} sectioned-list-${this.mode}`;
  }

  connectedCallback() {
    super.connectedCallback();
    this.initializeSectionData();
  }

  /**
   * Initialize section data based on current mode
   */
  initializeSectionData() {
    if (this.mode === 'sectioned' && this.sections.length === 0) {
      // Create default section if in sectioned mode
      this.sections = [{ title: 'Section 1', items: [] }];
    }
  }

  /**
   * Override template to include mode-specific controls
   */
  template() {
    const modeControls = this.createModeControls();
    const content = this.mode === 'sectioned' 
      ? this.createSectionedContent()
      : this.createFlatContent();

    return `
      <div class="${this.containerClass}">
        <div class="sectioned-list-header">
          <label class="recipe-form__label">${this.listTitle}</label>
          ${modeControls}
        </div>
        ${content}
        ${this.createAdditionalControls()}
      </div>
    `;
  }

  /**
   * Create mode switching controls
   */
  createModeControls() {
    return `
      <div class="sectioned-list-mode-controls">
        <button type="button" class="recipe-form__button sectioned-list-mode-button ${this.mode === 'flat' ? 'active' : ''}" data-mode="flat">
          Flat List
        </button>
        <button type="button" class="recipe-form__button sectioned-list-mode-button ${this.mode === 'sectioned' ? 'active' : ''}" data-mode="sectioned">
          Sectioned
        </button>
      </div>
    `;
  }

  /**
   * Create flat list content (delegates to parent)
   */
  createFlatContent() {
    return `
      <div class="list-items-container">
        ${this.createInitialItem()}
      </div>
    `;
  }

  /**
   * Create sectioned list content
   */
  createSectionedContent() {
    const sectionsHTML = this.sections.map((section, index) => 
      this.createSectionHTML(section, index)
    ).join('');

    return `
      <div class="sections-container">
        ${sectionsHTML}
        <button type="button" class="recipe-form__button ${this.addSectionButtonClass}">
          + Add Section
        </button>
      </div>
    `;
  }

  /**
   * Create HTML for a single section
   */
  createSectionHTML(section, sectionIndex) {
    const sectionItems = section.items.map((_, itemIndex) => 
      this.createSectionItem(sectionIndex, itemIndex, itemIndex > 0)
    ).join('') || this.createSectionItem(sectionIndex, 0, false);

    return `
      <div class="${this.sectionClass}" data-section-index="${sectionIndex}">
        <div class="${this.sectionHeaderClass}">
          <input type="text" 
                 class="recipe-form__input ${this.sectionTitleClass}" 
                 placeholder="Section Title" 
                 value="${section.title}"
                 data-section-index="${sectionIndex}">
          <div class="${this.sectionControlsClass}">
            <button type="button" class="recipe-form__button ${this.moveSectionUpButtonClass}" 
                    data-section-index="${sectionIndex}" ${sectionIndex === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="recipe-form__button ${this.moveSectionDownButtonClass}" 
                    data-section-index="${sectionIndex}" ${sectionIndex === this.sections.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="recipe-form__button ${this.removeSectionButtonClass}" 
                    data-section-index="${sectionIndex}" ${this.sections.length === 1 ? 'disabled' : ''}>×</button>
          </div>
        </div>
        <div class="${this.sectionContentClass}">
          ${sectionItems}
        </div>
      </div>
    `;
  }

  /**
   * Create a section item (similar to createListItem but with section context)
   */
  createSectionItem(sectionIndex, itemIndex, includeRemoveButton = true) {
    const fieldsHTML = this.itemFields.map(field => 
      `<input type="text" 
              class="recipe-form__input ${field.className || ''}" 
              placeholder="${field.placeholder}" 
              name="${field.name || ''}"
              data-section-index="${sectionIndex}"
              data-item-index="${itemIndex}">`
    ).join('');

    const removeButtonHTML = includeRemoveButton 
      ? `<button type="button" class="recipe-form__button ${this.removeButtonClass}" 
                 data-section-index="${sectionIndex}" data-item-index="${itemIndex}">-</button>`
      : '';

    return `
      <div class="${this.itemClass}" data-section-index="${sectionIndex}" data-item-index="${itemIndex}">
        ${fieldsHTML}
        <button type="button" class="recipe-form__button ${this.addButtonClass}" 
                data-section-index="${sectionIndex}" data-item-index="${itemIndex}">+</button>
        ${removeButtonHTML}
      </div>
    `;
  }

  /**
   * Override setupEventListeners to include section-specific events
   */
  setupEventListeners() {
    // Set up parent event listeners for flat mode
    super.setupEventListeners();
    
    // Set up mode switching events
    this.shadowRoot.addEventListener('click', (event) => {
      // Mode switching
      if (event.target.classList.contains('sectioned-list-mode-button')) {
        const newMode = event.target.dataset.mode;
        this.switchMode(newMode);
        return;
      }

      // Section management
      if (event.target.classList.contains(this.addSectionButtonClass)) {
        this.addSection();
        return;
      }

      if (event.target.classList.contains(this.removeSectionButtonClass)) {
        const sectionIndex = parseInt(event.target.dataset.sectionIndex, 10);
        this.removeSection(sectionIndex);
        return;
      }

      if (event.target.classList.contains(this.moveSectionUpButtonClass)) {
        const sectionIndex = parseInt(event.target.dataset.sectionIndex, 10);
        this.moveSection(sectionIndex, sectionIndex - 1);
        return;
      }

      if (event.target.classList.contains(this.moveSectionDownButtonClass)) {
        const sectionIndex = parseInt(event.target.dataset.sectionIndex, 10);
        this.moveSection(sectionIndex, sectionIndex + 1);
        return;
      }

      // Section item management (in sectioned mode)
      if (this.mode === 'sectioned') {
        if (event.target.classList.contains(this.addButtonClass)) {
          this.addSectionItem(event);
          return;
        }

        if (event.target.classList.contains(this.removeButtonClass)) {
          this.removeSectionItem(event);
          return;
        }
      }
    });

    // Section title changes
    this.shadowRoot.addEventListener('input', (event) => {
      if (event.target.classList.contains(this.sectionTitleClass)) {
        const sectionIndex = parseInt(event.target.dataset.sectionIndex, 10);
        this.updateSectionTitle(sectionIndex, event.target.value);
      }
    });
  }

  /**
   * Switch between flat and sectioned modes
   * @param {string} newMode - 'flat' or 'sectioned'
   */
  switchMode(newMode) {
    if (newMode === this.mode) return;

    // Preserve data during mode switch
    const currentData = this.getData();
    
    this.mode = newMode;
    
    // Robust class management using Set to prevent duplicates and handle spaces
    const classTokens = new Set(this.containerClass.split(/\s+/).filter(token => token.length > 0));
    
    // Remove any existing sectioned-list-* mode tokens
    for (const token of classTokens) {
      if (token.match(/^sectioned-list-\w+$/)) {
        classTokens.delete(token);
      }
    }
    
    classTokens.add(`sectioned-list-${this.mode}`);
    
    // Reconstruct class string
    this.containerClass = Array.from(classTokens).join(' ');

    // Re-render with new mode
    this.render();
    this.setupEventListeners();

    // Restore data in new mode
    this.populateData(currentData);

    // Dispatch mode change event
    this.dispatchChangeEvent('mode-switched', { mode: newMode, data: currentData });
  }

  /**
   * Switch to sectioned mode
   */
  switchToSectionedMode() {
    this.switchMode('sectioned');
  }

  /**
   * Switch to flat mode
   */
  switchToFlatMode() {
    this.switchMode('flat');
  }

  /**
   * Add a new section
   * @param {string} title - Optional title for the new section
   */
  addSection(title = '') {
    const newTitle = title || `Section ${this.sections.length + 1}`;
    this.sections.push({ title: newTitle, items: [] });
    
    // Re-render sections
    this.render();
    this.setupEventListeners();
    
    this.dispatchChangeEvent('section-added', { sectionIndex: this.sections.length - 1, title: newTitle });
  }

  /**
   * Remove a section by index
   * @param {number} index - Section index to remove
   */
  removeSection(index) {
    if (index < 0 || index >= this.sections.length || this.sections.length === 1) {
      return; // Can't remove if only one section or invalid index
    }

    const removedSection = this.sections.splice(index, 1)[0];
    
    // Re-render sections
    this.render();
    this.setupEventListeners();
    
    this.dispatchChangeEvent('section-removed', { sectionIndex: index, removedSection });
  }

  /**
   * Move a section from one position to another
   * @param {number} fromIndex - Current section index
   * @param {number} toIndex - Target section index
   */
  moveSection(fromIndex, toIndex) {
    if (fromIndex === toIndex || 
        fromIndex < 0 || fromIndex >= this.sections.length ||
        toIndex < 0 || toIndex >= this.sections.length) {
      return;
    }

    const [movedSection] = this.sections.splice(fromIndex, 1);
    this.sections.splice(toIndex, 0, movedSection);
    
    // Re-render sections
    this.render();
    this.setupEventListeners();
    
    this.dispatchChangeEvent('section-moved', { fromIndex, toIndex, section: movedSection });
  }

  /**
   * Update section title
   * @param {number} sectionIndex - Section index
   * @param {string} newTitle - New title
   */
  updateSectionTitle(sectionIndex, newTitle) {
    if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
      this.sections[sectionIndex].title = newTitle;
      this.dispatchChangeEvent('section-title-updated', { sectionIndex, title: newTitle });
    }
  }

  /**
   * Add item to a specific section
   * @param {Event} event - Click event from add button
   */
  addSectionItem(event) {
    const sectionIndex = parseInt(event.target.dataset.sectionIndex, 10);
    const itemIndex = parseInt(event.target.dataset.itemIndex, 10);
    
    if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
      // Add boundary check for itemIndex before calling splice
      const targetSection = this.sections[sectionIndex];
      const clampedItemIndex = Math.max(-1, Math.min(itemIndex, targetSection.items.length - 1));
      
      // Add empty item to section data
      targetSection.items.splice(clampedItemIndex + 1, 0, this.createEmptyItem());
      
      // Re-render the specific section
      this.renderSection(sectionIndex);
      
      this.dispatchChangeEvent('section-item-added', { sectionIndex, itemIndex: clampedItemIndex + 1 });
    }
  }

  /**
   * Remove item from a specific section
   * @param {Event} event - Click event from remove button
   */
  removeSectionItem(event) {
    const sectionIndex = parseInt(event.target.dataset.sectionIndex, 10);
    const itemIndex = parseInt(event.target.dataset.itemIndex, 10);
    
    if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
      const section = this.sections[sectionIndex];
      if (section.items.length > 1) {
        section.items.splice(itemIndex, 1);
        
        // Re-render the specific section
        this.renderSection(sectionIndex);
        
        this.dispatchChangeEvent('section-item-removed', { sectionIndex, itemIndex });
      }
    }
  }

  /**
   * Re-render a specific section
   * @param {number} sectionIndex - Index of section to re-render
   */
  renderSection(sectionIndex) {
    const sectionElement = this.shadowRoot.querySelector(`[data-section-index="${sectionIndex}"]`);
    if (sectionElement && sectionIndex < this.sections.length) {
      const newSectionHTML = this.createSectionHTML(this.sections[sectionIndex], sectionIndex);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newSectionHTML;
      sectionElement.replaceWith(tempDiv.firstElementChild);
    }
  }

  /**
   * Create empty item structure (to be overridden by extending classes)
   * @returns {Object} Empty item object
   */
  createEmptyItem() {
    const emptyItem = {};
    this.itemFields.forEach(field => {
      emptyItem[field.name] = '';
    });
    return emptyItem;
  }

  /**
   * Override getData to handle both modes
   * @returns {Array|Object} Data in appropriate format for current mode
   */
  getData() {
    if (this.mode === 'flat') {
      return this.getFlatData();
    } else {
      return this.getSectionedData();
    }
  }

  /**
   * Get data in flat format
   * @returns {Array} Flat array of items
   */
  getFlatData() {
    const container = this.shadowRoot.querySelector('.list-items-container');
    if (!container) return [];

    const items = container.querySelectorAll(`.${this.itemClass}`);
    const data = [];
    
    items.forEach(item => {
      const itemData = this.extractItemData(item);
      if (this.isValidItem(itemData)) {
        data.push(itemData);
      }
    });
    
    return data;
  }

  /**
   * Get data in sectioned format
   * @returns {Object} Object with sections containing arrays of items
   */
  getSectionedData() {
    const sectionsContainer = this.shadowRoot.querySelector('.sections-container');
    if (!sectionsContainer) return { sections: [] };

    const result = { sections: [] };
    
    this.sections.forEach((sectionMeta, sectionIndex) => {
      const sectionElement = sectionsContainer.querySelector(`[data-section-index="${sectionIndex}"]`);
      if (sectionElement) {
        const titleInput = sectionElement.querySelector(`.${this.sectionTitleClass}`);
        const sectionTitle = titleInput ? titleInput.value.trim() : sectionMeta.title;
        
        const items = sectionElement.querySelectorAll(`.${this.itemClass}`);
        const sectionItems = [];
        
        items.forEach(item => {
          const itemData = this.extractItemData(item);
          if (this.isValidItem(itemData)) {
            sectionItems.push(itemData);
          }
        });
        
        result.sections.push({
          title: sectionTitle,
          items: sectionItems
        });
      }
    });
    
    return result;
  }

  /**
   * Extract item data from DOM element (to be overridden by extending classes)
   * @param {Element} itemElement - DOM element containing item inputs
   * @returns {Object} Item data object
   */
  extractItemData(itemElement) {
    const itemData = {};
    this.itemFields.forEach(field => {
      const input = itemElement.querySelector(`.${field.className}`);
      if (input) {
        itemData[field.name] = input.value.trim();
      }
    });
    return itemData;
  }

  /**
   * Check if item data is valid (has at least one non-empty field)
   * @param {Object} itemData - Item data object
   * @returns {boolean} Whether item is valid
   */
  isValidItem(itemData) {
    return Object.values(itemData).some(value => value !== '');
  }

  /**
   * Override populateData to handle both modes
   * @param {Array|Object} data - Data to populate
   */
  populateData(data) {
    if (this.mode === 'flat') {
      this.populateFlatData(Array.isArray(data) ? data : []);
    } else {
      this.populateSectionedData(data && data.sections ? data : { sections: [] });
    }
  }

  /**
   * Populate flat mode data
   * @param {Array} data - Flat array of items
   */
  populateFlatData(data) {
    if (!Array.isArray(data)) return;

    const container = this.shadowRoot.querySelector('.list-items-container');
    if (!container) return;

    // Clear existing items except first
    const existingItems = container.querySelectorAll(`.${this.itemClass}`);
    existingItems.forEach((item, index) => {
      if (index > 0) item.remove();
    });

    // Populate items
    data.forEach((itemData, index) => {
      let itemElement;
      
      if (index === 0) {
        // Use existing first item
        itemElement = container.querySelector(`.${this.itemClass}`);
      } else {
        // Create new item
        const newItemDiv = document.createElement('div');
        newItemDiv.innerHTML = this.createListItem(true);
        itemElement = newItemDiv.firstElementChild;
        container.appendChild(itemElement);
      }
      
      // Populate the item fields
      this.populateItemData(itemElement, itemData);
    });

    // Update remove button state
    this.updateFirstItemRemoveButton();
    this.dispatchChangeEvent('flat-data-populated');
  }

  /**
   * Populate sectioned mode data
   * @param {Object} data - Object with sections array
   */
  populateSectionedData(data) {
    if (!data || !data.sections || !Array.isArray(data.sections)) {
      data = { sections: [{ title: 'Section 1', items: [] }] };
    }

    // Update sections array
    this.sections = data.sections.map(section => ({
      title: section.title || 'Untitled Section',
      items: section.items || []
    }));

    // Re-render with new data
    this.render();
    this.setupEventListeners();
    
    this.dispatchChangeEvent('sectioned-data-populated');
  }

  /**
   * Populate individual item data
   * @param {Element} itemElement - DOM element to populate
   * @param {Object} itemData - Data object to populate from
   */
  populateItemData(itemElement, itemData) {
    this.itemFields.forEach(field => {
      const input = itemElement.querySelector(`.${field.className}`);
      if (input && itemData[field.name] !== undefined) {
        input.value = itemData[field.name];
      }
    });
  }

  /**
   * Override dispatchChangeEvent to include mode information
   * @param {string} action - The action that occurred
   * @param {Object} additionalData - Additional event data
   */
  dispatchChangeEvent(action, additionalData = {}) {
    this.dispatchEvent(new CustomEvent('sectioned-list-changed', {
      bubbles: true,
      composed: true,
      detail: { 
        action, 
        mode: this.mode,
        data: this.getData(),
        ...additionalData 
      }
    }));
  }

  /**
   * Override clearList to handle both modes
   */
  clearList() {
    if (this.mode === 'flat') {
      super.clearList();
    } else {
      // Reset to single empty section
      this.sections = [{ title: 'Section 1', items: [] }];
      this.render();
      this.setupEventListeners();
    }
    
    this.dispatchChangeEvent('list-cleared');
  }

  /**
   * Override setValidationState to handle both modes
   * @param {Object} errors - Validation errors object
   */
  setValidationState(errors) {
    // Clear all validation states first
    const inputs = this.shadowRoot.querySelectorAll('input');
    inputs.forEach(input => {
      input.classList.remove('recipe-form__input--invalid');
    });

    if (!errors || typeof errors !== 'object') return;

    Object.keys(errors).forEach(errorKey => {
      if (this.mode === 'flat') {
        this.applyFlatValidationError(errorKey, errors[errorKey]);
      } else {
        this.applySectionedValidationError(errorKey, errors[errorKey]);
      }
    });
  }

  /**
   * Apply validation error in flat mode
   * @param {string} errorKey - Error key
   * @param {*} _errorValue - Error value (unused in base implementation)
   */
  applyFlatValidationError(errorKey, _errorValue) {
    // Handle flat validation errors (similar to parent implementation)
    // Override in extending classes for specific error handling
    console.debug('Flat validation error for key:', errorKey);
  }

  /**
   * Apply validation error in sectioned mode
   * @param {string} errorKey - Error key
   * @param {*} _errorValue - Error value (unused in base implementation)
   */
  applySectionedValidationError(errorKey, _errorValue) {
    // Handle sectioned validation errors like "sections[0].items[1].fieldName"
    const match = errorKey.match(/sections\[(\d+)\]\.items\[(\d+)\]\.(\w+)/);
    if (match) {
      const [, sectionIndexStr, itemIndexStr, fieldName] = match;
      const sectionIndex = parseInt(sectionIndexStr, 10);
      const itemIndex = parseInt(itemIndexStr, 10);
      
      const sectionElement = this.shadowRoot.querySelector(`[data-section-index="${sectionIndex}"]`);
      if (sectionElement) {
        const itemElement = sectionElement.querySelector(`[data-item-index="${itemIndex}"]`);
        if (itemElement) {
          const field = this.itemFields.find(f => f.name === fieldName);
          if (field) {
            const input = itemElement.querySelector(`.${field.className}`);
            if (input) {
              input.classList.add('recipe-form__input--invalid');
            }
          }
        }
      }
    }
  }

  /**
   * Get current mode
   * @returns {string} Current mode ('flat' or 'sectioned')
   */
  getMode() {
    return this.mode;
  }

  /**
   * Check if component is in sectioned mode
   * @returns {boolean} Whether in sectioned mode
   */
  isSectionedMode() {
    return this.mode === 'sectioned';
  }

  /**
   * Check if component is in flat mode
   * @returns {boolean} Whether in flat mode
   */
  isFlatMode() {
    return this.mode === 'flat';
  }

  /**
   * Get sections data (only available in sectioned mode)
   * @returns {Array} Array of section objects
   */
  getSections() {
    return this.mode === 'sectioned' ? [...this.sections] : [];
  }
}