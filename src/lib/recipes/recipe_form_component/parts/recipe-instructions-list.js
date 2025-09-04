/**
 * RecipeInstructionsList Component
 * --------------------------------
 * Simple instructions component that dynamically transforms between:
 * - Simple instructions (like existing implementation)
 * - Stage-based instructions (when multiple stages are needed)
 * 
 * Maintains exact same appearance as existing implementation but with
 * cleaner component-based architecture.
 */

import { DynamicListComponent } from './dynamic-list-component.js';

class RecipeInstructionsList extends DynamicListComponent {
  constructor() {
    super();
    
    // Configure for Hebrew instructions (matching existing styles exactly)
    this.listTitle = this.getAttribute('title') || 'תהליך הכנה:';
    this.containerClass = 'recipe-form__stages';
    this.itemClass = 'recipe-form__step';
    this.addButtonClass = 'recipe-form__button--add-step';
    this.removeButtonClass = 'recipe-form__button--remove-step';
    
    // Single field for instructions
    this.itemFields = [
      { placeholder: '', className: 'recipe-form__input', name: 'instruction' }
    ];
    
    // Track current mode (simple or stages)
    this.isStageMode = false;
    this.stages = []; // Array of {title, instructions}
  }

  /**
   * Create template matching existing form structure exactly
   */
  template() {
    return `
      <div class="${this.containerClass}">
        <label class="recipe-form__label">${this.listTitle}</label>
        <div id="steps-container" class="recipe-form__steps">
          ${this.createInitialItem()}
        </div>
        <button type="button" id="add-stage" class="recipe-form__button recipe-form__button--add-stage">הוסף שלב</button>
      </div>
    `;
  }

  /**
   * Create initial instruction item (matches existing implementation)
   */
  createInitialItem() {
    return `
      <fieldset class="recipe-form__step">
        <input type="text" name="steps" class="recipe-form__input">
        <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
      </fieldset>
    `;
  }

  /**
   * Override createListItem for instruction-specific structure
   */
  createListItem(includeRemoveButton = true) {
    const removeButtonHTML = includeRemoveButton 
      ? `<button type="button" class="recipe-form__button recipe-form__button--remove-step">-</button>`
      : '';

    return `
      <fieldset class="recipe-form__step">
        <input type="text" name="steps" class="recipe-form__input">
        <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
        ${removeButtonHTML}
      </fieldset>
    `;
  }

  /**
   * Override setupEventListeners to handle both regular list and stage events
   */
  setupEventListeners() {
    // Set up event listeners for the steps container (not calling super since we use different structure)
    const container = this.shadowRoot.querySelector('#steps-container');
    
    if (container) {
      // Create stable bound handler for simple mode
      this._stepsContainerHandler = (event) => {
        if (event.target.classList.contains(this.addButtonClass)) {
          this.addInstructionItem(event);
        } else if (event.target.classList.contains(this.removeButtonClass)) {
          this.removeInstructionItem(event);
        }
      };
      
      // Handle add/remove step button clicks (for simple mode)
      container.addEventListener('click', this._stepsContainerHandler);
    }
    
    // Handle "Add Stage" button and stage management
    this.shadowRoot.addEventListener('click', (event) => {
      if (event.target.id === 'add-stage') {
        this.transformToStageMode();
      } else if (event.target.classList.contains('recipe-form__button--remove-stage')) {
        this.removeStage(event);
      }
    });
  }

  /**
   * Setup event listeners for stage mode
   */
  setupStageEventListeners() {
    const stepsContainer = this.shadowRoot.querySelector('#steps-container');
    
    if (stepsContainer) {
      // Remove existing listeners properly before replacing node
      if (this._stepsContainerHandler) {
        stepsContainer.removeEventListener('click', this._stepsContainerHandler);
      }
      
      // Create stable bound handler for stage mode
      this._stepsContainerHandler = (event) => {
        if (event.target.classList.contains(this.addButtonClass)) {
          this.addStageInstructionItem(event);
        } else if (event.target.classList.contains(this.removeButtonClass)) {
          this.removeStageInstructionItem(event);
        }
      };
      
      // Replace with clone and attach handler to new container
      stepsContainer.replaceWith(stepsContainer.cloneNode(true));
      const newStepsContainer = this.shadowRoot.querySelector('#steps-container');
      
      newStepsContainer.addEventListener('click', this._stepsContainerHandler);
    }
  }

