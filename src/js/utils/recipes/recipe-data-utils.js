/**
 * Formats raw recipe data from Firestore for display
 * @param {Object} rawData - Raw recipe data from Firestore
 * @returns {Object} Formatted recipe data ready for display
 */
export function formatRecipeData(rawData) {}

/**
 * Validates recipe data before saving to Firestore
 * @param {Object} recipeData - Recipe data to validate
 * @returns {Object} Validation result with isValid flag and error messages
 */
export function validateRecipeData(recipeData) {}

/**
 * Calculates total recipe time from prep and cooking times
 * @param {number} prepTime - Preparation time in minutes
 * @param {number} waitTime - Cooking/waiting time in minutes
 * @returns {number} Total recipe time in minutes
 */
export function calculateTotalTime(prepTime, waitTime) {
  return (Number(prepTime) || 0) + (Number(waitTime) || 0);
}

/**
 * Formats cooking time into readable string format
 * @param {number} minutes - Total time in minutes
 * @returns {string} Formatted time string (e.g., "שעה ו-30 דקות")
 */
export function formatCookingTime(minutes) {
  if (minutes <= 60) return `${minutes} דקות`;
  if (minutes < 120) return `שעה ו-${minutes % 60} דקות`;
  if (minutes === 120) return 'שעתיים';
  if (minutes < 180) return `שעתיים ו-${minutes % 60} דקות`;
  if (minutes % 60 === 0) return `${Math.floor(minutes / 60)} שעות`;
  return `${Math.floor(minutes / 60)} שעות ו-${minutes % 60} דקות`;
}

/**
 * Determines time-based recipe class (quick/medium/long)
 * @param {number} totalMinutes - Total cooking time in minutes
 * @returns {string} Time class ('quick', 'medium', or 'long')
 */
export function getTimeClass(totalMinutes) {
  if (totalMinutes <= 30) return 'quick';
  if (totalMinutes <= 60) return 'medium';
  return 'long';
}

/**
 * Maps difficulty level to CSS class
 * @param {string} difficulty - Difficulty level (e.g., "קלה", "בינונית", "קשה")
 * @returns {string} CSS class name
 */
export function getDifficultyClass(difficulty) {
  const difficultyMap = {
    'קלה': 'easy',
    'בינונית': 'medium',
    'קשה': 'hard',
  };
  return difficultyMap[difficulty] || 'medium';
}

// Category mapping and icons
const CATEGORY_MAP = {
  'appetizers': 'מנות ראשונות',
  'main-courses': 'מנות עיקריות',
  'side-dishes': 'תוספות',
  'soups-stews': 'מרקים ותבשילים',
  'salads': 'סלטים',
  'desserts': 'קינוחים',
  'breakfast-brunch': 'ארוחות בוקר',
  'snacks': 'חטיפים',
  'beverages': 'משקאות',
};

const CATEGORY_ICONS = {
  'appetizers': '🥗',
  'main-courses': '🍖',
  'side-dishes': '🥔',
  'soups-stews': '🥘',
  'salads': '🥬',
  'desserts': '🍰',
  'breakfast-brunch': '🍳',
  'snacks': '🥨',
  'beverages': '🥤',
  'else': '🍽️',
};

/**
 * Maps category ID to display name
 * @param {string} categoryId - Category identifier
 * @returns {string} Localized category name
 */
export function getLocalizedCategoryName(categoryId) {
  return CATEGORY_MAP[categoryId] || categoryId;
}

/**
 * Gets icon for category
 * @param {string} category - Category ID
 * @returns {string} Icon HTML or character
 */
export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.else;
}

/**
 * Fetch recipes for display in recipe cards (lightweight version)
 * @param {Object} options - Query options (category, limit, approved only, etc.)
 * @returns {Promise<Array>} Array of recipe card data objects
 */
export async function getRecipesForCards(options = {}) {}

/**
 * Fetch a single complete recipe by ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Object>} Complete recipe object
 */
export async function getRecipeById(recipeId) {} 