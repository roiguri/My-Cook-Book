/**
 * Filter Manager Component Styles
 * CSS-in-JS styles for Shadow DOM compatibility
 */

export const styles = `
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

  :host {
    display: block;
    width: auto;
  }

  .filter-manager {
    display: flex;
    align-items: center;
    position: relative;
    min-height: 36px;
  }

  .filter-button {
    display: block;
    position: relative;
    background-color: white;
    color: var(--text-color-secondary, #666);
    border: 2px solid var(--border-light, #e0e0e0);
    padding: 10px 15px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: var(--size-body);
    font-family: inherit;
    font-weight: 500;
    min-width: 36px;
    min-height: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .filter-button:hover {
    background-color: var(--secondary-light, #f8f9fa);
    border-color: var(--secondary, #6c757d);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .filter-button:active {
    transform: translateY(0);
  }

  .filter-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .filter-button:disabled:hover {
    background-color: white;
    border-color: var(--border-light, #e0e0e0);
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .filter-button .icon {
    font-size: 1.2em;
    color: var(--text-color-secondary, #666);
  }

  .filter-badge {
    display: none;
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: var(--secondary);
    color: white;
    border-radius: 50%;
    padding: 2px;
    width: 10px;
    height: 16px;
    text-align: center;
    font-weight: 700;
    font-size: 0.75rem;
    line-height: 1;
    min-width: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .filter-badge.visible {
    display: flex;
  }

  .error {
    color: var(--error-color, #d32f2f);
    background-color: var(--error-background, #ffebee);
    border: 1px solid var(--error-border, #ffcdd2);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: var(--size-body);
  }

  /* RTL support */
  :host([dir="rtl"]) .filter-manager {
    direction: rtl;
  }

  :host([dir="rtl"]) .filter-badge {
    right: auto;
    left: -8px;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .filter-button {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: var(--size-body);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .filter-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    
    .filter-badge {
      font-size: 0.7rem;
      width: 8px;
      height: 14px;
      min-width: 14px;
    }
  }


  /* Animation for badge appearance */
  .filter-badge {
    transition: all 0.2s ease;
  }

  .filter-badge:not(.visible) {
    transform: scale(0);
    opacity: 0;
  }

  .filter-badge.visible {
    transform: scale(1);
    opacity: 1;
  }
`;
