/**
 * Category Navigation Component Configuration
 * Constants and configuration for the category navigation component
 */

import { CATEGORY_MAP } from '../../../js/utils/recipes/recipe-data-utils.js';

// Generate categories array from central source of truth
const generateDefaultCategories = () => {
  const categories = [{ value: 'all', label: 'כל הקטגוריות' }];

  // Add all categories from CATEGORY_MAP
  Object.entries(CATEGORY_MAP).forEach(([value, label]) => {
    categories.push({ value, label });
  });

  return categories;
};

export const CONFIG = {
  // Component selector
  COMPONENT_TAG: 'category-navigation',

  // CSS classes
  CSS_CLASSES: {
    container: 'category-navigation',
    tabs: 'category-tabs',
    tabsList: 'category-tabs-list',
    tabsItem: 'category-tabs-item',
    tabsLink: 'category-tabs-link',
    tabsLinkActive: 'bdg--active',
    dropdown: 'category-dropdown',
    dropdownSelect: 'select-ctrl',
  },

  // Events
  EVENTS: {
    categoryChanged: 'category-changed',
  },

  // Default categories - dynamically generated from CATEGORY_MAP
  DEFAULT_CATEGORIES: generateDefaultCategories(),

  // Responsive breakpoints
  MOBILE_BREAKPOINT: 768,
};

export const ATTRIBUTES = {
  currentCategory: 'current-category',
  categories: 'categories',
  mobileBreakpoint: 'mobile-breakpoint',
};
