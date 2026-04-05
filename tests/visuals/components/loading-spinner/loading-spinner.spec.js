import { test, expect } from '@playwright/test';

test.describe('Loading Spinner Visuals', () => {
  test('renders correctly', async ({ page }) => {
    // Navigate to the test page
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    // Check if customized element is defined
    const isDefined = await page.evaluate(() => !!customElements.get('loading-spinner'));
    expect(isDefined).toBe(true);

    const spinner = page.locator('loading-spinner');

    // Pause animation for a stable snapshot
    await page.evaluate(() => {
      const sp = document.querySelector('loading-spinner');
      const innerSpinner = sp.shadowRoot.querySelector('.spinner');
      if (innerSpinner) {
        innerSpinner.style.animation = 'none';
      }
    });

    // Take snapshot for default state
    await expect(spinner).toHaveScreenshot('loading-spinner-default.png');
  });

  test('renders overlay correctly', async ({ page }) => {
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    await page.evaluate(() => {
      const sp = document.querySelector('loading-spinner');
      sp.setAttribute('overlay', '');
      sp.setAttribute('active', '');

      const innerSpinner = sp.shadowRoot.querySelector('.spinner');
      if (innerSpinner) {
        innerSpinner.style.animation = 'none';
      }
    });

    const spinner = page.locator('loading-spinner');

    // Take snapshot for overlay state
    await expect(spinner).toHaveScreenshot('loading-spinner-overlay.png');
  });
});