  /**
   * Add instruction item (replaces parent addListItem)
   */
  addInstructionItem(event) {
    const clickedButton = event.target;
    const currentItem = clickedButton.closest('.recipe-form__step');

    // Create new item with remove button
    const newItemHTML = this.createListItem(true);
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
    this.dispatchChangeEvent('instruction-added');
  }

  /**
   * Remove instruction item (replaces parent removeListItem)
   */
  removeInstructionItem(event) {
    const itemToRemove = event.target.closest('.recipe-form__step');
    
    itemToRemove.remove();

    // Remove remove button from first item if only one remains
    this.updateFirstItemRemoveButton();

    // Dispatch change event
    this.dispatchChangeEvent('instruction-removed');
  }

  /**
   * Override updateFirstItemRemoveButton to work with our container
   */
  updateFirstItemRemoveButton() {
    const container = this.shadowRoot.querySelector('#steps-container');
    const items = container.querySelectorAll('.recipe-form__step');
    const firstItem = items[0];

    if (!firstItem) return;

    if (items.length === 1) {
      // Remove the remove button from first item
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-step');
      if (removeButton) removeButton.remove();
    } else if (items.length > 1) {
      // Add remove button to first item if it doesn't have one
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-step');
      if (!removeButton) {
        const newRemoveButton = document.createElement('button');
        newRemoveButton.type = 'button';
        newRemoveButton.className = 'recipe-form__button recipe-form__button--remove-step';
        newRemoveButton.textContent = '-';
        firstItem.appendChild(newRemoveButton);
      }
    }
  }

  /**
   * Add instruction item within a stage
   */
  addStageInstructionItem(event) {
    const clickedButton = event.target;
    const currentItem = clickedButton.closest('.recipe-form__step');
    const stageContainer = clickedButton.closest('.recipe-form__steps');
    const stageIndex = parseInt(stageContainer.dataset.stageIndex, 10);

    // Create new item with remove button
    const newItemHTML = `
      <fieldset class="recipe-form__step">
        <input type="text" name="steps" class="recipe-form__input">
        <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
        <button type="button" class="recipe-form__button recipe-form__button--remove-step">-</button>
      </fieldset>
    `;
    
    const newItemDiv = document.createElement('div');
    newItemDiv.innerHTML = newItemHTML;
    const newItem = newItemDiv.firstElementChild;

    // Insert after current item
    if (currentItem.nextSibling) {
      currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
    } else {
      currentItem.parentNode.appendChild(newItem);
    }

    // Update the stages data
    if (this.stages[stageIndex]) {
      this.stages[stageIndex].instructions.push('');
    }

    // Ensure first item in stage has remove button if needed
    this.updateStageFirstItemRemoveButton(stageContainer);

    // Dispatch change event
    this.dispatchChangeEvent('stage-instruction-added');
  }

  /**
   * Remove instruction item within a stage
   */
  removeStageInstructionItem(event) {
    const itemToRemove = event.target.closest('.recipe-form__step');
    const stageContainer = itemToRemove.closest('.recipe-form__steps');
    const stageIndex = parseInt(stageContainer.dataset.stageIndex, 10);
    
    // Find item index within stage
    const stageItems = Array.from(stageContainer.querySelectorAll('.recipe-form__step'));
    const itemIndex = stageItems.indexOf(itemToRemove);

    itemToRemove.remove();

    // Update the stages data
    if (this.stages[stageIndex] && this.stages[stageIndex].instructions[itemIndex] !== undefined) {
      this.stages[stageIndex].instructions.splice(itemIndex, 1);
    }

    // Update first item remove button for this stage
    this.updateStageFirstItemRemoveButton(stageContainer);

    // Dispatch change event
    this.dispatchChangeEvent('stage-instruction-removed');
  }

  /**
   * Update first item remove button within a specific stage
   */
  updateStageFirstItemRemoveButton(stageContainer) {
    const items = stageContainer.querySelectorAll('.recipe-form__step');
    const firstItem = items[0];

    if (!firstItem) return;

    if (items.length === 1) {
      // Remove the remove button from first item
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-step');
      if (removeButton) removeButton.remove();
    } else if (items.length > 1) {
      // Add remove button to first item if it doesn't have one
      const removeButton = firstItem.querySelector('.recipe-form__button--remove-step');
      if (!removeButton) {
        const newRemoveButton = document.createElement('button');
        newRemoveButton.type = 'button';
        newRemoveButton.className = 'recipe-form__button recipe-form__button--remove-step';
        newRemoveButton.textContent = '-';
        firstItem.appendChild(newRemoveButton);
      }
    }
  }

