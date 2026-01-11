import { test, expect } from '@playwright/test';

test.describe('Recipe Import Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/visuals/components/recipe-import-modal/index.html');
  });

  test('opens and closes correctly', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    // Inside recipe-import-modal shadow -> custom-modal -> shadow -> .modal
    // Playwright pierses shadow roots.
    const customModalInternal = modal.locator('custom-modal .modal');

    // Initially hidden
    await expect(customModalInternal).not.toHaveClass(/open/);

    // Click open button on page
    await page.click('#open-modal');
    await expect(customModalInternal).toHaveClass(/open/);

    // Visual snapshot: Initial Upload View
    // Using page snapshot because modal uses fixed positioning/overlay and the host element might have 0 dimensions
    await expect(page).toHaveScreenshot('modal-upload-state.png', { maxDiffPixels: 300 });

    // Click close button
    await modal.locator('.close-button').click();
    await expect(customModalInternal).not.toHaveClass(/open/);
  });

  test('handles file selection and shows preview', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');

    // Initial state: Upload view visible
    await expect(modal.locator('#upload-view')).toBeVisible();
    await expect(modal.locator('#preview-view')).toBeHidden();

    const fileChooserPromise = page.waitForEvent('filechooser');
    // Force click
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
      {
        name: 'test2.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from(validBase64, 'base64'),
      },
    ]);

    // Wait for preview view
    await expect(modal.locator('#preview-view')).toBeVisible();
    await expect(modal.locator('#upload-view')).toBeHidden();
    await expect(modal.locator('#extract-btn')).toBeEnabled();

    // Check items count
    const items = modal.locator('.image-item');
    await expect(items).toHaveCount(2);

    // Visual snapshot: Preview View
    await expect(page).toHaveScreenshot('modal-preview-state.png', {
      maxDiffPixels: 300,
    });

    // Test entering editor
    await items.first().locator('.edit-btn').click();
    await expect(modal.locator('#editor-view')).toBeVisible();
    await expect(modal.locator('#preview-view')).toBeHidden();

    // Visual snapshot: Editor View
    await expect(page).toHaveScreenshot('modal-editor-state.png', {
      maxDiffPixels: 300,
    });
  });

  test('shows loading and success on extract', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');

    // Mock data injection
    await page.evaluate(() => {
      const modal = document.querySelector('recipe-import-modal');
      modal.images = [
        { id: '1', imageUrl: 'data:image/jpeg;base64,mock', processedBase64: 'mock' },
      ];
      modal.updatePreviewList();
      modal.updatePreviewList();

      // Override extractRecipe to simulate success
      modal.extractRecipe = async () => {
        modal.setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate work
        modal.setLoading(false);
        modal.dispatchEvent(
          new CustomEvent('recipe-extracted', { detail: { data: { name: 'Test' } } }),
        );
        modal.close();
      };
    });

    const extractBtn = modal.locator('#extract-btn');
    await extractBtn.click();

    // Check loading state
    await expect(modal.locator('#loading-view')).toBeVisible();
    await expect(modal.locator('#preview-view')).toBeHidden();

    // Wait for finish (modal closes)
    const customModalInternal = modal.locator('custom-modal .modal');
    await expect(customModalInternal).not.toHaveClass(/open/);
  });
});
