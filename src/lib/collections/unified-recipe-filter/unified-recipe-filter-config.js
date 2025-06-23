/**
 * Unified Recipe Filter Configuration
 * Centralized configuration for the unified recipe filter component
 */

export const CONFIG = {
  // Component identification
  COMPONENT_TAG: 'unified-recipe-filter',
  
  // Default state
  DEFAULT_STATE: {
    currentCategory: 'all',
    searchQuery: '',
    filters: {
      cookingTime: '',
      difficulty: '',
      mainIngredient: '',
      tags: [],
      favoritesOnly: false
    },
    hasActiveFilters: false
  },

  // Internal component tags
  INTERNAL_COMPONENTS: {
    searchBar: 'filter-search-bar',
    categoryNav: 'category-navigation', 
    filterManager: 'filter-manager'
  },

  // CSS classes
  CSS_CLASSES: {
    container: 'unified-recipe-filter',
    searchSection: 'filter-search-section',
    categorySection: 'filter-category-section', 
    filterSection: 'filter-manager-section',
    compactLayout: 'compact-layout',
    fullLayout: 'full-layout'
  },

  // Events emitted by this component
  EVENTS: {
    filtersChanged: 'unified-filters-changed',
    searchChanged: 'unified-search-changed',
    categoryChanged: 'unified-category-changed',
    stateChanged: 'unified-state-changed'
  },

  // Layout modes
  LAYOUT_MODES: {
    full: 'full',      // All components visible
    compact: 'compact', // Optimized for mobile
    categoriesPage: 'categories-page' // Matches existing categories page layout
  },

  // Breakpoints
  BREAKPOINTS: {
    mobile: 768,
    tablet: 1024
  },

  // Error messages
  ERROR_MESSAGES: {
    templateNotFound: 'נכשל בטעינת תבנית הרכיב',
    componentNotFound: 'רכיב פנימי לא נמצא',
    invalidState: 'מצב רכיב לא תקין'
  }
};

export const ATTRIBUTES = {
  currentCategory: 'current-category',
  searchQuery: 'search-query', 
  currentFilters: 'current-filters',
  hasActiveFilters: 'has-active-filters',
  layoutMode: 'layout-mode',
  categories: 'categories',
  baseRecipes: 'base-recipes',
  disabled: 'disabled'
};

// Default categories (matches exactly the original category-navigation component)
export const DEFAULT_CATEGORIES = [
  { value: 'all', label: 'כל הקטגוריות' },
  { value: 'appetizers', label: 'מנות ראשונות' },
  { value: 'main-courses', label: 'מנות עיקריות' },
  { value: 'side-dishes', label: 'תוספות' },
  { value: 'soups-stews', label: 'מרקים ותבשילים' },
  { value: 'salads', label: 'סלטים' },
  { value: 'desserts', label: 'קינוחים' },
  { value: 'breakfast-brunch', label: 'ארוחות בוקר' },
  { value: 'snacks', label: 'חטיפים' },
  { value: 'beverages', label: 'משקאות' },
];