  /**
   * Transform to stage mode (creates multiple stages)
   */
  transformToStageMode() {
    if (this.isStageMode) {
      // Already in stage mode, just add a new stage
      // First preserve current stage data from DOM
      this.updateStagesFromDOM();
      
      // Add new empty stage
      this.stages.push({ title: '', instructions: [''] });
      
      // Re-render with updated data
      this.renderStageMode();
      
      this.dispatchChangeEvent('stage-added');
      return;
    }
    
    // Collect current instructions from simple mode
    const currentInstructions = this.getSimpleInstructions();
    
    // Convert to stage mode with first stage containing current instructions
    this.isStageMode = true;
    
    // Ensure we have at least one instruction in the first stage
    const firstStageInstructions = currentInstructions.length > 0 ? currentInstructions : [''];
    
    this.stages = [
      { title: '', instructions: firstStageInstructions },
      { title: '', instructions: [''] }  // Second stage always starts empty
    ];
    
    // Re-render in stage mode
    this.renderStageMode();
    
    this.dispatchChangeEvent('transformed-to-stage-mode');
  }

  /**
   * Transform back to simple mode (single instruction list)
   */
  transformToSimpleMode() {
    if (!this.isStageMode) return;
    
    // First update stages from DOM to get latest values
    this.updateStagesFromDOM();
    
    // Collect all instructions from all stages, filtering out empty ones
    const allInstructions = this.stages.flatMap(stage => 
      stage.instructions.filter(instruction => instruction.trim() !== '')
    );
    
    // Convert back to simple mode
    this.isStageMode = false;
    this.stages = [];
    
    // Re-render in simple mode
    this.renderSimpleMode();
    
    // Populate with collected instructions
    if (allInstructions.length > 0) {
      this.populateSimpleInstructions(allInstructions);
    }
  }

  /**
   * Render in stage mode (multiple stages)
   */
  renderStageMode() {
    const stepsContainer = this.shadowRoot.querySelector('#steps-container');
    const addStageButton = this.shadowRoot.querySelector('#add-stage');
    
    // Clear existing content
    stepsContainer.innerHTML = '';
    
    // Create stages
    this.stages.forEach((stage, index) => {
      const stageDiv = this.createStageHTML(stage, index);
      stepsContainer.insertAdjacentHTML('beforeend', stageDiv);
    });
    
    // Update add stage button text
    addStageButton.textContent = 'הוסף שלב';
    
    // Re-setup event listeners for stage mode
    this.setupStageEventListeners();
  }

  /**
   * Render in simple mode (single instruction list)
   */
  renderSimpleMode() {
    const stepsContainer = this.shadowRoot.querySelector('#steps-container');
    const addStageButton = this.shadowRoot.querySelector('#add-stage');
    
    // Clear existing content
    stepsContainer.innerHTML = this.createInitialItem();
    
    // Reset add stage button
    addStageButton.textContent = 'הוסף שלב';
  }

