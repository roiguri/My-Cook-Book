/**
 * Unified Recipe Filter Component Styles
 * Shadow DOM styles for the unified recipe filter component
 */

export const styles = `
  :host {
    display: block;
    width: 100%;
    direction: rtl;
  }

  /* Categories Page Layout Mode - replaces .filters-container */
  .unified-recipe-filter.categories-page-layout {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 1rem;
  }

  /* Search bar styling to match .categories-search */
  .unified-recipe-filter.categories-page-layout .categories-search .search-button {
    background-color: var(--submenu-color);
    color: var(--button-color);
    border-radius: 0 4px 4px 0;
    font-size: var(--size-body);
  }

  /* Filter manager positioning */
  .unified-recipe-filter.categories-page-layout filter-manager {
    align-self: stretch;
  }

  /* Category navigation spanning full width */
  .unified-recipe-filter.categories-page-layout category-navigation {
    margin-bottom: 20px;
    grid-column: span 2;
  }

  /* Mobile layout for categories page - matches existing responsive design */
  @media (max-width: 768px) {
    .unified-recipe-filter.categories-page-layout {
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      gap: 10px;
      align-items: start;
      margin-bottom: 1rem;
    }

    .unified-recipe-filter.categories-page-layout .categories-search {
      order: 1;
      grid-column: 1 / -1;
      grid-row: 1;
    }

    .unified-recipe-filter.categories-page-layout category-navigation {
      order: 2;
      grid-column: 1;
      grid-row: 2;
      margin-bottom: 0;
    }

    .unified-recipe-filter.categories-page-layout filter-manager {
      order: 3;
      grid-column: 2;
      grid-row: 2;
      margin-bottom: 0;
    }
  }

  /* Other layout modes for flexibility */
  .unified-recipe-filter.full-layout {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas: 
      "search filter"
      "category category";
    gap: 1rem;
    align-items: start;
    width: 100%;
  }

  .unified-recipe-filter.full-layout filter-search-bar {
    grid-area: search;
  }

  .unified-recipe-filter.full-layout filter-manager {
    grid-area: filter;
  }

  .unified-recipe-filter.full-layout category-navigation {
    grid-area: category;
  }

  .unified-recipe-filter.compact-layout {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  /* Loading State */
  .unified-recipe-filter.loading {
    opacity: 0.7;
    pointer-events: none;
  }

  /* Disabled State */
  .unified-recipe-filter.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Error State */
  .unified-recipe-filter .error {
    color: var(--error-color, #dc3545);
    text-align: center;
    padding: 1rem;
    font-size: var(--size-body, 1rem);
    font-family: var(--body-font, Arial, sans-serif);
  }

  /* Remove focus outline to avoid blue border */
  .unified-recipe-filter:focus-within {
    outline: none;
  }

  /* RTL Support */
  :host([dir="ltr"]) .unified-recipe-filter {
    direction: ltr;
  }

  /* High Contrast Mode */
  @media (prefers-contrast: high) {
    .unified-recipe-filter {
      border: 1px solid currentColor;
      padding: 0.5rem;
    }
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .unified-recipe-filter * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;