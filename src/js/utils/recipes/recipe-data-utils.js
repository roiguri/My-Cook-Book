/*
 * Recipe Data Utilities
 * --------------------
 * This module provides helper functions for recipe data formatting, validation, and Firestore operations.
 *
 * Exported Methods:
 *
 *   - formatRecipeData(rawData):
 *       Format raw Firestore recipe data for display/use in the app.
 *   - validateRecipeData(recipeData):
 *       Validate a recipe object before saving to Firestore.
 *   - calculateTotalTime(prepTime, waitTime):
 *       Calculate total recipe time from prep and wait times.
 *   - formatCookingTime(minutes):
 *       Format a time in minutes into a readable string.
 *   - getTimeClass(totalMinutes):
 *       Get a CSS class for quick/medium/long recipes by time.
 *   - getDifficultyClass(difficulty):
 *       Map difficulty to a CSS class.
 *   - getLocalizedCategoryName(categoryId):
 *       Get a localized display name for a category.
 *   - getCategoryIcon(category):
 *       Get an icon for a category.
 *   - getRecipesForCards(options):
 *       Fetch recipes for display in cards (with filters/options).
 *   - getRecipeById(recipeId):
 *       Fetch a single complete recipe by ID.
 */

import { FirestoreService } from '../../services/firestore-service.js';

/**
 * @typedef {Object} Recipe
 * @property {string} [id]
 * @property {string} name
 * @property {string} category
 * @property {number} prepTime
 * @property {number} waitTime
 * @property {string} difficulty
 * @property {string} mainIngredient
 * @property {string[]} tags
 * @property {number} servings
 * @property {Array<{ amount: string, unit: string, item: string }>} ingredients
 * @property {Array<{ title: string, instructions: string[] }>} [stages]
 * @property {string[]} [instructions]
 * @property {Array<{ file: string, isPrimary: boolean, access: string, uploadedBy: string }>} [images]
 * @property {string[]} [comments]
 * @property {boolean} [approved]
 * @property {Date|string|number} [createdAt]
 * @property {Date|string|number} [updatedAt]
 */

// Category mapping and icons
const CATEGORY_MAP = {
  appetizers: 'מנות ראשונות',
  'main-courses': 'מנות עיקריות',
  'side-dishes': 'תוספות',
  'soups-stews': 'מרקים ותבשילים',
  salads: 'סלטים',
  desserts: 'קינוחים',
  'breakfast-brunch': 'ארוחות בוקר',
  snacks: 'חטיפים',
  beverages: 'משקאות',
};

const CATEGORY_ICONS = {
  appetizers: '🥗',
  'main-courses': '🍖',
  'side-dishes': '🥔',
  'soups-stews': '🥘',
  salads: '🥬',
  desserts: '🍰',
  'breakfast-brunch': '🍳',
  snacks: '🥨',
  beverages: '🥤',
  else: '🍽️',
};

/**
 * Formats raw recipe data from Firestore for display
 * @param {Object} rawData - Raw recipe data from Firestore
 * @returns {Recipe} Formatted recipe data ready for display
 */
export function formatRecipeData(rawData) {
  if (!rawData || typeof rawData !== 'object') return null;
  return {
    id: rawData.id || '',
    name: rawData.name || '',
    category: rawData.category || '',
    prepTime: typeof rawData.prepTime === 'number' ? rawData.prepTime : 0,
    waitTime: typeof rawData.waitTime === 'number' ? rawData.waitTime : 0,
    difficulty: rawData.difficulty || '',
    mainIngredient: rawData.mainIngredient || '',
    tags: Array.isArray(rawData.tags) ? rawData.tags : [],
    servings: typeof rawData.servings === 'number' ? rawData.servings : 1,
    ingredients: Array.isArray(rawData.ingredients) ? rawData.ingredients : [],
    stages: Array.isArray(rawData.stages) ? rawData.stages : undefined,
    instructions: Array.isArray(rawData.instructions) ? rawData.instructions : undefined,
    images: Array.isArray(rawData.images) ? rawData.images : [],
    comments: Array.isArray(rawData.comments) ? rawData.comments : [],
    approved: typeof rawData.approved === 'boolean' ? rawData.approved : false,
    createdAt: rawData.createdAt || null,
    updatedAt: rawData.updatedAt || null,
  };
}

