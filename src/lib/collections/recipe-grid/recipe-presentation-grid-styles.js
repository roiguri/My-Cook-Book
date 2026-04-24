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

/* Grid Layout Styles */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-lg, 1.5rem);
  width: 100%;
  transition: opacity 0.25s ease-out;
  align-content: start;
}

.recipe-grid.transitioning {
  opacity: 0;
}

/* Recipe Card Container */
.recipe-card-container {
  width: 100%;
  min-width: 0;
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.recipe-card-container.removing {
  opacity: 0;
  transform: scale(0.95);
}

.recipe-card-container recipe-card {
  display: block;
  width: 100%;
  min-width: 0;
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
  color: var(--ink-2, #3a3a3a);
  align-self: start;
  font-family: var(--font-ui, system-ui, sans-serif);
  grid-column: 1 / -1;
  width: 100%;
  box-sizing: border-box;
}

.no-results-message p {
  margin: 0.5rem 0;
  font-size: var(--step-1, 1.125rem);
}

/* Loading State */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: var(--ink-3, #7c7562);
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
  color: var(--secondary-dark, #b03537);
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
  padding-top: 1rem;
  flex-shrink: 0; /* Don't shrink */
  margin-top: auto; /* Push to bottom if there's extra space */
}

.pagination-container recipe-pagination {
  width: 100%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .recipe-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-md, 1rem);
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

`;
