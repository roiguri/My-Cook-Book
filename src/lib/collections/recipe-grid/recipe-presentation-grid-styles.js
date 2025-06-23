export const RECIPE_PRESENTATION_GRID_STYLES = `
/* Recipe Presentation Grid Component Styles */

/* Host element sizing */
:host {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 300px; /* Ensure minimum height for content */
}

.recipe-presentation-grid {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1; /* Take all space from host */
}

.grid-container {
  width: 100%;
  flex: 1; /* Take all available space */
  display: flex;
  flex-direction: column;
}

/* Grid Layout Styles - Matching Original Categories Page */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 300px));
  gap: 1rem;
  width: 100%;
  justify-content: center;
  transition: opacity 0.3s ease-in-out;
  align-content: start; /* Align items to top */
}

.recipe-grid.transitioning {
  opacity: 0.3;
}

/* Recipe Card Container - Matching Original Aspect Ratio */
.recipe-card-container {
  aspect-ratio: 3/4;
  width: 100%;
}

.recipe-card-container recipe-card {
  width: 100%;
  height: 100%;
}

/* No Results State - Matching Original Categories Page */
.recipe-grid.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px; /* Ensure decent height for empty state */
}

.no-results-message {
  text-align: center;
  padding: 1rem;
  color: var(--text-color);
  align-self: start;
  font-family: var(--body-font);
  grid-column: 1 / -1;
  width: 100%;
  box-sizing: border-box;
}

.no-results-message p {
  margin: 0.5rem 0;
  font-size: var(--size-header2);
}

/* Loading State */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: var(--text-secondary, #666);
}

.loading-state p {
  font-size: 1.1rem;
  margin: 0;
}

/* Error State */
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: var(--error-color, #dc3545);
  text-align: center;
}

.error-state p {
  font-size: 1.1rem;
  margin: 0;
}

/* Pagination Container - Always at bottom */
.pagination-container {
  display: flex;
  justify-content: center;
  padding-top: 2rem;
  flex-shrink: 0; /* Don't shrink */
  margin-top: auto; /* Push to bottom if there's extra space */
}

.pagination-container recipe-pagination {
  width: 100%;
}

/* Responsive Design - Minimal, letting parent page handle main responsive behavior */

/* The original grid layout is responsive via auto-fit, so minimal overrides needed */
@media (max-width: 768px) {
  .recipe-presentation-grid {
    gap: 1.5rem;
  }
}

/* Print Styles */
@media print {
  .pagination-container {
    display: none;
  }
  
  .recipe-grid {
    gap: 1rem;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Accessibility - Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .recipe-grid {
    transition: none;
  }
  
  .recipe-grid.transitioning {
    opacity: 1;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .no-results-message {
    color: var(--text-secondary-dark, #ccc);
  }
  
  .loading-state {
    color: var(--text-secondary-dark, #ccc);
  }
}
`;
