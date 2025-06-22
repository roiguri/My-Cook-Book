/**
 * Recipe Pagination Component Configuration
 * Constants and configuration for the recipe pagination component
 */

export const CONFIG = {
  // Component selector
  COMPONENT_TAG: 'recipe-pagination',
  
  // CSS classes
  CSS_CLASSES: {
    container: 'recipe-pagination',
    button: 'pagination-button',
    prevButton: 'prev-button',
    nextButton: 'next-button',
    pageInfo: 'page-info'
  },
  
  // Events
  EVENTS: {
    pageChanged: 'page-changed'
  },
  
  // Default text
  DEFAULT_TEXT: {
    prevButton: 'הקודם',
    nextButton: 'הבא',
    pageInfo: 'עמוד {current} מתוך {total} ({totalItems} מתכונים)'
  }
};

export const ATTRIBUTES = {
  currentPage: 'current-page',
  totalPages: 'total-pages',
  totalItems: 'total-items',
  prevText: 'prev-text',
  nextText: 'next-text'
};