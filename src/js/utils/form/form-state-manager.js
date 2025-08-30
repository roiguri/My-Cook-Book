/**
 * Form State Manager Utilities
 * -----------------------------
 * Handles form state management including disabled states, loading states,
 * form clearing, and field population.
 */

/**
 * Sets the disabled state for all form elements
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {boolean} isDisabled - Whether to disable the form
 */
export function setFormDisabledState(shadowRoot, isDisabled) {
  if (!shadowRoot) return;
  
  // Handle metadata fields component
  const metadataComponent = shadowRoot.getElementById('metadata-fields');
  if (metadataComponent && typeof metadataComponent.setDisabled === 'function') {
    metadataComponent.setDisabled(isDisabled);
  }
  
  // Handle ingredients list component
  const ingredientsList = shadowRoot.getElementById('ingredients-list');
  if (ingredientsList && typeof ingredientsList.setDisabled === 'function') {
    ingredientsList.setDisabled(isDisabled);
  }
  
  // Handle form button group component
  const buttonGroup = shadowRoot.getElementById('form-buttons');
  if (buttonGroup && typeof buttonGroup.setDisabled === 'function') {
    buttonGroup.setDisabled(isDisabled);
  }
  
  // Handle main component form elements (excluding those in sub-components)
  const formElements = shadowRoot.querySelectorAll('input:not(recipe-metadata-fields input):not(form-button-group input):not(recipe-ingredients-list input), select:not(recipe-metadata-fields select):not(form-button-group select):not(recipe-ingredients-list select), textarea:not(recipe-metadata-fields textarea):not(form-button-group textarea):not(recipe-ingredients-list textarea)');
  formElements.forEach((element) => {
    element.disabled = isDisabled;
  });

  // Handle image handler component if present
  const imageHandler = shadowRoot.getElementById('recipe-images');
  if (imageHandler && typeof imageHandler.setDisabled === 'function') {
    imageHandler.setDisabled(isDisabled);
  }
}

/**
 * Clears all form fields to their initial state
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
export function clearForm(shadowRoot) {
  if (!shadowRoot) return;
  
  // Clear metadata fields through component API
  clearMetadataFields(shadowRoot);
  
  // Clear ingredients through component API
  clearIngredientsFields(shadowRoot);
  
  // Clear main component fields (inputs, selects, textareas not in sub-components)
  clearMainComponentFields(shadowRoot);
  
  // Reset instructions/stages to initial state
  resetInstructionsToInitial(shadowRoot);
  
  // Clear images
  clearImages(shadowRoot);
  
  // Reset form and hide error messages
  resetFormState(shadowRoot);
}


/**
 * Clears metadata fields through component API
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function clearMetadataFields(shadowRoot) {
  const metadataComponent = shadowRoot.getElementById('metadata-fields');
  if (metadataComponent && typeof metadataComponent.clearFields === 'function') {
    metadataComponent.clearFields();
  }
}

/**
 * Clears ingredients fields through component API
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function clearIngredientsFields(shadowRoot) {
  const ingredientsList = shadowRoot.getElementById('ingredients-list');
  if (ingredientsList && typeof ingredientsList.clearIngredients === 'function') {
    ingredientsList.clearIngredients();
  }
}

/**
 * Clears main component fields (excluding those in sub-components)
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function clearMainComponentFields(shadowRoot) {
  // Clear only inputs, selects, and textareas that are direct children of main component
  // This excludes fields inside sub-components
  shadowRoot.querySelectorAll('input:not(recipe-metadata-fields input):not(recipe-ingredients-list input), select:not(recipe-metadata-fields select):not(recipe-ingredients-list select), textarea:not(recipe-metadata-fields textarea):not(recipe-ingredients-list textarea)').forEach((field) => {
    if (field.type === 'textarea' || field.tagName === 'TEXTAREA') {
      field.value = '';
    } else if (field.tagName === 'SELECT') {
      field.selectedIndex = 0;
    } else {
      field.value = '';
    }
    field.classList.remove('recipe-form__input--invalid');
  });
}

/**
 * Resets instructions/stages section to initial state
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function resetInstructionsToInitial(shadowRoot) {
  const stagesContainer = shadowRoot.getElementById('stages-container');
  if (!stagesContainer) return;
  
  const stepsContainers = stagesContainer.querySelectorAll('.recipe-form__steps');
  
  stepsContainers.forEach((container, index) => {
    if (index === 0) {
      // Reset first stage
      resetStepsInContainer(container);
      
      // Remove stage-specific elements (title, name input)
      const titleContainer = container.querySelector('.recipe-form__stage-header');
      const stageName = container.querySelector('.recipe-form__input--stage-name');
      
      if (titleContainer) titleContainer.remove();
      if (stageName) stageName.remove();
    } else {
      // Remove additional stages
      container.remove();
    }
  });
}

/**
 * Resets steps within a container to initial state
 * @param {HTMLElement} container - The steps container
 */
