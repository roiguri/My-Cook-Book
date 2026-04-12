import { test, expect } from '@playwright/test';

test.describe('loading-spinner', () => {
  test.beforeEach(async ({ page }) => {
    // Load the component and common styles directly into a blank page to isolate it
    await page.goto('about:blank');

    // Add common variables to simulate normal environment
    await page.addStyleTag({
      content: `
        :root {
          --primary-color: #ff6b6b;
          --secondary-color: #4ecdc4;
          --text-color: #333;
          --background-color: #f8f9fa;
        }
        body {
          background-color: var(--background-color);
          margin: 0;
          padding: 20px;
          height: 100vh;
        }
      `,
    });

    // Also use the actual dev server in tests to get proper resolution
    // so we need to rely on the test running against a served app
    await page.goto('/');

    // Load the module script into the app context
    await page.addScriptTag({
      type: 'module',
      content: `
        import '/src/lib/utilities/loading-spinner/loading-spinner.js';
      `,
    });
  });

  test('default appearance', async ({ page }) => {
    // Inject the component into the test page
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 50px; background: white;">
          <loading-spinner active></loading-spinner>
        </div>
      `;
    });

    const spinnerContainer = page.locator('#test-container');
    // Wait for the component to be defined and rendered
    await page.waitForFunction(() => customElements.get('loading-spinner'));

    // Verify visual snapshot
    await expect(spinnerContainer).toHaveScreenshot('loading-spinner-default.png');
  });

  test('custom size and colors', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="test-container" style="padding: 50px; background: white; display: flex; gap: 20px;">
          <loading-spinner active size="60px" color="#ff6b6b" line-width="6px"></loading-spinner>
          <loading-spinner active size="20px" color="#4ecdc4" length="half"></loading-spinner>
          <loading-spinner active size="80px" color="purple" background-color="#eee"></loading-spinner>
        </div>
      `;
    });

    const spinnerContainer = page.locator('#test-container');
    await page.waitForFunction(() => customElements.get('loading-spinner'));

    await expect(spinnerContainer).toHaveScreenshot('loading-spinner-custom.png');
  });

  test('overlay appearance', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div style="width: 300px; height: 300px; background: #ffe; position: relative; border: 1px solid #ccc; overflow: hidden;">
          <p>Some content behind the spinner that should be partially visible through the overlay.</p>
          <loading-spinner active overlay border-radius="10px"></loading-spinner>
        </div>
      `;
    });

    const spinnerContainer = page.locator('div');
    await page.waitForFunction(() => customElements.get('loading-spinner'));

    // We snapshot the container, but since the overlay is position: fixed relative to the viewport (or transformed parent)
    // we need to be careful. In the component, overlay is `position: fixed` relative to viewport!
    // But `loading-spinner` also sets host to relative if overlay.
    // Wait, let's verify if `position: fixed` or absolute

    // We snapshot the whole page here to capture the overlay covering the screen
    await expect(page).toHaveScreenshot('loading-spinner-overlay.png');
  });
});
