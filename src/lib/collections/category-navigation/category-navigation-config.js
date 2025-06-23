/**
 * Category Navigation Component Configuration
 * Constants and configuration for the category navigation component
 */

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
    tabsLinkActive: 'active',
    dropdown: 'category-dropdown',
    dropdownSelect: 'category-dropdown-select',
  },

  // Events
  EVENTS: {
    categoryChanged: 'category-changed',
  },

  // Default categories
  DEFAULT_CATEGORIES: [
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
  ],

  // Responsive breakpoints
  MOBILE_BREAKPOINT: 768,
};

export const ATTRIBUTES = {
  currentCategory: 'current-category',
  categories: 'categories',
  mobileBreakpoint: 'mobile-breakpoint',
};
