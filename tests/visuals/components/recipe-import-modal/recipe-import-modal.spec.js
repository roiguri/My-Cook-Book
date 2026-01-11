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

  test('handles file selection and shows editor', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');

    // Initial state: Upload view visible
    await expect(modal.locator('#upload-view')).toBeVisible();
    await expect(modal.locator('#editor-view')).toBeHidden();

    // We probably need to mock FileReader or provide a real valid image buffer for Cropper to initialize without error.
    // Actually, let's mock the initCropper method to avoid dependency on real image decoding/Cropper logic in test environment if flaky.
    // But visual test prefers real rendering.
    // Let's try mocking the method for stability in this logical test.

    const fileChooserPromise = page.waitForEvent('filechooser');
    // Force click
    await modal.locator('#upload-view').click();
    const fileChooser = await fileChooserPromise;

    // 1x1 Pixel Red Dot JPEG Base64
    const validBase64 =
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDIIMFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQ/wAARCAABAAEDAREAAhEBAxEB/8HAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==';

    await fileChooser.setFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(validBase64, 'base64'),
    });

    // Wait for editor view
    await expect(modal.locator('#editor-view')).toBeVisible();
    await expect(modal.locator('#extract-btn')).toBeEnabled();

    // Visual snapshot: Editor View (Crop)
    await expect(page).toHaveScreenshot('modal-editor-state.png', {
      maxDiffPixels: 300,
      // Optional: mask: [modal.locator('#image-preview')]
    });
  });

  test('shows loading and success on extract', async ({ page }) => {
    const modal = page.locator('recipe-import-modal');
    await page.click('#open-modal');

    // Mock initCropper to bypass upload
    await page.evaluate(() => {
      const modal = document.querySelector('recipe-import-modal');
      modal.initCropper('data:image/jpeg;base64,mock');
    });

    // Mock firebase functions
    await page.evaluate(() => {
      // Mock window.httpsCallable if exposed or mocking the import?
      // Since we use modules, hard to mock imports dynamically here without import mapping.
      // We can monkey patch the method on the component if we extracted it, but we didn't.
      // However, `extractRecipe` calls `httpsCallable`.
      // We can override `extractRecipe` method on the instance for testing UI states.
    });

    // Easier: Override the component's extractRecipe method partially or mock the backend call.
    // Let's override `extractRecipe` to simulate the network delay and success.
    await page.evaluate(() => {
      const modal = document.querySelector('recipe-import-modal');
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

    // Click extract
    const extractBtn = modal.locator('#extract-btn');
    await extractBtn.click();

    // Check loading state
    await expect(modal.locator('#loading-view')).toBeVisible();
    await expect(modal.locator('#editor-view')).toBeHidden();

    // Wait for finish (modal closes)
    const customModalInternal = modal.locator('custom-modal .modal');
    await expect(customModalInternal).not.toHaveClass(/open/);
  });
});
