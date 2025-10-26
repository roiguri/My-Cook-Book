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
    position: relative;
    background: var(--card-bg, white);
    border-radius: var(--radius-lg, 0.75rem);
    border: 1px solid var(--border-color, #E5E7EB);
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    transition: all 0.2s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    overflow: hidden;
}

.recipe-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: var(--primary-color, #6366F1);
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full, 9999px);
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    width: auto;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0.025em;
}

/* Cooking Time Badges - Simplified Modern Style */
.badge.time {
    background: #3B82F6;
}
.badge.time.quick { /* <= 30 mins */
    background: #60A5FA;
}
.badge.time.medium { /* 31-60 mins */
    background: #3B82F6;
}
.badge.time.long { /* > 60 mins */
    background: #1E40AF;
}

/* Difficulty Badges */
.badge.difficulty.easy {
    background: #10B981;
}
.badge.difficulty.medium {
    background: #F59E0B;
}
.badge.difficulty.hard {
    background: #EF4444;
}

/* Category Badges - Modern Flat Colors */
.badge.category.appetizers {
    background: #EC4899;
}
.badge.category.main-courses {
    background: #A855F7;
}
.badge.category.side-dishes {
    background: #14B8A6;
}
.badge.category.soups-stews {
    background: #84CC16;
}
.badge.category.salads {
    background: #10B981;
}
.badge.category.desserts {
    background: #F97316;
}
.badge.category.breakfast-brunch {
    background: #F59E0B;
}
.badge.category.breads-pastries {
    background: #8B5CF6;
}
.badge.category.snacks {
    background: #FB923C;
}
.badge.category.beverages {
    background: #6366F1;
}

.recipe-image {
    position: relative;
    width: 100%;
    height: 50%;
    object-fit: cover;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    background-color: var(--neutral-100, #F3F4F6);
}

.recipe-image.loaded {
    opacity: 1;
}

.recipe-content {
    padding: 0.75rem;
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
    font-size: 1rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    color: var(--neutral-900, #111827);
    letter-spacing: -0.01em;
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
    background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
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
    color: var(--error, #EF4444);
    background-color: #FEF2F2;
    border: 1px solid #FEE2E2;
    border-radius: var(--radius-lg, 0.75rem);
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
