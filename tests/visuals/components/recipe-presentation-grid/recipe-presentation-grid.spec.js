import { test, expect } from '@playwright/test';
import { MOCK_RECIPES, PAGINATION_MOCK_RECIPES } from '../../utils/recipe-mocks.js';

test.describe('Recipe Presentation Grid Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('/tests/visuals/components/recipe-presentation-grid/index.html');

    // Patch RecipeCard to prevent side effects (network calls) and ensure stability
    // Note: We use prototype patching because RecipeCard instances are created dynamically by the grid
    await page.evaluate(async () => {
      // Wait for RecipeCard to be defined if it isn't yet
      if (!customElements.get('recipe-card')) {
        await customElements.whenDefined('recipe-card');
      }

      const RecipeCard = customElements.get('recipe-card');

      // Patch prototype methods
      if (RecipeCard) {
        RecipeCard.prototype._fetchRecipeData = async function () {};

        RecipeCard.prototype._fetchRecipeImage = async function () {
          // Set a dummy image (1x1 red pixel)
          this._imageUrl =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

          // Force render the image
          const img = this.shadowRoot.querySelector('.recipe-image');
          if (img) {
            img.src = this._imageUrl;
            img.classList.add('loaded');
          }
          return Promise.resolve();
        };

        RecipeCard.prototype._fetchUserFavorites = async function () {
          this._userFavorites = new Set();
          return Promise.resolve();
        };
      }
    });
  });

  test('renders empty state correctly', async ({ page }) => {
    await page.evaluate(async () => {
      const grid = document.querySelector('recipe-presentation-grid');
      await grid.waitForReady();
      grid.setRecipes([]);
    });

    const grid = page.locator('recipe-presentation-grid');
    await expect(grid.locator('.no-results-message')).toBeVisible();
    await expect(grid.locator('.recipe-grid')).toHaveClass(/no-results/);

    // Verify text content
    await expect(grid.locator('.no-results-message')).toContainText('לא נמצאו מתכונים');

    await expect(grid).toHaveScreenshot('recipe-presentation-grid-empty.png');
  });

  test('renders grid with recipes', async ({ page }) => {
    await page.evaluate(async (recipes) => {
      const grid = document.querySelector('recipe-presentation-grid');
      await grid.waitForReady();
      grid.setRecipes(recipes);
    }, MOCK_RECIPES);

    const grid = page.locator('recipe-presentation-grid');

    // Verify cards are rendered
    await expect(grid.locator('recipe-card')).toHaveCount(6);

    // Check first card content
    const firstCard = grid.locator('recipe-card').first();
    await expect(firstCard.locator('.recipe-title')).toHaveText('Test Recipe 1');

    await expect(grid).toHaveScreenshot('recipe-presentation-grid-populated.png');
  });

  test('handles pagination logic', async ({ page }) => {
    await page.evaluate(async (recipes) => {
      const grid = document.querySelector('recipe-presentation-grid');
      grid.setAttribute('recipes-per-page', '4');
      await grid.waitForReady();
      grid.setRecipes(recipes);
    }, PAGINATION_MOCK_RECIPES);

    const grid = page.locator('recipe-presentation-grid');
    const pagination = grid.locator('recipe-pagination');

    // Verify first page content
    await expect(grid.locator('recipe-card')).toHaveCount(4);
    await expect(grid.locator('recipe-card').first().locator('.recipe-title')).toHaveText(
      'Recipe 1',
    );
    await expect(pagination).toBeVisible();

    // Navigate to page 2 via API
    await page.evaluate(() => {
      const grid = document.querySelector('recipe-presentation-grid');
      grid.goToPage(2);
    });

    // Verify second page content
    await expect(grid.locator('recipe-card')).toHaveCount(4);
    await expect(grid.locator('recipe-card').first().locator('.recipe-title')).toHaveText(
      'Recipe 5',
    );

    await expect(grid).toHaveScreenshot('recipe-presentation-grid-page-2.png');
  });

  test('shows loading state', async ({ page }) => {
    await page.evaluate(async () => {
      const grid = document.querySelector('recipe-presentation-grid');
      await grid.waitForReady();
      grid.showLoading();
    });

    const grid = page.locator('recipe-presentation-grid');
    await expect(grid.locator('.loading-state')).toBeVisible();
    await expect(grid).toHaveScreenshot('recipe-presentation-grid-loading.png');
  });
});