/**
 * Validates recipe data before saving to Firestore
 * @param {Object} recipeData - Recipe data to validate
 * @returns {Object} Validation result with isValid flag and error messages
 */
export function validateRecipeData(recipeData) {
  const errors = {};
  if (!recipeData || typeof recipeData !== 'object') {
    return { isValid: false, errors: { general: 'Invalid recipe data object.' } };
  }

  // Name
  if (!recipeData.name || typeof recipeData.name !== 'string' || !recipeData.name.trim()) {
    errors.name = 'חובה למלא את שם המתכון.';
  }

  // Category
  const validCategories = Object.keys(CATEGORY_MAP);
  if (!recipeData.category || !validCategories.includes(recipeData.category)) {
    errors.category = 'חובה למלא את קטגוריית המתכון.';
  }

  // Prep Time
  if (typeof recipeData.prepTime !== 'number' || recipeData.prepTime < 0) {
    errors.prepTime = 'חובה למלא את זמן ההכנה.';
  }

  // Wait Time
  if (typeof recipeData.waitTime !== 'number' || recipeData.waitTime < 0) {
    errors.waitTime = 'חובה למלא את זמן ההמתנה.';
  }

  // Difficulty
  if (
    !recipeData.difficulty ||
    typeof recipeData.difficulty !== 'string' ||
    !recipeData.difficulty.trim()
  ) {
    errors.difficulty = 'חובה למלא את רמת הקושי.';
  }

  // Main Ingredient
  if (
    !recipeData.mainIngredient ||
    typeof recipeData.mainIngredient !== 'string' ||
    !recipeData.mainIngredient.trim()
  ) {
    errors.mainIngredient = 'חובה למלא את המרכיב העיקרי.';
  }

  // Servings
  if (
    typeof recipeData.servings !== 'number' ||
    !Number.isInteger(recipeData.servings) ||
    recipeData.servings < 1
  ) {
    errors.servings = 'מספר המנות חייב להיות מספר שלם וחיובי.';
  }

  // Ingredients
  if (!Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
    errors.ingredients = 'חובה למלא לפחות אחד מהמרכיבים.';
  } else {
    recipeData.ingredients.forEach((ing, idx) => {
      if (!ing || typeof ing !== 'object') {
        errors[`ingredients[${idx}]`] = 'חובה למלא את המרכיב.';
        return;
      }
      if (!ing.amount || typeof ing.amount !== 'string' || !ing.amount.trim()) {
        errors[`ingredients[${idx}].amount`] = 'חובה למלא את הכמות.';
      }
      if (!ing.unit || typeof ing.unit !== 'string' || !ing.unit.trim()) {
        errors[`ingredients[${idx}].unit`] = 'חובה למלא את היחידה.';
      }
      if (!ing.item || typeof ing.item !== 'string' || !ing.item.trim()) {
        errors[`ingredients[${idx}].item`] = 'חובה למלא את המרכיב.';
      }
    });
  }

  // Instructions vs Stages (mutual exclusivity)
  const hasInstructions =
    Array.isArray(recipeData.instructions) && recipeData.instructions.length > 0;
  const hasStages = Array.isArray(recipeData.stages) && recipeData.stages.length > 0;
  if (hasInstructions && hasStages) {
    errors.instructions = 'לא ניתן להציג שני סוגי של הוראות.';
    errors.stages = 'לא ניתן להציג שני סוגי של הוראות.';
  } else if (!hasInstructions && !hasStages) {
    errors.instructions = 'חובה למלא את הוראות או שלבים.';
    errors.stages = 'חובה למלא את הוראות או שלבים.';
  } else if (hasInstructions) {
    recipeData.instructions.forEach((step, idx) => {
      if (!step || typeof step !== 'string' || !step.trim()) {
        errors[`instructions[${idx}]`] = 'חובה למלא את השלב.';
      }
    });
  } else if (hasStages) {
    recipeData.stages.forEach((stage, sIdx) => {
      if (!stage || typeof stage !== 'object') {
        errors[`stages[${sIdx}]`] = 'חובה למלא את השלב.';
        return;
      }
      if (!stage.title || typeof stage.title !== 'string' || !stage.title.trim()) {
        errors[`stages[${sIdx}].title`] = 'חובה למלא את שם השלב.';
      }
      if (!Array.isArray(stage.instructions) || stage.instructions.length === 0) {
        errors[`stages[${sIdx}].instructions`] = 'חובה למלא לפחות אחת מההוראות.';
      } else {
        stage.instructions.forEach((step, iIdx) => {
          if (!step || typeof step !== 'string' || !step.trim()) {
            errors[`stages[${sIdx}].instructions[${iIdx}]`] = 'חובה למלא את השלב.';
          }
        });
      }
    });
  }

  // Optional fields type validation
  if ('tags' in recipeData && recipeData.tags !== undefined) {
    if (
      !Array.isArray(recipeData.tags) ||
      !recipeData.tags.every((tag) => typeof tag === 'string')
    ) {
      errors.tags = 'פורמט שגוי עבור התגיות.';
    }
  }
  if ('images' in recipeData && recipeData.images !== undefined) {
    if (
      !Array.isArray(recipeData.images) ||
      !recipeData.images.every((img) => typeof img === 'object' && img !== null)
    ) {
      errors.images = 'פורמט שגוי עבור התמונות.';
    }
  }
  if ('comments' in recipeData && recipeData.comments !== undefined) {
    if (
      !Array.isArray(recipeData.comments) ||
      !recipeData.comments.every((c) => typeof c === 'string')
    ) {
      errors.comments = 'פורמט שגוי עבור ההערות.';
    }
  }
  if ('approved' in recipeData && recipeData.approved !== undefined) {
    if (typeof recipeData.approved !== 'boolean') {
      errors.approved = 'פורמט שגוי עבור האישור.';
    }
  }
  if (
    'createdAt' in recipeData &&
    recipeData.createdAt !== undefined &&
    recipeData.createdAt !== null
  ) {
    if (
      !(
        typeof recipeData.createdAt === 'number' ||
        typeof recipeData.createdAt === 'string' ||
        recipeData.createdAt instanceof Date
      )
    ) {
      errors.createdAt = 'טעות לא ידועה, אנא נסה שנית.';
    }
  }
  if (
    'updatedAt' in recipeData &&
    recipeData.updatedAt !== undefined &&
    recipeData.updatedAt !== null
  ) {
    if (
      !(
        typeof recipeData.updatedAt === 'number' ||
        typeof recipeData.updatedAt === 'string' ||
        recipeData.updatedAt instanceof Date
      )
    ) {
      errors.updatedAt = 'טעות לא ידועה, אנא נסה שנית.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

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
    קלה: 'easy',
    בינונית: 'medium',
    קשה: 'hard',
  };
  return difficultyMap[difficulty] || 'medium';
}

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
export async function getRecipesForCards(options = {}) {
  const queryParams = { where: [], orderBy: ['createdAt', 'desc'] };
  if (options.category) {
    queryParams.where.push(['category', '==', options.category]);
  }
  if (options.approvedOnly) {
    queryParams.where.push(['approved', '==', true]);
  }
  if (options.limit) {
    queryParams.limit = options.limit;
  }
  const docs = await FirestoreService.queryDocuments('recipes', queryParams);
  return docs.map(formatRecipeData);
}

/**
 * Fetch a single complete recipe by ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Object>} Complete recipe object
 */
export async function getRecipeById(recipeId) {
  const doc = await FirestoreService.getDocument('recipes', recipeId);
  return doc ? formatRecipeData(doc) : null;
}
