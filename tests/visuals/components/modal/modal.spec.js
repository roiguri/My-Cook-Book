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

  test('interactions - close on backdrop click', async ({ page }) => {
    await page.goto('/tests/visuals/components/modal/index.html');
    const modal = page.locator('custom-modal');

    // Open
    await page.evaluate(() => document.getElementById('test-modal').open());
    await expect(modal.locator('.modal')).toHaveClass(/open/);

    // Click outside (the backdrop is part of the .modal container in shadow DOM)
    // We force click because the content might be obscuring center, so we click topleft of modal container
    await modal.locator('.modal').click({ position: { x: 10, y: 10 } });

    // Wait for close
    await page.waitForTimeout(500);
    await expect(modal.locator('.modal')).not.toHaveClass(/open/);
  });

  test('scroll lock management', async ({ page }) => {
    await page.goto('/tests/visuals/components/modal/index.html');

    // Helper to get body overflow
    const getBodyOverflow = () => page.evaluate(() => document.body.style.overflow);

    // Initial state
    expect(await getBodyOverflow()).toBe('');

    // Open
    await page.evaluate(() => document.getElementById('test-modal').open());
    await expect(page.locator('custom-modal .modal')).toHaveClass(/open/);

    // Check locked
    expect(await getBodyOverflow()).toBe('hidden');

    // Close via API
    await page.evaluate(() => document.getElementById('test-modal').close());
    await page.waitForTimeout(500);
    expect(await getBodyOverflow()).toBe('');

    // Edge case: Escape key
    await page.evaluate(() => document.getElementById('test-modal').open());
    await expect(page.locator('custom-modal .modal')).toHaveClass(/open/);
    expect(await getBodyOverflow()).toBe('hidden');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    expect(await getBodyOverflow()).toBe('');
  });
});
