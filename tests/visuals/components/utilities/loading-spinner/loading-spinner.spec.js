import { test, expect } from '@playwright/test';

test.describe('Loading Spinner Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local index to have base environment
    await page.goto('/');
  });

  test('default appearance', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/src/lib/utilities/loading-spinner/loading-spinner.js"></script>
      <div id="test-container" style="display: block; width: 100px; height: 100px;">
        <loading-spinner active></loading-spinner>
      </div>
    `);

    // Wait for component to be defined and rendered
    await page.waitForFunction(() => customElements.get('loading-spinner') !== undefined);

    // wait for rendering
    await page.waitForTimeout(500);

    const container = page.locator('#test-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveScreenshot('loading-spinner-default.png', {
      animations: 'disabled',
    });
  });

  test('custom size and colors', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/src/lib/utilities/loading-spinner/loading-spinner.js"></script>
      <div id="test-container" style="display: block; width: 100px; height: 100px;">
        <loading-spinner active size="60px" color="red" background-color="lightgray" line-width="8px"></loading-spinner>
      </div>
    `);

    await page.waitForFunction(() => customElements.get('loading-spinner') !== undefined);

    await page.waitForTimeout(500);

    const container = page.locator('#test-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveScreenshot('loading-spinner-custom.png', {
      animations: 'disabled',
    });
  });

  test('different lengths', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/src/lib/utilities/loading-spinner/loading-spinner.js"></script>
      <div id="test-container" style="display: flex; gap: 20px; padding: 20px;">
        <loading-spinner active length="quarter"></loading-spinner>
        <loading-spinner active length="half"></loading-spinner>
        <loading-spinner active length="three-quarters"></loading-spinner>
      </div>
    `);

    await page.waitForFunction(() => customElements.get('loading-spinner') !== undefined);

    await page.waitForTimeout(500);

    const container = page.locator('#test-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveScreenshot('loading-spinner-lengths.png', {
      animations: 'disabled',
    });
  });

  test('overlay mode', async ({ page }) => {
    await page.setContent(`
      <script type="module" src="/src/lib/utilities/loading-spinner/loading-spinner.js"></script>
      <div id="test-container" style="width: 200px; height: 200px; border: 1px solid black; position: relative;">
        <p>Some content behind the overlay.</p>
        <loading-spinner active overlay></loading-spinner>
      </div>
    `);

    await page.waitForFunction(() => customElements.get('loading-spinner') !== undefined);

    await page.waitForTimeout(500);

    // Test the whole container to see the overlay
    const container = page.locator('#test-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveScreenshot('loading-spinner-overlay.png', {
      animations: 'disabled',
    });
  });
});
