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
  const { isValid, errors } = validateRecipeData(recipeData);
  
  // Clear all previous error states
  clearValidationErrors(shadowRoot);
  
  // Reset metadata field errors collection
  shadowRoot._metadataFieldErrors = {};
  
  // Show error messages and highlight invalid fields
  const errorMessage = shadowRoot.querySelector('.recipe-form__error-message');
  
  if (!isValid) {
    let errorText = 'ישנם שגיאות בטופס. אנא תקן אותן.';
    
    if (errors) {
      highlightFieldErrors(errors, shadowRoot);
      
      // Apply all collected metadata field errors at once
      if (shadowRoot._metadataFieldErrors && Object.keys(shadowRoot._metadataFieldErrors).length > 0) {
        const metadataComponent = shadowRoot.getElementById('metadata-fields');
        if (metadataComponent && typeof metadataComponent.setValidationState === 'function') {
          metadataComponent.setValidationState(shadowRoot._metadataFieldErrors);
        }
      }
      
      errorText = Object.values(errors).join(' ');
    }
    
    showErrorMessage(errorMessage, errorText);
  } else {
    hideErrorMessage(errorMessage);
  }
  
  return isValid;
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
  
  // Clear validation errors from main component fields
  shadowRoot
    .querySelectorAll('.recipe-form__input:not(recipe-metadata-fields .recipe-form__input), .recipe-form__select:not(recipe-metadata-fields .recipe-form__select), .recipe-form__textarea:not(recipe-metadata-fields .recipe-form__textarea)')
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
  Object.keys(errors).forEach((key) => {
    if (key.startsWith('ingredients[')) {
      highlightIngredientField(key, shadowRoot);
    } else if (key.startsWith('instructions[')) {
      highlightInstructionField(key, shadowRoot);
    } else if (key.startsWith('stages[')) {
      highlightStageField(key, shadowRoot);
    } else {
      highlightMainField(key, shadowRoot);
    }
  });
}

/**
 * Highlights ingredient field errors
 * @param {string} key - Error key (e.g., "ingredients[0].amount")
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function highlightIngredientField(key, shadowRoot) {
  const match = key.match(/ingredients\[(\d+)\]\.(\w+)/);
  if (match) {
    const idx = parseInt(match[1], 10);
    const field = match[2];
    const entry = shadowRoot.querySelectorAll('.recipe-form__ingredient-entry')[idx];
    if (entry) {
      // Map validation field names to actual CSS class names
      const fieldMapping = {
        amount: 'quantity',
        unit: 'unit',
        item: 'item'
      };
      const cssClass = fieldMapping[field] || field;
      const input = entry.querySelector(`.recipe-form__input--${cssClass}`);
      if (input) input.classList.add('recipe-form__input--invalid');
    }
  }
}

/**
 * Highlights instruction field errors
 * @param {string} key - Error key (e.g., "instructions[0]")
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function highlightInstructionField(key, shadowRoot) {
  const match = key.match(/instructions\[(\d+)\]/);
  if (match) {
    const idx = parseInt(match[1], 10);
    const input = shadowRoot.querySelectorAll(
      '.recipe-form__stages input[type="text"]',
    )[idx];
    if (input) input.classList.add('recipe-form__input--invalid');
  }
}

/**
 * Highlights stage field errors
 * @param {string} key - Error key (e.g., "stages[0].title")
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function highlightStageField(key, shadowRoot) {
  const match = key.match(/stages\[(\d+)\](?:\.(\w+))?/);
  if (match) {
    const sIdx = parseInt(match[1], 10);
    const field = match[2];
    const stage = shadowRoot.querySelectorAll('.recipe-form__steps')[sIdx];
    
    if (stage && field === 'title') {
      const input = stage.querySelector('.recipe-form__input--stage-name');
      if (input) input.classList.add('recipe-form__input--invalid');
    }
    
    if (stage && field === 'instructions') {
      stage.querySelectorAll('input[type="text"]').forEach((input) => {
        input.classList.add('recipe-form__input--invalid');
      });
    }
  }
}

/**
 * Highlights main form field errors
 * @param {string} key - Error key (e.g., "name", "category")
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 */
function highlightMainField(key, shadowRoot) {
  const fieldId = FIELD_MAP[key];
  if (fieldId) {
    // Check if this is a metadata field
    const metadataFields = ['name', 'dish-type', 'prep-time', 'wait-time', 'servings-form', 'difficulty', 'main-ingredient', 'tags'];
    
    if (metadataFields.includes(fieldId)) {
      // Store metadata field error for batch processing
      if (!shadowRoot._metadataFieldErrors) {
        shadowRoot._metadataFieldErrors = {};
      }
      shadowRoot._metadataFieldErrors[key] = true;
    } else {
      // Handle main component fields directly
      const el = shadowRoot.getElementById(fieldId);
      if (el) el.classList.add('recipe-form__input--invalid');
    }
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