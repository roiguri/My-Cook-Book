import { test, expect } from '@playwright/test';

test.describe('Recipe Import Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/visuals/components/recipe-import-modal/index.html');
  });

  test('opens and closes correctly', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    const customModalInternal = modal.locator('custom-modal .modal');

    // Initially hidden
    await expect(customModalInternal).not.toHaveClass(/open/);

    // Click open button on page
    await page.click('#open-modal');
    await expect(customModalInternal).toHaveClass(/open/);

    // Visual snapshot: Initial Image Tab State
    await expect(page).toHaveScreenshot('modal-initial-state.png', { maxDiffPixels: 500 });

    // Click close button
    await modal.locator('.close-button').first().click();
    await expect(customModalInternal).not.toHaveClass(/open/);
  });

  test('switches between image and url tabs', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');

    // Default is image tab
    await expect(modal.locator('#upload-view')).toBeVisible();
    await expect(modal.locator('#url-view')).toBeHidden();

    // Click URL tab
    await modal.locator('#tab-url').click();
    await expect(modal.locator('#upload-view')).toBeHidden();
    await expect(modal.locator('#url-view')).toBeVisible();
    await expect(modal.locator('#extract-btn')).toHaveText(/ייבא/);

    // Visual snapshot: URL Tab State
    await expect(page).toHaveScreenshot('modal-url-tab-state.png', { maxDiffPixels: 500 });

    // Switch back
    await modal.locator('#tab-image').click();
    await expect(modal.locator('#upload-view')).toBeVisible();
    await expect(modal.locator('#url-view')).toBeHidden();
  });

  test('handles file selection and shows preview', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await modal.locator('#upload-view').click();
    const fileChooser = await fileChooserPromise;

    // 1x1 Pixel Red Dot JPEG Base64
    const validBase64 =
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDIIMFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQ/wAARCAABAAEDAREAAhEBAxEB/8HAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==';

    await fileChooser.setFiles([
      {
        name: 'test1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from(validBase64, 'base64'),
      },
    ]);

    await expect(modal.locator('#preview-view')).toBeVisible();
    await expect(modal.locator('.image-item')).toHaveCount(1);

    // Test entering editor
    await modal.locator('.edit-btn').click();
    await expect(modal.locator('#editor-view')).toBeVisible();

    // Visual snapshot: Editor View
    await expect(page).toHaveScreenshot('modal-editor-state.png', {
      maxDiffPixels: 1000,
      threshold: 0.3,
    });
  });

  test('shows loading and game on image extract', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');

    // Mock data injection
    await page.evaluate(() => {
      const modal = document.querySelector('recipe-import-modal');
      modal.images = [
        { id: '1', imageUrl: 'data:image/jpeg;base64,mock', processedBase64: 'mock' },
      ];
      modal.updatePreviewList();

      // Override extractRecipe to simulate slow success
      modal.extractRecipe = async () => {
        modal.setLoading(true);
        // We stay in loading state for the test to check UI
      };
    });

    await modal.locator('#extract-btn').click();

    // Check loading state elements
    await expect(modal.locator('#loading-view')).toBeVisible();
    await expect(modal.locator('.game-wrapper')).toBeVisible({ timeout: 5000 });

    // Visual snapshot removed due to random game content
    // We already verified the elements are visible above
  });

  test('validates URL input and shows loading on URL extract', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');
    await modal.locator('#tab-url').click();

    const urlInput = modal.locator('#url-input');
    const extractBtn = modal.locator('#extract-btn');

    // Initially disabled
    await expect(extractBtn).toBeDisabled();

    // Invalid URL
    await urlInput.fill('not-a-url');
    await expect(extractBtn).toBeDisabled();

    // Valid URL
    await urlInput.fill('https://example.com/recipe');
    await expect(extractBtn).toBeEnabled();

    // Mock extractRecipeFromUrl
    await page.evaluate(() => {
      const modal = document.querySelector('recipe-import-modal');
      modal.extractRecipeFromUrl = async () => {
        modal.setLoading(true);
      };
    });

    await extractBtn.click();
    await expect(modal.locator('#loading-view')).toBeVisible();
    await expect(modal.locator('.game-wrapper')).toBeVisible();
  });
});
