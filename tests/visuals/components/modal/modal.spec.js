import { test, expect } from '@playwright/test';

test.describe('Modal Component Visuals', () => {
  test('renders correctly when open', async ({ page }) => {
    // Serve the test page directly from the test file
    await page.goto('/tests/visuals/components/modal/index.html');

    // Check if customized element is defined
    const isDefined = await page.evaluate(() => !!customElements.get('custom-modal'));
    expect(isDefined).toBe(true);

    const modal = page.locator('custom-modal');

    // Initially closed
    await expect(modal.locator('.modal')).not.toHaveClass(/open/);

    // Open the modal
    await page.evaluate(() => {
      document.getElementById('test-modal').open();
    });

    // Wait for animation
    await page.waitForTimeout(500);

    // Check if open
    await expect(modal.locator('.modal')).toHaveClass(/open/);
    await expect(modal.locator('.modal')).toBeVisible();

    // Snapshot
    await expect(modal.locator('.modal')).toHaveScreenshot('modal-open.png');
  });

  test('interactions', async ({ page }) => {
    await page.goto('/tests/visuals/components/modal/index.html');

    const modal = page.locator('custom-modal');

    // Open the modal
    await page.evaluate(() => {
      document.getElementById('test-modal').open();
    });

    // Wait for open
    await expect(modal.locator('.modal')).toHaveClass(/open/);

    // Close by button
    await modal.locator('.close-button').click();

    // Wait for close animation
    await page.waitForTimeout(500);

    // Check if closed
    await expect(modal.locator('.modal')).not.toHaveClass(/open/);
  });

  test('custom attributes', async ({ page }) => {
    await page.goto('/tests/visuals/components/modal/index.html');

    const modal = page.locator('custom-modal');

    // Set attributes
    await page.evaluate(() => {
      const m = document.getElementById('test-modal');
      m.setAttribute('width', '600px');
      m.setAttribute('background-color', '#ffcccc');
      m.open();
    });

    await page.waitForTimeout(500);

    // Verify width and color in snapshot
    await expect(modal.locator('.modal')).toHaveScreenshot('modal-custom.png');
  });
});
