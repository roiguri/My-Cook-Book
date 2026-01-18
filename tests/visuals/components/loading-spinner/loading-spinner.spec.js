import { test, expect } from '@playwright/test';

test.describe('Loading Spinner Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/visuals/components/loading-spinner/index.html');
  });

  test('renders default state correctly', async ({ page }) => {
    const spinner = page.locator('#default-spinner');
    await expect(spinner).toBeVisible();

    // Check if shadow root exists and spinner is present
    const shadowSpinner = spinner.locator('.spinner');
    // Note: Locating inside shadow DOM in Playwright is automatic if using locator options or >>,
    // but here we can just rely on screenshot.

    await expect(spinner).toHaveScreenshot('default-spinner.png');
  });

  test('renders custom attributes correctly', async ({ page }) => {
    const spinner = page.locator('#custom-spinner');
    await expect(spinner).toBeVisible();

    // Check attributes reflection in DOM is not strictly necessary if visual test passes,
    // but good for sanity.
    await expect(spinner).toHaveAttribute('color', 'blue');
    await expect(spinner).toHaveAttribute('size', '60px');

    await expect(spinner).toHaveScreenshot('custom-spinner.png');
  });

  test('handles overlay mode and scroll locking', async ({ page }) => {
    const spinner = page.locator('#overlay-spinner');

    // Initially inactive, so the overlay div inside shadow DOM should be hidden
    // We can't easily check 'display: none' inside shadow DOM via standard matchers on the host,
    // so we evaluate.
    const isOverlayVisible = await spinner.evaluate((el) => {
      const overlay = el.shadowRoot.querySelector('.overlay');
      return overlay ? getComputedStyle(overlay).display !== 'none' : false;
    });
    expect(isOverlayVisible).toBe(false);

    // Activate the spinner
    await spinner.evaluate((el) => el.setAttribute('active', ''));

    // Check if overlay becomes visible
    const isOverlayVisibleAfter = await spinner.evaluate((el) => {
      const overlay = el.shadowRoot.querySelector('.overlay');
      return getComputedStyle(overlay).display !== 'none';
    });
    expect(isOverlayVisibleAfter).toBe(true);

    // Check scroll locking on body
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Take snapshot of the full page (overlay should cover it)
    // We might need to mask the other spinners to be consistent, but overlay covers them mostly.
    // Actually, overlay is fixed inset 0, so it covers everything.
    await expect(page).toHaveScreenshot('overlay-active.png');

    // Deactivate
    await spinner.evaluate((el) => el.removeAttribute('active'));

    // Check scroll unlocking
    const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowAfter).toBe('');
  });
});
