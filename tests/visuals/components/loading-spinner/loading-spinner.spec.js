import { test, expect } from '@playwright/test';

test.describe('Loading Spinner', () => {
  test('renders overlay spinner correctly', async ({ page }) => {
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    const overlaySpinner = page.locator('#spinner-overlay-active');

    // Wait for the overlay div inside the shadow root to be visible.
    const overlayDiv = overlaySpinner.locator('.overlay');
    await expect(overlayDiv).toBeVisible();

    await expect(page).toHaveScreenshot('loading-spinner-overlay.png', {
      animations: 'disabled'
    });
  });

  test('custom configurations render correctly', async ({ page }) => {
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    // First deactivate the default one
    await page.locator('#spinner-overlay-active').evaluate(node => node.removeAttribute('active'));

    const customSpinner = page.locator('#spinner-custom-color');
    await customSpinner.evaluate(node => node.setAttribute('active', ''));

    await expect(customSpinner.locator('.overlay')).toBeVisible();

    await expect(page).toHaveScreenshot('loading-spinner-custom.png', {
      animations: 'disabled'
    });
  });

  test('overlay spinner toggles body scroll lock', async ({ page }) => {
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    // First deactivate the default one that's active on load
    await page.locator('#spinner-overlay-active').evaluate(node => node.removeAttribute('active'));

    const overlaySpinner = page.locator('#spinner-overlay-inactive');

    // Initially not active
    let overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');

    // Set active
    await overlaySpinner.evaluate(node => node.setAttribute('active', ''));
    overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    // Remove active
    await overlaySpinner.evaluate(node => node.removeAttribute('active'));
    overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');
  });
});
