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
    margin-bottom: 20px;
    width: 100%;
  }

  .category-tabs-list {
    list-style-type: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 0;
  }

  .category-tabs-item {
    flex-grow: 1;
    display: flex;
    margin-right: 0;
  }

  .category-tabs-link {
    display: block;
    padding: 10px;
    text-align: center;
    background-color: var(--tabs-color);
    color: var(--text-color);
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.3s;
    flex-grow: 1;
    cursor: pointer;
    border: none;
    font-family: inherit;
    font-size: inherit;
  }

  .category-tabs-link:hover,
  .category-tabs-link.active {
    background-color: var(--submenu-color);
    color: var(--button-color);
  }

  .category-dropdown {
    display: none;
    position: relative;
    width: 100%;
  }

  .category-dropdown-select {
    width: 100%;
    display: block;
    padding: 10px;
    font-size: var(--size-body);
    border: 2px solid var(--border-color, #ccc);
    border-radius: 5px;
    appearance: none;
    color: var(--text-color);
    cursor: pointer;
    text-decoration: none;
    transition: background-color 0.3s;
    background-color: var(--tabs-color);
    font-family: inherit;
  }

  .category-dropdown-select:hover {
    --border-color: var(--secondary);
  }

  .category-dropdown-select:focus-visible {
    outline: none;
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

  :host([dir="rtl"]) .category-dropdown-select {
    direction: rtl;
  }
`;