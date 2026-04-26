import { test, expect } from '@playwright/test';

test.describe('Loading Spinner Component Visuals', () => {
  test('renders correctly in default and custom configurations', async ({ page }) => {
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    // Check if custom element is defined
    const isDefined = await page.evaluate(() => !!customElements.get('loading-spinner'));
    expect(isDefined).toBe(true);

    // Disable CSS animations on the page to take stable screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-play-state: paused !important;
        }
      `,
    });

    const testContainer = page.locator('.test-container');

    // Take screenshot of the standard spinners row
    await expect(testContainer).toHaveScreenshot('standard-spinners.png', {
      animations: 'disabled',
    });
  });

  test('overlay spinner interactions and scroll lock', async ({ page }) => {
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    const toggleBtn = page.locator('#toggle-overlay');
    const overlaySpinner = page.locator('#overlay-spinner');

    // Helper to get body overflow
    const getBodyOverflow = () => page.evaluate(() => document.body.style.overflow);

    // Initially, spinner is not active, body scroll should not be locked
    await expect(overlaySpinner).not.toHaveAttribute('active');
    expect(await getBodyOverflow()).toBe('');

    // Toggle active state
    await toggleBtn.click();
    await expect(overlaySpinner).toHaveAttribute('active', '');

    // Body scroll should be locked
    expect(await getBodyOverflow()).toBe('hidden');

    // We can also take a screenshot of the overlay spinner, again disabling animations
    await expect(page).toHaveScreenshot('overlay-spinner-active.png', {
      animations: 'disabled',
    });

    // Toggle inactive state
    await page.evaluate(() => {
      document.getElementById('overlay-spinner').removeAttribute('active');
    });

    // Body scroll should be unlocked
    await expect(overlaySpinner).not.toHaveAttribute('active');
    expect(await getBodyOverflow()).toBe('');
  });
});
