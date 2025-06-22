/**
 * Recipe Card Component Styles
 * Exported as JavaScript string for reliable Shadow DOM loading
 */

export const recipeCardStyles = `
/* Recipe Card Component Styles */

:host {
    display: block;
    width: var(--card-width, 200px);
    height: var(--card-height, 300px);
}

.recipe-card {
    position: relative; /* Added for absolute positioning of arrow */
    background: var(--card-bg, white);
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    overflow: hidden;
    transform: translateY(0);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.recipe-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
    color: white;
    width: auto;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
}

/* Cooking Time Badges */
.badge.time {
    background: linear-gradient(135deg, #60a5fa, #3b82f6);  /* Sky Blue to Blue */
}
.badge.time.quick { /* <= 30 mins */
    background: linear-gradient(135deg, #93c5fd, #60a5fa);  /* Lighter Sky Blue to Sky Blue */
}
.badge.time.medium { /* 31-60 mins */
    background: linear-gradient(135deg, #60a5fa, #3b82f6);  /* Sky Blue to Blue */
}
.badge.time.long { /* > 60 mins */
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);  /* Blue to Dark Blue */
}

/* Difficulty Badges */
.badge.difficulty.easy {
    background: linear-gradient(135deg, #86efac, #22c55e);  /* Light Green to Green */
}
.badge.difficulty.medium {
    background: linear-gradient(135deg, #fde047, #eab308);  /* Light Yellow to Yellow */
}
.badge.difficulty.hard {
    background: linear-gradient(135deg, #fca5a5, #ef4444);  /* Light Red to Red */
}

/* Category Badges */
.badge.category.appetizers {
    background: linear-gradient(135deg, #f9a8d4, #ec4899);  /* Light Pink to Pink */
}
.badge.category.main-courses {
    background: linear-gradient(135deg, #c084fc, #a855f7);  /* Light Purple to Purple */
}
.badge.category.side-dishes {
    background: linear-gradient(135deg, #5eead4, #0d9488);  /* Light Teal to Teal */
}
.badge.category.soups-stews {
    background: linear-gradient(135deg, #bef264, #84cc16);  /* Light Lime to Lime */
}
.badge.category.salads {
    background: linear-gradient(135deg, #6ee7b7, #10b981);  /* Light Emerald to Emerald */
}
.badge.category.desserts {
    background: linear-gradient(135deg, #fb923c, #ea580c);  /* Light Orange-Red to Orange-Red */
}
.badge.category.breakfast-brunch {
    background: linear-gradient(135deg, #fcd34d, #d97706);  /* Light Amber to Amber */
} 
.badge.category.snacks {
    background: linear-gradient(135deg, #fdba74, #f97316);  /* Light Orange to Orange */
}
.badge.category.beverages {
    background: linear-gradient(135deg, #a5b4fc, #6366f1);  /* Light Indigo to Indigo */
}

.recipe-image {
    position: relative;
    width: 100%;
    height: 50%;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease;
    background-color: #f0f0f0; /* Placeholder color while loading */
}

.recipe-image.loaded {
    opacity: 1;
}

.recipe-content {
    padding: 0.5rem;
    height: 50%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.5rem;
    overflow: hidden;
    box-sizing: border-box;
}

.recipe-title {
    text-align: center;
    margin: 0 auto;
    font-size: 1.2rem;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
}

.recipe-meta {
    display: flex;
    padding: 0.5rem;
    align-items: right;
    gap: 0.3rem;
    flex-direction: column;
}

.recipe-meta span {
    text-align: right;
    white-space: nowrap; /* Allow text to wrap naturally */
    line-height: 1.4;    /* Added for better readability */
    display: block;      /* Added to ensure block-level behavior */
    font-size: 0.9rem;
}

.recipe-info {
    text-align: center;
    width: 100%;
}

.category-container {
    width: 100%;
    display: flex;
    justify-content: center;
}

.stats-container {
    width: 100%;
    display: flex;
    justify-content: center;
    flex-wrap: nowrap;
    gap: 0.3rem;
}

.favorite-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    z-index: 10;
}

.favorite-btn svg {
    width: 100%;
    height: 100%;
    stroke: rgba(0, 0, 0, 0.2);
    fill: white;
    transition: fill 0.3s ease, transform 0.3s ease; /* Added fill transition */
}

.favorite-btn.active svg {
    fill: #ff4b4b;
}

.favorite-btn:hover svg {
    transform: scale(1.1);
}

/* Loading State Styles */
.recipe-card.loading {
    position: relative;
    height: 100%;
}

.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Error State Styles */
.error-state {
    padding: 1rem;
    text-align: center;
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 260px) {
    .stats-container {
        flex-direction: column;
        align-items: center;
    }

    .badge {
        width: 90%;  /* Take most of the width but leave some margin */
        justify-content: center;
    }
}
`;
