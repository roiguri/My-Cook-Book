/**
 * Filter Manager Component Configuration
 * Constants and configuration for filter management functionality
 */

export const CONFIG = {
  COMPONENT_TAG: 'filter-manager',

  // CSS class names
  CLASSES: {
    container: 'filter-manager',
    filterButton: 'filter-button',
    filterBadge: 'filter-badge',
    error: 'error',
  },

  // Element IDs
  IDS: {
    filterButton: 'filter-button',
    filterBadge: 'filter-badge',
    filterModal: 'recipe-filter',
  },

  // Custom events
  EVENTS: {
    filtersChanged: 'filters-changed',
    filterModalRequested: 'filter-modal-requested',
    filterApplied: 'filter-applied',
    filterReset: 'filter-reset',
  },

  // Filter types and values
  FILTER_TYPES: {
    cookingTime: 'cookingTime',
    difficulty: 'difficulty',
    mainIngredient: 'mainIngredient',
    tags: 'tags',
    favoritesOnly: 'favoritesOnly',
  },

  COOKING_TIME_RANGES: {
    '0-30': { min: 0, max: 30 },
    '31-60': { min: 31, max: 60 },
    61: { min: 61, max: Infinity },
  },

  // Default filter state
  DEFAULT_FILTERS: {
    cookingTime: '',
    difficulty: '',
    mainIngredient: '',
    tags: [],
    favoritesOnly: false,
  },

  // Error messages
  ERROR_MESSAGES: {
    modalNotFound: 'Filter modal component not found',
    invalidFilterData: 'Invalid filter data provided',
  },
};

export const ATTRIBUTES = {
  currentFilters: 'current-filters',
  hasActiveFilters: 'has-active-filters',
  showBadge: 'show-badge',
  disabled: 'disabled',
};
