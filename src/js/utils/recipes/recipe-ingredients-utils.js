/**
 * @typedef {Object} Ingredient
 * @property {string} amount - The quantity of the ingredient (as a string, e.g. "1", "1/2", "2.5")
 * @property {string} unit - The unit of measurement (e.g. "cup", "tbsp", "g")
 * @property {string} item - The name of the ingredient (e.g. "flour", "sugar")
 */

/**
 * Adjusts ingredient quantities for different serving sizes
 * @param {Ingredient[]} ingredients - Original ingredients with quantities
 * @param {number} originalServings - Original recipe serving count
 * @param {number} newServings - New desired serving count
 * @returns {Ingredient[]} Adjusted ingredients array
 */
export function scaleIngredients(ingredients, originalServings, newServings) {
  if (!Array.isArray(ingredients) || !originalServings || !newServings || originalServings <= 0)
    return ingredients;
  const factor = newServings / originalServings;
  return ingredients.map((ing) => {
    const amountNum = parseFloat(ing.amount);
    return {
      ...ing,
      amount: isNaN(amountNum) ? ing.amount : formatIngredientAmount(amountNum * factor),
    };
  });
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
