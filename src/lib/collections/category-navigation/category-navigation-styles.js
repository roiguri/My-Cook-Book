/**
 * Category Navigation Component Styles
 * CSS-in-JS styles for Shadow DOM compatibility
 */

export const styles = `
  :host {
    display: block;
    width: 100%;
  }

  .category-navigation {
    width: 100%;
  }

  .category-tabs {
    width: 100%;
  }

  .category-tabs-list {
    list-style-type: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 auto;
    justify-content: center;
    max-width: 950px; /* Forces wrap to roughly 6+5 for 11 items */
  }

  .category-tabs-item {
    flex: 0 0 140px; /* Uniform width for all badges */
    display: flex;
  }

  .category-tabs-link {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .category-dropdown {
    display: none;
    position: relative;
    width: 100%;
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .category-tabs {
      display: none;
    }

    .category-dropdown {
      display: block;
    }
  }

  /* RTL support */
  :host([dir="rtl"]) {
    direction: rtl;
  }

  :host([dir="rtl"]) .category-tabs {
    direction: rtl;
  }

  :host([dir="rtl"]) .category-dropdown {
    direction: rtl;
  }
`;
