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

  /* Badge base — mirrors .bdg from badges.css */
  .category-tabs-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--r-pill, 999px);
    font-family: var(--font-ui, system-ui, sans-serif);
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    background: var(--surface-2, #f2e8cf);
    color: var(--text-strong, #1a1a1a);
    border: 1px solid var(--hairline, rgba(31, 29, 24, 0.12));
    cursor: pointer;
    white-space: nowrap;
    transition:
      background var(--dur-1, 160ms) var(--ease, ease),
      color var(--dur-1, 160ms) var(--ease, ease),
      border-color var(--dur-1, 160ms) var(--ease, ease);
  }

  /* Colored dot — mirrors .bdg::before */
  .category-tabs-link::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--bdg-color, var(--primary, #6a994e));
    flex-shrink: 0;
  }

  /* Hover — mirrors .bdg--clickable:hover */
  .category-tabs-link:hover:not(.active) {
    background: var(--surface-1, #fff);
    border-color: var(--hairline-strong, rgba(31, 29, 24, 0.2));
  }

  /* Active — mirrors .bdg--active */
  .category-tabs-link.active {
    background: var(--primary-dark, #386641);
    color: #fff;
    border-color: transparent;
  }

  .category-tabs-link.active::before {
    background: var(--primary-bright, #a7c957);
  }

  /* Category color map — mirrors .bdg--cat-* */
  .category-tabs-link[data-category="all"]        { --bdg-color: #a7c957; }
  .category-tabs-link[data-category="breads"]     { --bdg-color: #6a994e; }
  .category-tabs-link[data-category="mains"]      { --bdg-color: #bc4749; }
  .category-tabs-link[data-category="desserts"]   { --bdg-color: #eab308; }
  .category-tabs-link[data-category="salads"]     { --bdg-color: #22c55e; }
  .category-tabs-link[data-category="soups"]      { --bdg-color: #60a5fa; }
  .category-tabs-link[data-category="appetizers"] { --bdg-color: #d47779; }
  .category-tabs-link[data-category="preserves"]  { --bdg-color: #836418; }
  .category-tabs-link[data-category="drinks"]     { --bdg-color: #a855f7; }
  .category-tabs-link[data-category="holiday"]    { --bdg-color: #f97316; }

  .category-dropdown {
    display: none;
    position: relative;
    width: 100%;
  }

  /* Mirrors .select-ctrl from fields.css — RTL: chevron on right, text padding on left */
  .category-dropdown-select {
    display: block;
    width: 100%;
    height: 38px;
    padding: 0 32px 0 14px;
    font-family: var(--font-ui, system-ui, sans-serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-1, #1a1a1a);
    background-color: var(--surface-1, #fff);
    border: 1px solid var(--hairline-strong, rgba(31, 29, 24, 0.2));
    border-radius: var(--r-pill, 999px);
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    outline: none;
    box-sizing: border-box;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%237c7562' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
    transition: border-color var(--dur-1, 160ms) ease, box-shadow var(--dur-1, 160ms) ease;
  }

  .category-dropdown-select:hover {
    border-color: var(--hairline-strong, rgba(31, 29, 24, 0.2));
  }

  .category-dropdown-select:focus {
    border-color: var(--primary, #6a994e);
    box-shadow: 0 0 0 3px rgba(106, 153, 78, 0.12);
  }

  .category-dropdown-select option {
    background-color: var(--surface-1, #fff);
    color: var(--ink-1, #1a1a1a);
    font-weight: 500;
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