function resetStepsInContainer(container) {
  const steps = container.querySelectorAll('.recipe-form__step');
  
  steps.forEach((step, stepIndex) => {
    if (stepIndex === 0) {
      // Reset first step
      const input = step.querySelector('input[type="text"]');
      if (input) input.value = '';
      
      const button = step.querySelector('button');
      if (button) {
        button.textContent = '+';
        button.className = 'recipe-form__button recipe-form__button--add-step';
      }
      
      // Remove any remove buttons from first step
      const removeButton = step.querySelector('.recipe-form__button--remove-step');
      if (removeButton) removeButton.remove();
    } else {
      // Remove additional steps
      step.remove();
    }
  });
}

/**
 * Clears images from the image handler
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function clearImages(shadowRoot) {
  const imageHandler = shadowRoot.getElementById('recipe-images');
  if (imageHandler && typeof imageHandler.clearImages === 'function') {
    imageHandler.clearImages();
  }
}

/**
 * Resets form state and hides error messages
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function resetFormState(shadowRoot) {
  // Reset the form element
  const form = shadowRoot.getElementById('recipe-form');
  if (form) form.reset();
  
  // Hide error message
  const errorMessage = shadowRoot.querySelector('.recipe-form__error-message');
  if (errorMessage) errorMessage.style.display = 'none';
}

/**
 * Populates form with recipe data (for editing)
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {Object} recipeData - Recipe data to populate
 */
export function populateFormWithData(shadowRoot, recipeData) {
  if (!shadowRoot || !recipeData) return;
  
  // Populate basic fields
  populateBasicFields(shadowRoot, recipeData);
  
  // Populate ingredients
  populateIngredients(shadowRoot, recipeData.ingredients || []);
  
  // Populate instructions/stages
  populateInstructions(shadowRoot, recipeData);
  
  // Populate images (if supported)
  if (recipeData.images) {
    populateImages(shadowRoot, recipeData.images);
  }
}

/**
 * Populates basic form fields
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {Object} recipeData - Recipe data
 */
function populateBasicFields(shadowRoot, recipeData) {
  const fieldMappings = [
    { field: 'name', id: 'name' },
    { field: 'category', id: 'dish-type' },
    { field: 'prepTime', id: 'prep-time' },
    { field: 'waitTime', id: 'wait-time' },
    { field: 'servings', id: 'servings-form' },
    { field: 'difficulty', id: 'difficulty' },
    { field: 'mainIngredient', id: 'main-ingredient' },
    { field: 'tags', id: 'tags', transform: (tags) => Array.isArray(tags) ? tags.join(', ') : tags },
    { field: 'comments', id: 'comments', transform: (comments) => Array.isArray(comments) ? comments.join('\n') : comments },
  ];
  
  fieldMappings.forEach(({ field, id, transform }) => {
    const element = shadowRoot.getElementById(id);
    if (element && recipeData[field] !== undefined) {
      element.value = transform ? transform(recipeData[field]) : recipeData[field];
    }
  });
}

/**
 * Populates ingredients section using component API
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {Array} ingredients - Array of ingredient objects
 */
function populateIngredients(shadowRoot, ingredients) {
  const ingredientsList = shadowRoot.getElementById('ingredients-list');
  if (ingredientsList && typeof ingredientsList.populateIngredients === 'function') {
    ingredientsList.populateIngredients(ingredients);
  }
}


/**
 * Populates instructions/stages section
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {Object} recipeData - Recipe data with instructions or stages
 */
function populateInstructions(shadowRoot, recipeData) {
  if (recipeData.stages && recipeData.stages.length > 0) {
    // Handle multi-stage instructions
    populateStages(shadowRoot, recipeData.stages);
  } else if (recipeData.instructions && recipeData.instructions.length > 0) {
    // Handle single-stage instructions
    populateSingleStageInstructions(shadowRoot, recipeData.instructions);
  }
}

/**
 * Populates multi-stage instructions
 * @param {ShadowRoot} _shadowRoot - The component's shadow root
 * @param {Array} _stages - Array of stage objects
 */
function populateStages(_shadowRoot, _stages) {
  // This is a complex operation that would need integration with the component's methods
  // For now, we'll provide the structure
  console.warn('populateStages: This method needs integration with component methods');
}

/**
 * Populates single-stage instructions
 * @param {ShadowRoot} _shadowRoot - The component's shadow root
 * @param {Array} _instructions - Array of instruction strings
 */
function populateSingleStageInstructions(_shadowRoot, _instructions) {
  // This would need integration with the component's addStepLine method
  console.warn('populateSingleStageInstructions: This method needs integration with component methods');
}

/**
 * Populates images section
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {Array} images - Array of image objects
 */
function populateImages(shadowRoot, images) {
  const imageHandler = shadowRoot.getElementById('recipe-images');
  if (imageHandler && typeof imageHandler.populateImages === 'function') {
    imageHandler.populateImages(images);
  }
}

/**
 * Sets a loading state for the form
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {boolean} isLoading - Whether form is in loading state
 * @param {string} loadingText - Text to show during loading
 */
export function setFormLoadingState(shadowRoot, isLoading, loadingText = 'שולח...') {
  if (!shadowRoot) return;
  
  setFormDisabledState(shadowRoot, isLoading);
  
  // Handle loading state through button group component
  const buttonGroup = shadowRoot.getElementById('form-buttons');
  if (buttonGroup && typeof buttonGroup.setLoadingState === 'function') {
    buttonGroup.setLoadingState(isLoading, loadingText);
  }
}