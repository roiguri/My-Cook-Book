/**
 * Recipe Presentation Grid Configuration
 * Centralized configuration for the Recipe Presentation Grid component
 */

export const RECIPE_PRESENTATION_GRID_CONFIG = {
  // Default Settings
  DEFAULT_RECIPES_PER_PAGE: 12,
  DEFAULT_CURRENT_PAGE: 1,
  DEFAULT_GRID_LAYOUT: 'responsive',
  DEFAULT_SHOW_PAGINATION: true,
  DEFAULT_SHOW_FAVORITES: false,

  // Grid Layout Types
  GRID_LAYOUTS: {
    RESPONSIVE: 'responsive',
    FIXED_2: 'fixed-2',
    FIXED_3: 'fixed-3', 
    FIXED_4: 'fixed-4'
  },

  // Messages
  NO_RESULTS_MESSAGE: 'לא נמצאו מתכונים',
  NO_RESULTS_SUGGESTION: 'נסה לשנות את הקריטריונים או החיפוש',
  LOADING_MESSAGE: 'טוען מתכונים...',
  ERROR_MESSAGE: 'שגיאה בטעינת המתכונים',

  // CSS Classes
  CSS_CLASSES: {
    CONTAINER: 'recipe-presentation-grid',
    GRID_CONTAINER: 'grid-container',
    RECIPE_GRID: 'recipe-grid',
    CARD_CONTAINER: 'recipe-card-container',
    PAGINATION_CONTAINER: 'pagination-container',
    NO_RESULTS: 'no-results',
    NO_RESULTS_MESSAGE: 'no-results-message',
    LOADING_STATE: 'loading-state',
    ERROR_STATE: 'error-state',
    TRANSITIONING: 'transitioning'
  },

  // Component Selectors
  SELECTORS: {
    RECIPE_GRID: '.recipe-grid',
    PAGINATION: 'recipe-pagination',
    PAGINATION_CONTAINER: '.pagination-container',
    RECIPE_CARD: 'recipe-card',
    CARD_CONTAINER: '.recipe-card-container'
  },

  // Event Names
  EVENTS: {
    PAGE_CHANGED: 'page-changed',
    RECIPE_SELECTED: 'recipe-selected',
    RECIPES_LOADED: 'recipes-loaded',
    FAVORITE_CHANGED: 'favorite-changed',
    RECIPE_CARD_OPEN: 'recipe-card-open',
    RECIPE_FAVORITE_CHANGED: 'recipe-favorite-changed'
  },

  // Attribute Names
  ATTRIBUTES: {
    RECIPES_PER_PAGE: 'recipes-per-page',
    CURRENT_PAGE: 'current-page',
    SHOW_PAGINATION: 'show-pagination',
    SHOW_FAVORITES: 'show-favorites',
    GRID_LAYOUT: 'grid-layout',
    RECIPE_ID: 'recipe-id',
    LAYOUT: 'layout'
  },

  // Timing
  TRANSITION_DELAY: 150, // milliseconds
  LAZY_LOADING_DELAY: 10, // milliseconds

  // Responsive Breakpoints (for reference)
  BREAKPOINTS: {
    SMALL_MOBILE: 480,
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
    LARGE_DESKTOP: 1400
  },

  // Grid Column Minimums (for responsive layout)
  COLUMN_MIN_WIDTHS: {
    MOBILE: 220,
    TABLET: 250, 
    DESKTOP: 280,
    LARGE_DESKTOP: 300
  },

  // Card Height Minimums
  CARD_MIN_HEIGHTS: {
    MOBILE: 260,
    TABLET: 300,
    DESKTOP: 320,
    LARGE_DESKTOP: 340
  }
};