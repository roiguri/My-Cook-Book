import { test, expect } from '@playwright/test';

test.describe('Recipe Component Visuals', () => {
  test('renders correctly with full recipe data', async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`));
    await page.goto('/tests/visuals/components/recipes/recipe-component/index.html');

    // Wait for custom element to be defined
    const isDefined = await page.evaluate(() => !!customElements.get('recipe-component'));
    expect(isDefined).toBe(true);

    // Mock data and inject into component
    await page.evaluate(async () => {
      const component = document.querySelector('recipe-component');

      // Import services to mock
      const authServiceModule = await import('/src/js/services/auth-service.js');
      const authService = authServiceModule.default;

      // Mock Auth Service
      authService.getCurrentUserRole = async () => 'user';
      authService.getCurrentUser = () => ({ uid: 'test-uid' });

      // Mock Data Fetching (patch the method directly on the instance)
      component.fetchAndPopulateRecipeData = async () => {
        const recipe = {
          name: 'בדיקת מתכון מלא',
          prepTime: 30,
          waitTime: 60,
          difficulty: 'בינוני',
          category: 'main-courses',
          servings: 4,
          ingredients: [
            { amount: 500, unit: 'גרם', item: 'קמח' },
            { amount: 2, unit: 'כפות', item: 'סוכר' },
          ],
          instructions: ['מערבבים את כל המצרכים', 'אופים בתנור למשך 30 דקות'],
          comments: ['הערה חשובה: לא לשרוף'],
          images: [{ full: 'path/to/image.jpg', isPrimary: true }],
        };

        // Populate manually since we are bypassing the real fetch
        component.updatePageTitle(recipe.name);
        component.populateRecipeDetails(recipe);

        // Mock image loading
        const imageContainer = component.shadowRoot.querySelector(
          '.Recipe_component__image-container',
        );
        imageContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        img.className = 'Recipe_component__image';
        imageContainer.appendChild(img);

        component.populateIngredientsList(recipe);
        component.populateInstructions(recipe);
        component.populateCommentList(recipe);
        component.setupServingsAdjuster(recipe);
        component._originalIngredients = recipe.ingredients;
      };

      // Trigger load
      component.setAttribute('recipe-id', 'test-recipe-1');
      await component.fetchAndPopulateRecipeData();
    });

    const component = page.locator('recipe-component');

    // Verify basic content
    await expect(component.locator('#Recipe_component__name')).toHaveText('בדיקת מתכון מלא');
    await expect(component.locator('#Recipe_component__prepTime')).toContainText('30 דקות');

    // Verify ingredients
    const ingredientsList = component.locator('#Recipe_component__ingredients-list');
    await expect(ingredientsList.locator('li').first()).toContainText('קמח');

    // Take snapshot
    await expect(component).toHaveScreenshot('recipe-component-full.png');
  });

  test('handles servings adjustment correctly', async ({ page }) => {
    await page.goto('/tests/visuals/components/recipes/recipe-component/index.html');

    await page.evaluate(async () => {
      const component = document.querySelector('recipe-component');

      // Import services to mock
      const authServiceModule = await import('/src/js/services/auth-service.js');
      const authService = authServiceModule.default;
      authService.getCurrentUserRole = async () => 'user';

      component.fetchAndPopulateRecipeData = async () => {
        const recipe = {
          name: 'מתכון לחישוב מנות',
          prepTime: 10,
          waitTime: 0,
          difficulty: 'קל',
          category: 'starters',
          servings: 2,
          ingredients: [{ amount: 100, unit: 'גרם', item: 'אורז' }],
          instructions: ['לבשל'],
          images: [],
        };

        component.populateRecipeDetails(recipe);
        component.populateIngredientsList(recipe);
        component.populateInstructions(recipe);
        component.setupServingsAdjuster(recipe);
        component._originalIngredients = recipe.ingredients;

        // Hide image container for this test to avoid layout shifts
        component.shadowRoot.querySelector('.Recipe_component__image-container').style.display =
          'none';
      };

      component.setAttribute('recipe-id', 'test-recipe-2');
      await component.fetchAndPopulateRecipeData();
    });

    const component = page.locator('recipe-component');
    const servingsInput = component.locator('#Recipe_component__servings');
    const ingredientAmount = component.locator('.Recipe_component__ingredients-list .amount');

    // Initial check (2 servings -> 100g)
    await expect(servingsInput).toHaveValue('2');
    await expect(ingredientAmount).toHaveText('100');

    // Change servings to 4
    await servingsInput.fill('4');
    // Blur to trigger change if needed, or just fill triggers input event?
    // The component listens to 'change', which usually requires blur or enter
    await servingsInput.press('Enter');

    // Verify amount doubled (4 servings -> 200g)
    await expect(ingredientAmount).toHaveText('200');

    // Take snapshot
    await expect(component).toHaveScreenshot('recipe-component-servings.png');
  });
});
