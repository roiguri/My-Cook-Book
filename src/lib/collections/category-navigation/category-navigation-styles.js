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
    margin: 0;
    justify-content: center;
  }

  .category-tabs-item {
    flex: 0 0 auto;
    display: flex;
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
  :host([dir="rtl"]) .category-tabs {
    direction: rtl;
  }

  :host([dir="rtl"]) .select-ctrl {
    direction: rtl;
  }
`;
