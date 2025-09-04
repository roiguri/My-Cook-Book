/**
 * Form Validation Utilities
 * -------------------------
 * Extracted validation logic from RecipeFormComponent for better separation of concerns.
 * Handles form validation, error highlighting, and error message display.
 */

import { validateRecipeData } from '../recipes/recipe-data-utils.js';

/**
 * Field mapping for error highlighting
 */
const FIELD_MAP = {
  name: 'name',
  category: 'dish-type',
  prepTime: 'prep-time',
  waitTime: 'wait-time',
  servings: 'servings-form',
  difficulty: 'difficulty',
  mainIngredient: 'main-ingredient',
  tags: 'tags',
  comments: 'comments',
};

/**
 * Validates recipe form data and handles UI error states
 * @param {Object} recipeData - The recipe data to validate
 * @param {ShadowRoot} shadowRoot - The component's shadow root for DOM access
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateRecipeForm(recipeData, shadowRoot) {
  const { isValid: dataValid, errors } = validateRecipeData(recipeData);
  
  // Clear all previous error states
  clearValidationErrors(shadowRoot);
  
  let formIsValid = dataValid;
  let allErrors = { ...errors };

  // Run component-level validation for ingredients
  const ingredientsComponent = shadowRoot.getElementById('ingredients-list');
  if (ingredientsComponent && typeof ingredientsComponent.validate === 'function') {
    const ingredientValidation = ingredientsComponent.validate();
    if (!ingredientValidation.isValid) {
      formIsValid = false;
      Object.assign(allErrors, ingredientValidation.errors);
      if (ingredientsComponent.setValidationState) {
        ingredientsComponent.setValidationState(ingredientValidation.errors);
      }
    }
  }
  
  // Show error messages and highlight invalid fields
  const errorMessage = shadowRoot.querySelector('.recipe-form__error-message');
  
  if (!formIsValid) {
    let errorText = 'ישנם שגיאות בטופס. אנא תקן אותן.';
    
    if (allErrors && Object.keys(allErrors).length > 0) {
      highlightFieldErrors(allErrors, shadowRoot);
      // Filter out boolean error values and show meaningful messages
      const errorMessages = Object.values(allErrors).filter(err => typeof err === 'string');
      if (errorMessages.length > 0) {
        errorText = errorMessages.join(' ');
      }
    }
    
    showErrorMessage(errorMessage, errorText);
  } else {
    hideErrorMessage(errorMessage);
  }
  
  return formIsValid;
}

/**
 * Clears all validation error states from form elements
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
export function clearValidationErrors(shadowRoot) {
  // Clear validation errors from metadata component
  const metadataComponent = shadowRoot.getElementById('metadata-fields');
  if (metadataComponent && typeof metadataComponent.setValidationState === 'function') {
    metadataComponent.setValidationState({});
  }
  
  // Clear validation errors from ingredients component
  const ingredientsComponent = shadowRoot.getElementById('ingredients-list');
  if (ingredientsComponent && typeof ingredientsComponent.setValidationState === 'function') {
    ingredientsComponent.setValidationState({});
  }
  
  // Clear validation errors from main component fields only (comments textarea and instruction inputs)
  const commentsField = shadowRoot.getElementById('comments');
  if (commentsField) {
    commentsField.classList.remove('recipe-form__input--invalid');
  }
  
  // Clear instruction/stage field errors
  shadowRoot.querySelectorAll('.recipe-form__stages input[type="text"], .recipe-form__input--stage-name')
    .forEach((el) => {
      el.classList.remove('recipe-form__input--invalid');
    });
}

/**
 * Highlights form fields with validation errors
 * @param {Object} errors - Validation errors object
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function highlightFieldErrors(errors, shadowRoot) {
  // Collect errors by component for single API calls
  const metadataErrors = {};
  const ingredientErrors = {};
  
  Object.keys(errors).forEach((key) => {
    // Explicitly handle metadata fields
    if (key === 'name' || key === 'category' || key === 'prepTime' || key === 'waitTime' || 
        key === 'servings' || key === 'difficulty' || key === 'mainIngredient' || key === 'tags') {
      metadataErrors[key] = true;
    }
    // Handle ingredient errors - now centralized in component
    else if (key === 'ingredientsRequired') {
      // Simply trigger component validation - it will handle all highlighting internally
      const ingredientsComponent = shadowRoot.getElementById('ingredients-list');
      if (ingredientsComponent && typeof ingredientsComponent.validate === 'function') {
        const componentValidation = ingredientsComponent.validate();
        // The component's setValidationState will be called later in this function
      }
    }
    // Legacy ingredient error support (for backward compatibility)
    else if (key === 'ingredients' || key.startsWith('ingredients[')) {
      ingredientErrors[key] = true;
    }
    // Handle instruction errors - both general and specific
    else if (key === 'instructions' || key.startsWith('instructions[')) {
      highlightInstructionErrors(key, shadowRoot);
    }
    // Handle stage errors - both general and specific  
    else if (key === 'stages' || key.startsWith('stages[')) {
      highlightStageErrors(key, shadowRoot);
    }
    // Handle main component fields directly (like comments)
    else {
      const fieldId = FIELD_MAP[key];
      if (fieldId) {
        const el = shadowRoot.getElementById(fieldId);
        if (el) el.classList.add('recipe-form__input--invalid');
      }
    }
  });
  
  // Apply all metadata errors at once
  if (Object.keys(metadataErrors).length > 0) {
    const metadataComponent = shadowRoot.getElementById('metadata-fields');
    if (metadataComponent && typeof metadataComponent.setValidationState === 'function') {
      metadataComponent.setValidationState(metadataErrors);
    }
  }
  
  // Apply legacy ingredient errors for backward compatibility
  if (Object.keys(ingredientErrors).length > 0) {
    const ingredientsComponent = shadowRoot.getElementById('ingredients-list');
    if (ingredientsComponent && typeof ingredientsComponent.setValidationState === 'function') {
      ingredientsComponent.setValidationState(ingredientErrors);
    }
  }
}



/**
 * Highlights instruction errors using component API
 * @param {string} key - Error key (e.g., "instructions" or "instructions[0]")
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function highlightInstructionErrors(key, shadowRoot) {
  const instructionsComponent = shadowRoot.getElementById('instructions-list');
  
  if (instructionsComponent && typeof instructionsComponent.setValidationState === 'function') {
    if (key === 'instructions') {
      // General instructions error - highlight all visible instruction fields
      instructionsComponent.setValidationState({ general: true });
    } else {
      // Specific instruction error - parse index and highlight specific field
      const match = key.match(/instructions\[(\d+)\]/);
      if (match) {
        const idx = parseInt(match[1], 10);
        instructionsComponent.setValidationState({ [idx]: true });
      }
    }
  } else {
    console.warn('Instructions component not found or missing setValidationState method');
  }
}

/**
 * Highlights stage errors using component API
 * @param {string} key - Error key (e.g., "stages" or "stages[0].title")
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function highlightStageErrors(key, shadowRoot) {
  const instructionsComponent = shadowRoot.getElementById('instructions-list');
  
  if (instructionsComponent && typeof instructionsComponent.setValidationState === 'function') {
    if (key === 'stages') {
      // General stages error - highlight all visible stage fields
      instructionsComponent.setValidationState({ general: true });
    } else {
      // Specific stage error - parse index and field type
      const match = key.match(/stages\[(\d+)\](?:\.(\w+))?(?:\[(\d+)\])?/);
      if (match) {
        const stageIdx = parseInt(match[1], 10);
        const field = match[2]; // 'title', 'instructions', etc.
        const stepIdx = match[3] ? parseInt(match[3], 10) : undefined;
        
        const errorKey = stepIdx !== undefined 
          ? `${stageIdx}.${field}.${stepIdx}` 
          : `${stageIdx}.${field}`;
        
        instructionsComponent.setValidationState({ [errorKey]: true });
      }
    }
  } else {
    console.warn('Instructions component not found or missing setValidationState method');
  }
}


/**
 * Shows error message in the UI
 * @param {HTMLElement} errorElement - Error message element
 * @param {string} errorText - Error text to display
 */
function showErrorMessage(errorElement, errorText) {
  if (errorElement) {
    errorElement.textContent = errorText;
    errorElement.style.display = 'block';
  }
}

/**
 * Hides error message in the UI
 * @param {HTMLElement} errorElement - Error message element
 */
function hideErrorMessage(errorElement) {
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

/**
 * Validates a specific field and updates its error state
 * @param {string} fieldName - Name of the field to validate
 * @param {*} value - Value to validate
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @returns {boolean} - True if field is valid
 */
export function validateField(fieldName, value, shadowRoot) {
  // This can be extended for real-time field validation
  const fieldId = FIELD_MAP[fieldName];
  if (fieldId) {
    const element = shadowRoot.getElementById(fieldId);
    if (element) {
      // Add field-specific validation logic here
      const isValid = value != null && value.toString().trim().length > 0;
      
      if (isValid) {
        element.classList.remove('recipe-form__input--invalid');
      } else {
        element.classList.add('recipe-form__input--invalid');
      }
      
      return isValid;
    }
  }
  return true;
}