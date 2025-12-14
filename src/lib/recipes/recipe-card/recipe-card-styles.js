/**
 * Recipe Card Component Styles
 * Exported as JavaScript string for reliable Shadow DOM loading
 */

export const recipeCardStyles = `
/* Recipe Card Component Styles */

:host {
    display: block;
    width: var(--card-width, 200px);
    height: var(--card-height, 320px);
}

.recipe-card {
    position: relative;
    background: var(--bg-card, #ffffff);
    border-radius: var(--radius-xl, 16px);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    transition: all 0.3s ease;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.05);
}

.recipe-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px; /* rounded-full */
    font-size: 0.75rem;
    font-weight: 600;
    color: #1f2937; /* gray-800 */
    width: auto;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
    background-color: #f3f4f6; /* gray-100 fallback */
}

/* Badge Colors - matching category colors but lighter/softer if needed */
.badge.time { background-color: #e0f2fe; color: #0369a1; } /* Sky */
.badge.difficulty.easy { background-color: #dcfce7; color: #15803d; } /* Green */
.badge.difficulty.medium { background-color: #fef9c3; color: #a16207; } /* Yellow */
.badge.difficulty.hard { background-color: #fee2e2; color: #b91c1c; } /* Red */

/* Category Badges */
.badge.category.appetizers { background-color: var(--color-appetizers, #d4eddb); }
.badge.category.main-courses { background-color: var(--color-main-courses, #bfdfe9); }
.badge.category.side-dishes { background-color: var(--color-side-dishes, #4a6b51); color: white; }
.badge.category.soups-stews { background-color: var(--color-soups, #f8d97e); }
.badge.category.salads { background-color: var(--color-salads, #b7e289); }
.badge.category.desserts { background-color: var(--color-desserts, #f7b9a8); }
.badge.category.breakfast-brunch { background-color: var(--color-breakfast, #fcd34d); }
.badge.category.breads-pastries { background-color: var(--color-breads, #fde59b); }
.badge.category.snacks { background-color: var(--color-snacks, #fdba74); }
.badge.category.beverages { background-color: var(--color-beverages, #a5b4fc); }

.recipe-image {
    position: relative;
    width: 100%;
    height: 180px; /* Fixed height for consistency */
    object-fit: cover;
    flex-shrink: 0;
    background-color: #f3f4f6;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.recipe-image.loaded {
    opacity: 1;
}

.recipe-content {
    padding: 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    justify-content: space-between;
}

.recipe-title {
    font-family: var(--heading-font-he, sans-serif);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary, #1f2937);
    margin: 0;
    line-height: 1.4;
    text-align: right; /* RTL default for Hebrew */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.recipe-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-start; /* Align badges to start */
}

/* Stats Container for Time/Difficulty */
.stats-container {
    display: flex;
    gap: 0.5rem;
    margin-top: auto; /* Push to bottom */
}

.favorite-btn {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem; /* Left side for RTL context usually better, or Right */
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    border: none;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}

/* RTL Adjustment: If dir="rtl" is set on host or parent, we might want to flip.
   For now, we'll keep it on the left (RTL 'start' position) or right depending on preference.
   Let's put it on the TOP-LEFT which is standard 'action' area in some RTL designs, or TOP-RIGHT.
   Current app had it right. Let's keep it right for consistency?
   But wait, in RTL, 'start' is right.
   Let's put it on the LEFT (end) to not obscure the image start?
   Let's stick to Right for now as typical heart position.
*/
.favorite-btn {
    left: auto;
    right: 0.75rem;
}

.favorite-btn:hover {
    transform: scale(1.1);
}

.favorite-btn svg {
    width: 1.25rem;
    height: 1.25rem;
    stroke: #ef4444; /* red-500 */
    fill: transparent;
    transition: fill 0.3s ease;
}

.favorite-btn.active svg {
    fill: #ef4444;
}

/* Loading State */
.recipe-card.loading {
    background: #ffffff;
}
.loading::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* No Image Placeholder */
.no-image-placeholder.recipe-image {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    opacity: 1;
}

.no-image-icon {
    width: 3rem;
    height: 3rem;
    color: #9ca3af; /* gray-400 */
}
`;
