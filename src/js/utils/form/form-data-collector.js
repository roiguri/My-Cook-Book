/**
 * Form Data Collector Utilities
 * ------------------------------
 * Extracted data collection logic from RecipeFormComponent.
 * Handles collecting form data from various form sections and converting to recipe data structure.
 */

import authService from '../../services/auth-service.js';

/**
 * Collects all form data and converts it to recipe data structure
 * @param {ShadowRoot} shadowRoot - The component's shadow root for DOM access
 * @returns {Object} - Complete recipe data object
 */
export function collectRecipeFormData(shadowRoot) {
  // Get metadata from the metadata fields component
  const metadataComponent = shadowRoot.getElementById('metadata-fields');
  const metadataData = metadataComponent ? metadataComponent.getFormData() : {};
  
  const recipeData = {
    ...metadataData,
    ingredients: collectIngredients(shadowRoot),
    approved: false,
  };

  // Collect instructions/stages
  const { instructions, stages } = collectInstructionsAndStages(shadowRoot);
  if (stages) {
    recipeData.stages = stages;
  } else if (instructions) {
    recipeData.instructions = instructions;
  }

  // Collect images
  const { images, toDelete } = collectImages(shadowRoot);
  recipeData.images = images;
  recipeData.toDelete = toDelete;

  // Collect comments
  const comments = collectComments(shadowRoot);
  if (comments) {
    recipeData.comments = comments;
  }

  return recipeData;
}


/**
 * Collects ingredient data from the ingredients list component
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @returns {Array} - Array of ingredient objects
 */
function collectIngredients(shadowRoot) {
  const ingredientsList = shadowRoot.getElementById('ingredients-list');
  if (ingredientsList && typeof ingredientsList.getIngredients === 'function') {
    return ingredientsList.getIngredients();
  }
  return [];
}

/**
 * Collects instructions and stages data
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @returns {Object} - Object with either instructions array or stages array
 */
function collectInstructionsAndStages(shadowRoot) {
  const stagesContainers = shadowRoot.querySelectorAll('.recipe-form__steps');
  
  if (stagesContainers.length > 1) {
    // Multiple stages mode
    const stages = [];
    
    stagesContainers.forEach((container, index) => {
      const stageNameInput = container.querySelector('.recipe-form__input--stage-name');
      const stageTitle = stageNameInput ? stageNameInput.value.trim() : `שלב ${index + 1}`;
      
      const instructions = Array.from(
        container.querySelectorAll('.recipe-form__step input[type="text"]')
      )
        .map((input) => input.value.trim())
        .filter((instruction) => instruction.length > 0);
      
      if (instructions.length > 0) {
        stages.push({ title: stageTitle, instructions });
      }
    });
    
    return { stages };
  } else {
    // Single stage mode - just instructions
    const instructions = Array.from(
      shadowRoot
        .querySelector('.recipe-form__stages')
        .querySelectorAll('input[type="text"]')
    )
      .map((input) => input.value.trim())
      .filter((instruction) => instruction.length > 0);
    
    return { instructions };
  }
}

/**
 * Collects image data from the image handler
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @returns {Object} - Object with images array and toDelete array
 */
function collectImages(shadowRoot) {
  const imageHandler = shadowRoot.getElementById('recipe-images');
  
  if (!imageHandler) {
    return { images: [], toDelete: [] };
  }
  
  const images = imageHandler.getImages();
  const toDelete = typeof imageHandler.getRemovedImages === 'function' 
    ? imageHandler.getRemovedImages() 
    : [];

  const processedImages = images.map((img) => {
    if (img.file) {
      // New image to upload
      return {
        file: img.file,
        isPrimary: img.isPrimary,
        access: 'public',
        uploadedBy: authService.getCurrentUser()?.uid || 'anonymous',
        source: 'new',
      };
    } else {
      // Existing image to keep
      return {
        id: img.id,
        isPrimary: img.isPrimary,
        full: img.full,
        compressed: img.compressed,
        access: img.access,
        uploadedBy: img.uploadedBy,
        fileName: img.fileName,
        uploadTimestamp: img.uploadTimestamp,
        source: 'existing',
      };
    }
  });

  return { images: processedImages, toDelete };
}

/**
 * Collects comments from the comments field
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @returns {string[]|null} - Array with comments or null if empty
 */
function collectComments(shadowRoot) {
  const commentsElement = shadowRoot.getElementById('comments');
  const comments = commentsElement ? commentsElement.value.trim() : '';
  return comments.length > 0 ? [comments] : null;
}

/**
 * Collects data for a specific section (for partial updates)
 * @param {ShadowRoot} shadowRoot - The component's shadow root
 * @param {string} section - Section name ('metadata', 'ingredients', 'instructions', 'images', 'comments')
 * @returns {Object} - Section-specific data
 */
export function collectSectionData(shadowRoot, section) {
  switch (section) {
    case 'metadata':
      const metadataComponent = shadowRoot.getElementById('metadata-fields');
      return metadataComponent ? metadataComponent.getFormData() : {};
    
    case 'ingredients':
      return { ingredients: collectIngredients(shadowRoot) };
    
    case 'instructions':
      return collectInstructionsAndStages(shadowRoot);
    
    case 'images':
      return collectImages(shadowRoot);
    
    case 'comments':
      return { comments: collectComments(shadowRoot) };
    
    default:
      return {};
  }
}

/**
 * Validates that required data is present for submission
 * @param {Object} recipeData - Recipe data to validate
 * @returns {boolean} - True if minimum required data is present
 */
export function hasMinimumRequiredData(recipeData) {
  return !!(
    recipeData.name &&
    recipeData.category &&
    recipeData.ingredients.length > 0 &&
    (recipeData.instructions?.length > 0 || recipeData.stages?.length > 0)
  );
}