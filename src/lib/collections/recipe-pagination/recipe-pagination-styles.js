/**
 * Recipe Pagination Component Styles
 * CSS-in-JS styles for Shadow DOM compatibility
 */

export const styles = `
  :host {
    display: block;
    width: 100%;
  }

  .recipe-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    margin-bottom: 20px;
    padding-top: 20px;
    width: 100%;
  }

  .pagination-button {
    background: linear-gradient(135deg, var(--submenu-color), var(--secondary-light));
    color: white;
    border: none;
    padding: 10px 15px;
    margin: 0 5px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
    font-family: inherit;
    font-size: var(--size-body);
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(188, 71, 73, 0.2);
  }

  .pagination-button:hover {
    background: linear-gradient(135deg, var(--secondary-dark), var(--submenu-color));
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(188, 71, 73, 0.3);
  }

  .pagination-button:disabled {
    background: linear-gradient(135deg, var(--disabled-color), #e0e0e0);
    color: #999;
    cursor: not-allowed;
    opacity: 0.6;
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .pagination-button:disabled:hover {
    background: linear-gradient(135deg, var(--disabled-color), #e0e0e0);
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .page-info {
    margin: 0 10px;
    font-size: var(--size-body);
    color: var(--text-color);
    font-weight: 500;
    white-space: nowrap;
  }

  /* RTL support */
  :host([dir="rtl"]) .recipe-pagination {
    direction: rtl;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .pagination-button {
      padding: 8px 12px;
      margin: 0 3px;
      font-size: var(--size-body-mobile, 0.9rem);
    }

    .page-info {
      margin: 0 8px;
      font-size: var(--size-body-mobile, 0.9rem);
    }
  }
`;