  /**
   * Create HTML for a single stage (matches existing structure)
   */
  createStageHTML(stage, stageIndex) {
    const stageNumber = stageIndex + 1;
    const instructions = stage.instructions || [];
    
    // Create instruction items
    const instructionItems = instructions.map((instruction, index) => {
      const includeRemove = index > 0 || instructions.length > 1;
      // Escape HTML in instruction value to prevent issues
      const escapedInstruction = instruction.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      return `
        <fieldset class="recipe-form__step">
          <input type="text" name="steps" class="recipe-form__input" value="${escapedInstruction}">
          <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
          ${includeRemove ? '<button type="button" class="recipe-form__button recipe-form__button--remove-step">-</button>' : ''}
        </fieldset>
      `;
    }).join('');
    
    // If no instructions, create empty one
    const content = instructionItems || `
      <fieldset class="recipe-form__step">
        <input type="text" name="steps" class="recipe-form__input">
        <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
      </fieldset>
    `;

    const removeStageButton = this.stages.length > 1 
      ? `<button type="button" class="recipe-form__button recipe-form__button--remove-stage">-</button>`
      : '';

    // Escape stage title
    const escapedStageTitle = (stage.title || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    return `
      <div class="recipe-form__steps" data-stage-index="${stageIndex}">
        <div class="recipe-form__stage-header">
          <h3 class="recipe-form__stage-title">שלב ${stageNumber}</h3>
          ${removeStageButton}
        </div>
        <input type="text" class="recipe-form__input recipe-form__input--stage-name" 
               placeholder="שם השלב (אופציונלי)" value="${escapedStageTitle}">
        ${content}
      </div>
    `;
  }

  /**
   * Add a new stage (simplified - called only when needed)
   */
  addNewStage() {
    // Preserve current stage data from DOM first
    this.updateStagesFromDOM();
    
    // Add new empty stage
    this.stages.push({ title: '', instructions: [''] });
    
    // Re-render with all stage data
    this.renderStageMode();
    
    this.dispatchChangeEvent('stage-added');
  }

  /**
   * Update stages data from current DOM state
   */
  updateStagesFromDOM() {
    if (!this.isStageMode) return;
    
    const stageContainers = this.shadowRoot.querySelectorAll('.recipe-form__steps[data-stage-index]');
    
    stageContainers.forEach((container) => {
      const stageIndex = parseInt(container.dataset.stageIndex, 10);
      
      // Only update if this stage exists in our data
      if (this.stages[stageIndex]) {
        const stageNameInput = container.querySelector('.recipe-form__input--stage-name');
        const stageTitle = stageNameInput ? stageNameInput.value.trim() : '';
        
        // Get only instruction inputs that are direct descendants of this stage container
        const instructions = Array.from(
          container.querySelectorAll(':scope > .recipe-form__step input[type="text"]')
        ).map(input => input.value.trim());
        
        this.stages[stageIndex] = {
          title: stageTitle || this.stages[stageIndex].title,
          instructions: instructions.length > 0 ? instructions : [''] // Ensure at least one empty instruction
        };
      }
    });
  }

  /**
   * Remove a stage
   */
  removeStage(event) {
    // First update stages data from DOM
    this.updateStagesFromDOM();
    
    const stageDiv = event.target.closest('.recipe-form__steps');
    const stageIndex = parseInt(stageDiv.dataset.stageIndex, 10);
    
    if (this.stages.length <= 1) return; // Can't remove last stage
    
    this.stages.splice(stageIndex, 1);
    
    // If only one stage left, transform back to simple mode
    if (this.stages.length === 1) {
      this.transformToSimpleMode();
    } else {
      this.renderStageMode();
    }
    
    this.dispatchChangeEvent('stage-removed');
  }

  /**
   * Get current instructions data
   */
  getInstructions() {
    if (this.isStageMode) {
      return this.getStagesData();
    } else {
      return this.getSimpleInstructions();
    }
  }

  /**
   * Get simple instructions array
   */
  getSimpleInstructions() {
    const stepsContainer = this.shadowRoot.querySelector('#steps-container');
    const inputs = stepsContainer.querySelectorAll('input[type="text"]');
    
    return Array.from(inputs)
      .map(input => input.value.trim())
      .filter(instruction => instruction.length > 0);
  }

  /**
   * Get stages data
   */
  getStagesData() {
    const stageContainers = this.shadowRoot.querySelectorAll('.recipe-form__steps[data-stage-index]');
    const stages = [];
    
    stageContainers.forEach((container) => {
      const stageIndex = parseInt(container.dataset.sectionIndex, 10);
      const stageNameInput = container.querySelector('.recipe-form__input--stage-name');
      const stageTitle = stageNameInput ? stageNameInput.value.trim() : `שלב ${stageIndex + 1}`;
      
      // Get only instruction inputs that are direct descendants of this stage container
      const instructions = Array.from(
        container.querySelectorAll(':scope > .recipe-form__step input[type="text"]')
      )
        .map(input => input.value.trim())
        .filter(instruction => instruction.length > 0);
      
      if (instructions.length > 0) {
        stages.push({ title: stageTitle, instructions });
      }
    });
    
    return stages;
  }

  /**
   * Populate instructions data
   */
  populateInstructions(data) {
    if (Array.isArray(data)) {
      // Simple instructions array
      this.populateSimpleInstructions(data);
    } else if (data && Array.isArray(data.stages)) {
      // Legacy stages format
      this.populateStagesData(data.stages);
    } else if (data && data.instructions) {
      // Simple instructions in object format
      this.populateSimpleInstructions(data.instructions);
    }
  }

  /**
   * Populate simple instructions
   */
  populateSimpleInstructions(instructions) {
    if (!Array.isArray(instructions) || instructions.length === 0) return;
    
    // Ensure we're in simple mode
    if (this.isStageMode) {
      this.transformToSimpleMode();
    }
    
    const stepsContainer = this.shadowRoot.querySelector('#steps-container');
    
    // Clear existing and create instructions
    stepsContainer.innerHTML = '';
    
    instructions.forEach((instruction, index) => {
      const includeRemove = index > 0 || instructions.length > 1; // Fix: include remove for first item if multiple instructions
      // Escape HTML in instruction value
      const escapedInstruction = instruction.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const stepHTML = `
        <fieldset class="recipe-form__step">
          <input type="text" name="steps" class="recipe-form__input" value="${escapedInstruction}">
          <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
          ${includeRemove ? '<button type="button" class="recipe-form__button recipe-form__button--remove-step">-</button>' : ''}
        </fieldset>
      `;
      stepsContainer.insertAdjacentHTML('beforeend', stepHTML);
    });
  }

  /**
   * Populate stages data
   */
  populateStagesData(stages) {
    if (!Array.isArray(stages) || stages.length === 0) return;
    
    this.stages = stages.map(stage => ({
      title: stage.title || '',
      instructions: stage.instructions || []
    }));
    
    // Transform to stage mode if more than one stage
    if (stages.length > 1) {
      this.isStageMode = true;
      this.renderStageMode();
    } else {
      // Single stage - use simple mode
      this.populateSimpleInstructions(stages[0].instructions);
    }
  }

  /**
   * Clear instructions
   */
  clearInstructions() {
    this.isStageMode = false;
    this.stages = [];
    this.renderSimpleMode();
    
    // Clear the single input
    const input = this.shadowRoot.querySelector('input[type="text"]');
    if (input) {
      input.value = '';
    }
  }

  /**
   * Override getData to return appropriate format
   */
  getData() {
    return this.getInstructions();
  }

  /**
   * Override populateData
   */
  populateData(data) {
    this.populateInstructions(data);
  }

  /**
   * Override dispatchChangeEvent for instructions
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

    // Handle different error types
    Object.keys(errors).forEach(errorKey => {
      if (errorKey === 'general') {
        // General error - highlight all visible instruction inputs
        this.highlightAllInstructionInputs();
      } else if (typeof errorKey === 'string' && errorKey.includes('.')) {
        // Stage-specific error (e.g., "0.title" or "0.instructions.1")
        this.highlightStageError(errorKey);
      } else if (typeof errorKey === 'number' || /^\d+$/.test(errorKey)) {
        // Simple instruction index error
        this.highlightInstructionByIndex(parseInt(errorKey));
      }
    });
  }

  /**
   * Highlight all instruction inputs
   */
  highlightAllInstructionInputs() {
    const inputs = this.shadowRoot.querySelectorAll('input[name="steps"]');
    inputs.forEach(input => {
      input.classList.add('recipe-form__input--invalid');
    });

    // Also highlight stage title inputs if in stage mode
    if (this.isStageMode) {
      const stageTitleInputs = this.shadowRoot.querySelectorAll('.recipe-form__input--stage-name');
      stageTitleInputs.forEach(input => {
        input.classList.add('recipe-form__input--invalid');
      });
    }
  }

  /**
   * Highlight specific instruction by index
   * @param {number} index - Instruction index to highlight
   */
  highlightInstructionByIndex(index) {
    const inputs = this.shadowRoot.querySelectorAll('input[name="steps"]');
    if (inputs[index]) {
      inputs[index].classList.add('recipe-form__input--invalid');
    }
  }

  /**
   * Highlight stage-specific error
   * @param {string} errorKey - Error key like "0.title" or "0.instructions.1"
   */
  highlightStageError(errorKey) {
    const parts = errorKey.split('.');
    const stageIndex = parseInt(parts[0]);
    const field = parts[1]; // 'title' or 'instructions'
    const stepIndex = parts[2] ? parseInt(parts[2]) : undefined;

    if (field === 'title') {
      // Highlight stage title input
      const stageContainer = this.shadowRoot.querySelector(`[data-stage-index="${stageIndex}"]`);
      if (stageContainer) {
        const titleInput = stageContainer.querySelector('.recipe-form__input--stage-name');
        if (titleInput) {
          titleInput.classList.add('recipe-form__input--invalid');
        }
      }
    } else if (field === 'instructions') {
      // Highlight instruction inputs in specific stage
      const stageContainer = this.shadowRoot.querySelector(`[data-stage-index="${stageIndex}"]`);
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