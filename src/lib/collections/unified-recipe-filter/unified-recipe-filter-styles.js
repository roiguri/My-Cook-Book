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

  /* Categories Page Layout Mode */
  .unified-recipe-filter.categories-page-layout {
    max-width: var(--content-max, 1200px);
    margin: 0 auto;
    padding: 16px var(--gutter, 2rem) 0;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
  }

  /* Filter manager positioning */
  .unified-recipe-filter.categories-page-layout filter-manager {
    align-self: center;
  }

  /* Category navigation spanning full width with bottom padding */
  .unified-recipe-filter.categories-page-layout category-navigation {
    grid-column: span 2;
    padding-bottom: 14px;
    margin-bottom: 0;
  }

  /* Mobile layout for categories page */
  @media (max-width: 768px) {
    .unified-recipe-filter.categories-page-layout {
      padding: 10px var(--sp-md, 1rem) 10px;
      gap: 8px;
      grid-template-columns: 1fr auto;
      align-items: center;
    }

    .unified-recipe-filter.categories-page-layout .categories-search {
      display: none;
    }

    .unified-recipe-filter.categories-page-layout category-navigation {
      grid-column: 1;
      grid-row: 1;
      padding-bottom: 0;
    }

    .unified-recipe-filter.categories-page-layout filter-manager {
      grid-column: 2;
      grid-row: 1;
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
    color: var(--secondary-dark, #b03537);
    text-align: center;
    padding: 1rem;
    font-size: var(--step--1, 0.875rem);
    font-family: var(--font-ui, system-ui, sans-serif);
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
