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
    gap: 8px;
    margin: 0;
    justify-content: center;
  }

  .category-tabs-item {
    flex: 0 0 auto;
    display: flex;
    margin-right: 0;
  }

  .category-tabs-link {
    display: inline-block;
    padding: 8px 16px;
    text-align: center;
    background-color: white;
    color: var(--text-color-secondary, #666);
    text-decoration: none;
    border-radius: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
    border: 1px solid var(--border-light, #e0e0e0);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .category-tabs-link:hover {
    background-color: var(--secondary-light, #f8f9fa);
    border-color: var(--secondary, #6c757d);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .category-tabs-link.active {
    background-color: var(--secondary, #6c757d);
    color: white;
    border-color: var(--secondary, #6c757d);
    box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
  }

  .category-tabs-link.active:hover {
    background-color: var(--secondary-dark, #545b62);
    border-color: var(--secondary-dark, #545b62);
    transform: translateY(-1px);
  }

  .category-dropdown {
    display: none;
    position: relative;
    width: 100%;
  }

  .category-dropdown-select {
    width: 100%;
    display: block;
    padding: 12px 16px;
    font-size: var(--size-body);
    border: 2px solid var(--border-color, #ccc);
    border-radius: 8px;
    appearance: none;
    color: var(--text-color);
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    background-color: white;
    font-family: inherit;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 40px;
  }

  .category-dropdown-select:hover {
    --border-color: var(--secondary);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .category-dropdown-select:focus {
    outline: none;
    border-color: var(--secondary);
    box-shadow: 0 0 0 3px rgba(188, 71, 73, 0.1);
  }

  .category-dropdown-select option {
    padding: 12px 16px;
    background-color: white;
    color: var(--text-color);
    font-weight: 500;
    border: none;
  }

  .category-dropdown-select option:hover,
  .category-dropdown-select option:focus {
    background-color: var(--secondary-light);
    color: white;
  }

  .category-dropdown-select option:checked {
    background-color: var(--secondary);
    color: white;
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
