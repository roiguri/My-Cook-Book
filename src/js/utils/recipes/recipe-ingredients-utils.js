/*
 * Recipe Ingredients Utilities
 * ---------------------------
 * This module provides helper functions for ingredient scaling, formatting, validation, and extraction.
 *
 * Exported Methods:
 *
 *   - scaleIngredients(ingredients, originalServings, newServings):
 *       Adjust ingredient quantities for a new serving size.
 *   - formatIngredientAmount(value):
 *       Format a number for display in ingredient lists.
 *   - extractIngredientNames(ingredientsArray):
 *       Extract a plain list of ingredient names from an array.
 *   - validateIngredient(ingredient):
 *       Validate the structure and content of an ingredient object.
 *   - createEmptyIngredient():
 *       Create a blank ingredient object.
 */

/**
 * @typedef {Object} Ingredient
 * @property {string} amount - The quantity of the ingredient (as a string, e.g. "1", "1/2", "2.5")
 * @property {string} unit - The unit of measurement (e.g. "cup", "tbsp", "g")
 * @property {string} item - The name of the ingredient (e.g. "flour", "sugar")
 */

/**
 * Adjusts ingredient quantities for different serving sizes
 * Supports both flat ingredient arrays and sectioned ingredient objects
 * @param {Ingredient[]|{sections: Array}} ingredients - Original ingredients with quantities
 * @param {number} originalServings - Original recipe serving count
 * @param {number} newServings - New desired serving count
 * @returns {Ingredient[]|{sections: Array}} Adjusted ingredients in same format as input
 */
export function scaleIngredients(ingredients, originalServings, newServings) {
  if (!originalServings || !newServings || originalServings <= 0) return ingredients;

  const factor = newServings / originalServings;

  // Helper function to scale a single ingredient
  const scaleIngredient = (ing) => {
    const amountNum = parseFloat(ing.amount);
    return {
      ...ing,
      amount: isNaN(amountNum) ? ing.amount : formatIngredientAmount(amountNum * factor),
    };
  };

  // Handle sectioned ingredients format (Firebase direct array format)
  if (Array.isArray(ingredients) && ingredients.length > 0 && ingredients[0].items) {
    return ingredients.map((section) => ({
      ...section,
      items: section.items.map(scaleIngredient),
    }));
  }

  // Handle sectioned ingredients format (form component format with sections wrapper)
  if (
    ingredients &&
    typeof ingredients === 'object' &&
    !Array.isArray(ingredients) &&
    ingredients.sections
  ) {
    return {
      ...ingredients,
      sections: ingredients.sections.map((section) => ({
        ...section,
        items: section.items.map(scaleIngredient),
      })),
    };
  }

  // Handle flat ingredients array (original format)
  if (!Array.isArray(ingredients)) return ingredients;
  return ingredients.map(scaleIngredient);
}

/**
 * Formats a number value for display in ingredients
 * @param {number|string} value - Numeric value
 * @returns {string} Formatted value (removes trailing zeros, etc.)
 */
export function formatIngredientAmount(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return value?.toString() || '';
  if (Number.isInteger(num)) return num.toString();
  return num
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.[1-9]*)0+$/, '$1');
}

/**
 * Extracts a plain list of ingredient names
 * @param {Ingredient[]} ingredientsArray - Full ingredients array with amounts and units
 * @returns {string[]} Plain list of ingredient names
 */
export function extractIngredientNames(ingredientsArray) {
  if (!Array.isArray(ingredientsArray)) return [];
  return ingredientsArray.map((ing) => ing.item).filter(Boolean);
}

// TODO: provide a more comprehensive validation for the ingredient object
//       validate the amount is a number and unit is from a list of allowed units
/**
 * Validates ingredient data structure
 * @param {Ingredient} ingredient - Ingredient object to validate
 * @returns {boolean} Whether ingredient is valid
 */
export function validateIngredient(ingredient) {
  if (!ingredient || typeof ingredient !== 'object') return false;
  return (
    typeof ingredient.amount === 'string' &&
    ingredient.amount.trim() !== '' &&
    typeof ingredient.unit === 'string' &&
    ingredient.unit.trim() !== '' &&
    typeof ingredient.item === 'string' &&
    ingredient.item.trim() !== ''
  );
}

/**
 * Creates a blank ingredient object
 * @returns {Ingredient} New ingredient with empty fields
 */
export function createEmptyIngredient() {
  return { amount: '', unit: '', item: '' };
}
