/**
 * RecipeInstructionsList Component
 * --------------------------------
 * Specialized sectioned list component for managing recipe instructions.
 * Extends SectionedListComponent to provide single-field instructions (instruction text).
 * Can transform between simple instructions and stage-based instructions.
 */

import { SectionedListComponent } from './sectioned-list-component.js';

class RecipeInstructionsList extends SectionedListComponent {
  constructor() {
    super();
    
    // Configure for Hebrew instructions (matching existing styles exactly)
    this.listTitle = this.getAttribute('title') || 'תהליך הכנה:';
    this.containerClass = 'recipe-form__stages';
    this.itemClass = 'recipe-form__step';
    this.addButtonClass = 'recipe-form__button--add-step';
    this.removeButtonClass = 'recipe-form__button--remove-step';
    
    // Configure sectioned list terminology for instructions
    this.sectionTitlePrefix = 'שלב';
    this.addSectionButtonText = 'הוסף שלב';
    this.sectionNamePlaceholder = 'שם השלב';
  }

  /**
   * Creates HTML for a single instruction item
   * @param {Object} instruction - The instruction data
   * @param {boolean} includeRemove - Whether to include remove button
   * @returns {string} HTML for the instruction item
   */
  createListItemHTML(instruction, includeRemove) {
    const escapedInstruction = (instruction.text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const removeButtonHTML = includeRemove
      ? `<button type="button" class="recipe-form__button ${this.removeButtonClass}">-</button>`
      : '';

    return `
      <fieldset class="${this.itemClass}">
        <input type="text" name="steps" class="recipe-form__input" value="${escapedInstruction}">
        <button type="button" class="recipe-form__button ${this.addButtonClass}">+</button>
        ${removeButtonHTML}
      </fieldset>
    `;
  }

  /**
   * Extracts data from an instruction DOM element
   * @param {HTMLElement} itemElement - The instruction element
   * @returns {Object} The instruction data
   */
  getItemData(itemElement) {
    const textInput = itemElement.querySelector('input[name="steps"]');
    return {
      text: textInput ? textInput.value.trim() : ''
    };
  }

  /**
   * Returns initial empty instruction structure
   * @returns {Array} Array with single empty instruction
   */
  getInitialItems() {
    return [{ text: '' }];
  }

  /**
   * Checks if an instruction item has content
   * @param {Object} itemData - The instruction data
   * @returns {boolean} True if instruction has text
   */
  isItemPopulated(itemData) {
    return itemData.text && itemData.text.trim() !== '';
  }

  /**
   * Validates individual instruction fields
   * @param {Object} item - Instruction item to validate
   * @returns {Object} Object with field names as keys for invalid fields
   */
  validateItemFields(item) {
    const errors = {};
    
    if (!item.text || !item.text.trim()) {
      errors.text = true;
    }
    
    return errors;
  }

  /**
   * Override validateBasicMode to provide instruction-specific messages
   * @returns {Object} Validation result
   */
  validateBasicMode() {
    const errors = {};
    let isValid = true;

    const container = this.shadowRoot.querySelector('#items-container');
    const itemElements = container.querySelectorAll(`.${this.itemClass}`);
    const allItems = Array.from(itemElements).map(element => this.getItemData(element));
    const populatedItems = allItems.filter(item => this.isItemPopulated(item));

    // If no instructions filled at all, highlight ALL visible instruction fields
    if (populatedItems.length === 0) {
      allItems.forEach((item, index) => {
        const fieldNames = Object.keys(item);
        fieldNames.forEach(field => {
          errors[`items[${index}].${field}`] = true;
        });
      });
      errors.instructions = 'חובה למלא תהליך הכנה.';
      isValid = false;
    } else {
      // Validate only populated items - check for missing fields in partially filled instructions
      allItems.forEach((item, index) => {
        if (this.isItemPopulated(item)) {
          const itemErrors = this.validateItemFields(item);
          if (Object.keys(itemErrors).length > 0) {
            Object.keys(itemErrors).forEach(field => {
              errors[`items[${index}].${field}`] = true;
            });
            errors.instructions = 'חובה למלא תהליך הכנה.';
            isValid = false;
          }
        }
      });
    }

    return { isValid, errors };
  }

  /**
   * Override validateSectionMode to provide instruction-specific messages
   * @returns {Object} Validation result
   */
  validateSectionMode() {
    this.updateSectionsFromDOM();
    const errors = {};
    let isValid = true;

    if (this.sections.length < 2) {
      errors.instructions = 'חובה למלא לפחות 2 שלבים.';
      isValid = false;
      return { isValid, errors };
    }

    let sectionsWithTitles = 0;
    let sectionsWithInstructions = 0;
    let totalInstructions = 0;

    // Count sections with filled titles and instructions
    this.sections.forEach((section) => {
      const sectionTitle = section.title?.trim();
      
      if (sectionTitle) {
        sectionsWithTitles++;
      }

      const populatedItems = section.items.filter(item => this.isItemPopulated(item));
      totalInstructions += populatedItems.length;

      if (populatedItems.length > 0) {
        sectionsWithInstructions++;
      }
    });

    // If no instructions at all, highlight only first 2 section titles and their instruction fields
    if (totalInstructions === 0) {
      // Only validate and highlight first 2 sections
      for (let i = 0; i < Math.min(2, this.sections.length); i++) {
        // Highlight section title
        errors[`sections[${i}].title`] = true;
        
        // Highlight all instruction fields in this section
        this.sections[i].items.forEach((_, itemIndex) => {
          errors[`sections[${i}].items[${itemIndex}].text`] = true;
        });
      }
      errors.instructions = 'חובה למלא לפחות 2 שלבים.';
      isValid = false;
      return { isValid, errors };
    }

    // If we have instructions, validate according to the new rules
    // Rule: Must have at least 2 section titles filled (only validate first 2 sections)
    if (sectionsWithTitles < 2) {
      // Not enough section titles - highlight empty section titles in first 2 sections only
      for (let i = 0; i < Math.min(2, this.sections.length); i++) {
        const sectionTitle = this.sections[i].title?.trim();
        if (!sectionTitle) {
          errors[`sections[${i}].title`] = true;
        }
      }
      errors.instructions = 'חובה למלא לפחות 2 שלבים.';
      isValid = false;
    } else {
      // We have enough titles, check if each titled section has at least one instruction
      let sectionsWithTitlesAndInstructions = 0;
      
      this.sections.forEach((section, sectionIndex) => {
        const sectionTitle = section.title?.trim();
        const populatedItems = section.items.filter(item => this.isItemPopulated(item));
        
        if (sectionTitle) {
          if (populatedItems.length === 0) {
            // This titled section has no instructions - highlight the instruction fields
            section.items.forEach((_, itemIndex) => {
              errors[`sections[${sectionIndex}].items[${itemIndex}].text`] = true;
            });
            isValid = false;
          } else {
            sectionsWithTitlesAndInstructions++;
          }
        }
      });

      if (sectionsWithTitlesAndInstructions < 2) {
        errors.instructions = 'חובה למלא לפחות 2 שלבים.';
        isValid = false;
      }
    }

    // Validate individual instruction fields for populated instructions
    this.sections.forEach((section, sectionIndex) => {
      section.items.forEach((item, itemIndex) => {
        if (this.isItemPopulated(item)) {
          const itemErrors = this.validateItemFields(item);
          if (Object.keys(itemErrors).length > 0) {
            Object.keys(itemErrors).forEach(field => {
              errors[`sections[${sectionIndex}].items[${itemIndex}].${field}`] = true;
            });
            isValid = false;
          }
        }
      });
    });

    return { isValid, errors };
  }


  /**
   * Override createSectionHTML to use instructions-specific CSS classes
   */
  createSectionHTML(section, sectionIndex) {
    const sectionNumber = sectionIndex + 1;
    const items = section.items || [];
    const itemHTMLs = items.map((item, index) => {
      const includeRemove = index > 0 || items.length > 1;
      return this.createListItemHTML(item, includeRemove);
    }).join('');
    const content = itemHTMLs || this.createListItemHTML(this.getInitialItems()[0], false);
    const removeSectionButton = this.sections.length > 1
      ? `<button type="button" class="recipe-form__button recipe-form__button--remove-section">-</button>`
      : '';
    const escapedSectionTitle = (section.title || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    return `
      <div class="recipe-form__steps" data-section-index="${sectionIndex}">
        <div class="recipe-form__stage-header">
          <h3 class="recipe-form__stage-title">${this.sectionTitlePrefix} ${sectionNumber}</h3>
          ${removeSectionButton}
        </div>
        <input type="text" class="recipe-form__input recipe-form__input--stage-name"
               placeholder="${this.sectionNamePlaceholder}" value="${escapedSectionTitle}">
        ${content}
      </div>
    `;
  }

  /**
   * Override updateSectionsFromDOM to use instructions-specific CSS classes
   */
  updateSectionsFromDOM() {
    if (!this.isSectionMode) return;

    const sectionContainers = this.shadowRoot.querySelectorAll('.recipe-form__steps[data-section-index]');
    sectionContainers.forEach((container) => {
      const sectionIndex = parseInt(container.dataset.sectionIndex, 10);
      if (this.sections[sectionIndex]) {
        const sectionNameInput = container.querySelector('.recipe-form__input--stage-name');
        const sectionTitle = sectionNameInput ? sectionNameInput.value.trim() : '';
        const items = Array.from(
          container.querySelectorAll(`:scope > .${this.itemClass}`)
        ).map(item => this.getItemData(item));

        this.sections[sectionIndex] = {
          title: sectionTitle || this.sections[sectionIndex].title,
          items: items.length > 0 ? items : this.getInitialItems()
        };
      }
    });
  }

  /**
   * Override removeSection to use instructions-specific CSS classes
   * @param {Event} event - The click event
   */
  removeSection(event) {
    this.updateSectionsFromDOM();
    const sectionDiv = event.target.closest('.recipe-form__steps');
    const sectionIndex = parseInt(sectionDiv.dataset.sectionIndex, 10);

    if (this.sections.length <= 1) return;

    this.sections.splice(sectionIndex, 1);

    if (this.sections.length === 1) {
      this.transformToSimpleMode();
    } else {
      this.renderSectionMode();
    }

    this.dispatchChangeEvent('section-removed');
  }

  /**
   * Override addSectionItem to use instructions-specific CSS classes
   * @param {Event} event - The click event
   */
  addSectionItem(event) {
    const clickedButton = event.target;
    const currentItem = clickedButton.closest(`.${this.itemClass}`);
    const sectionContainer = clickedButton.closest('.recipe-form__steps');
    const sectionIndex = parseInt(sectionContainer.dataset.sectionIndex, 10);
    const newItemHTML = this.createListItemHTML(this.getInitialItems()[0], true);
    const newItemDiv = document.createElement('div');
    newItemDiv.innerHTML = newItemHTML;
    const newItem = newItemDiv.firstElementChild;

    if (currentItem.nextSibling) {
      currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
    } else {
      currentItem.parentNode.appendChild(newItem);
    }

    if (this.sections[sectionIndex]) {
      this.sections[sectionIndex].items.push(this.getInitialItems()[0]);
    }

    this.updateSectionFirstItemRemoveButton(sectionContainer);
    this.dispatchChangeEvent('section-item-added');
  }

  /**
   * Override removeSectionItem to use instructions-specific CSS classes
   * @param {Event} event - The click event
   */
  removeSectionItem(event) {
    const itemToRemove = event.target.closest(`.${this.itemClass}`);
    const sectionContainer = itemToRemove.closest('.recipe-form__steps');
    const sectionIndex = parseInt(sectionContainer.dataset.sectionIndex, 10);
    const sectionItems = Array.from(sectionContainer.querySelectorAll(`.${this.itemClass}`));
    const itemIndex = sectionItems.indexOf(itemToRemove);

    itemToRemove.remove();

    if (this.sections[sectionIndex] && this.sections[sectionIndex].items[itemIndex] !== undefined) {
      this.sections[sectionIndex].items.splice(itemIndex, 1);
    }

    this.updateSectionFirstItemRemoveButton(sectionContainer);
    this.dispatchChangeEvent('section-item-removed');
  }

  /**
   * Override getSectionsData to use instructions-specific CSS classes
   * @returns {Array} The data for the sectioned list.
   */
  getSectionsData() {
    const sectionContainers = this.shadowRoot.querySelectorAll('.recipe-form__steps[data-section-index]');
    const sections = [];
    sectionContainers.forEach((container) => {
      const sectionNameInput = container.querySelector('.recipe-form__input--stage-name');
      const sectionTitle = sectionNameInput ? sectionNameInput.value.trim() : '';
      const items = Array.from(
        container.querySelectorAll(`:scope > .${this.itemClass}`)
      ).map(item => this.getItemData(item)).filter(item => this.isItemPopulated(item));

      if (items.length > 0 || sectionTitle) {
        sections.push({ title: sectionTitle, items });
      }
    });
    return sections;
  }

  /**
   * Custom compatibility methods for legacy API
   */
  
  // Legacy property getters for backward compatibility
  get isStageMode() {
    return this.isSectionMode;
  }
  
  set isStageMode(value) {
    this.isSectionMode = value;
  }
  
  get stages() {
    return this.sections;
  }
  
  set stages(value) {
    this.sections = value;
  }

  /**
   * Legacy method: Get current instructions data (compatible with existing form API)
   */
  getInstructions() {
    return this.getData();
  }

  /**
   * Legacy method: Populate instructions (compatible with existing form API)
   */
  populateInstructions(data) {
    if (Array.isArray(data)) {
      const instructionObjects = data.map(text => ({ text: text || '' }));
      this.populateSimpleData(instructionObjects);
    } else if (data && Array.isArray(data.stages)) {
      const sections = data.stages.map(stage => ({
        title: stage.title || '',
        items: (stage.instructions || []).map(text => ({ text: text || '' }))
      }));
      this.populateSectionsData(sections);
    }
  }

  /**
   * Legacy method: Clear instructions (compatible with existing form API)
   */
  clearInstructions() {
    this.clear();
  }

  /**
   * Override dispatchChangeEvent to emit instructions-changed event for compatibility
   */
  dispatchChangeEvent(action, additionalData = {}) {
    this.dispatchEvent(new CustomEvent('instructions-changed', {
      bubbles: true,
      composed: true,
      detail: { 
        action, 
        data: this.getData(),
        isStageMode: this.isStageMode,
        ...additionalData 
      }
    }));
  }

  /**
   * Set validation state for instruction fields
   * @param {Object} errors - Validation errors object
   */
  setValidationState(errors) {
    // Clear all existing validation errors first
    const allInputs = this.shadowRoot.querySelectorAll('input[type="text"]');
    allInputs.forEach(input => {
      input.classList.remove('recipe-form__input--invalid');
    });

    if (!errors || Object.keys(errors).length === 0) {
      return; // No errors to highlight
    }

    // Handle different error types - simplified for instructions
    Object.keys(errors).forEach(errorKey => {
      if (errorKey === 'general' || errorKey === 'instructions') {
        // General error or instructions error - highlight all visible instruction inputs and stage titles
        const inputs = this.shadowRoot.querySelectorAll('input[name="steps"]');
        inputs.forEach(input => {
          input.classList.add('recipe-form__input--invalid');
        });
        
        // Also highlight stage title inputs if in stage mode
        if (this.isSectionMode) {
          const stageTitleInputs = this.shadowRoot.querySelectorAll('.recipe-form__input--stage-name');
          stageTitleInputs.forEach(input => {
            input.classList.add('recipe-form__input--invalid');
          });
        }
      } else if (errorKey.startsWith('sections[') && errorKey.includes('.title')) {
        // Section title validation errors
        this.handleSectionTitleError(errorKey);
      } else if (errorKey.startsWith('sections[') && errorKey.includes('.items')) {
        // Section item validation errors
        this.handleSectionItemError(errorKey);
      } else if (typeof errorKey === 'string' && errorKey.includes('.')) {
        // Legacy stage-specific error handling
        this.handleLegacyValidationError(errorKey);
      } else if (typeof errorKey === 'number' || /^\d+$/.test(errorKey)) {
        // Simple instruction index error
        const inputs = this.shadowRoot.querySelectorAll('input[name="steps"]');
        const index = parseInt(errorKey);
        if (inputs[index]) {
          inputs[index].classList.add('recipe-form__input--invalid');
        }
      }
    });
  }

  /**
   * Handle section title validation errors
   * @param {string} errorKey - Error key like "sections[0].title"
   */
  handleSectionTitleError(errorKey) {
    const match = errorKey.match(/sections\[(\d+)\]\.title/);
    if (match) {
      const sectionIndex = parseInt(match[1], 10);
      const stageContainer = this.shadowRoot.querySelector(`[data-section-index="${sectionIndex}"]`);
      if (stageContainer) {
        const titleInput = stageContainer.querySelector('.recipe-form__input--stage-name');
        if (titleInput) {
          titleInput.classList.add('recipe-form__input--invalid');
        }
      }
    }
  }

  /**
   * Handle section item validation errors
   * @param {string} errorKey - Error key like "sections[0].items[0].text"
   */
  handleSectionItemError(errorKey) {
    const match = errorKey.match(/sections\[(\d+)\]\.items\[(\d+)\]\.(\w+)/);
    if (match) {
      const sectionIndex = parseInt(match[1], 10);
      const itemIndex = parseInt(match[2], 10);
      const field = match[3];
      
      const stageContainer = this.shadowRoot.querySelector(`[data-section-index="${sectionIndex}"]`);
      if (stageContainer) {
        const stepElements = stageContainer.querySelectorAll(`.${this.itemClass}`);
        const stepElement = stepElements[itemIndex];
        if (stepElement && field === 'text') {
          const input = stepElement.querySelector('input[name="steps"]');
          if (input) {
            input.classList.add('recipe-form__input--invalid');
          }
        }
      }
    }
  }

  /**
   * Handle legacy validation error format for backward compatibility
   * @param {string} errorKey - Error key from legacy validation
   */
  handleLegacyValidationError(errorKey) {
    const parts = errorKey.split('.');
    const stageIndex = parseInt(parts[0]);
    const field = parts[1];
    const stepIndex = parts[2] ? parseInt(parts[2]) : undefined;

    if (field === 'title') {
      // Highlight stage title input
      const stageContainer = this.shadowRoot.querySelector(`[data-section-index="${stageIndex}"]`);
      if (stageContainer) {
        const titleInput = stageContainer.querySelector('.recipe-form__input--stage-name');
        if (titleInput) {
          titleInput.classList.add('recipe-form__input--invalid');
        }
      }
    } else if (field === 'instructions') {
      // Highlight instruction inputs in specific stage
      const stageContainer = this.shadowRoot.querySelector(`[data-section-index="${stageIndex}"]`);
      if (stageContainer) {
        if (stepIndex !== undefined) {
          // Specific step within stage
          const stepInputs = stageContainer.querySelectorAll('input[name="steps"]');
          if (stepInputs[stepIndex]) {
            stepInputs[stepIndex].classList.add('recipe-form__input--invalid');
          }
        } else {
          // All steps in stage
          const stepInputs = stageContainer.querySelectorAll('input[name="steps"]');
          stepInputs.forEach(input => {
            input.classList.add('recipe-form__input--invalid');
          });
        }
      }
    }
  }
}

customElements.define('recipe-instructions-list', RecipeInstructionsList);

export { RecipeInstructionsList };