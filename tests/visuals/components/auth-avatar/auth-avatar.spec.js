import { test, expect } from '@playwright/test';

test.describe('Auth Avatar Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('/tests/visuals/components/auth-avatar/index.html');
  });

  test('renders signed-out state correctly', async ({ page }) => {
    // Mock Authentication Service for Signed Out State
    await page.evaluate(async () => {
      const authServiceModule = await import('/src/js/services/auth-service.js');
      const authService = authServiceModule.default;

      // Reset state
      authService.getCurrentUser = () => null;
      authService.getCurrentAvatarUrl = () => null;

      // Trigger update manually since we can't easily access the listener
      // added in connectedCallback unless we re-create the element or expose methods.
      // But we can just grab the element and call updateAvatar if we want to be explicit,
      // or rely on the initial render if we set up mocks *before* navigation (which is hard here).
      // Easier: Get the element and force an update.
      const avatar = document.querySelector('auth-avatar');
      avatar.updateAvatar(null);
    });

    const avatar = page.locator('auth-avatar');

    // Check visual state
    await expect(avatar.locator('.avatar')).toHaveClass(/signed-out/);

    // Snapshot
    await expect(avatar).toHaveScreenshot('auth-avatar-signed-out.png');
  });

  test('renders signed-in state with initials', async ({ page }) => {
    await page.evaluate(async () => {
      const authServiceModule = await import('/src/js/services/auth-service.js');
      const authService = authServiceModule.default;

      const mockUser = {
        uid: 'user123',
        email: 'tester@example.com'
      };

      authService.getCurrentUser = () => mockUser;
      authService.getCurrentAvatarUrl = () => null;

      const avatar = document.querySelector('auth-avatar');
      avatar.updateAvatar(mockUser);
    });

    const avatar = page.locator('auth-avatar');
    const initialDiv = avatar.locator('.initial');

    await expect(initialDiv).toBeVisible();
    await expect(initialDiv).toHaveText('T'); // First letter of tester@example.com
    await expect(avatar.locator('.avatar')).not.toHaveClass(/signed-out/);

    await expect(avatar).toHaveScreenshot('auth-avatar-initials.png');
  });

  test('renders signed-in state with image', async ({ page }) => {
    await page.evaluate(async () => {
      const authServiceModule = await import('/src/js/services/auth-service.js');
      const authService = authServiceModule.default;

      const mockUser = {
        uid: 'user123',
        email: 'tester@example.com'
      };

      authService.getCurrentUser = () => mockUser;
      // Use a simple data URI for the image
      authService.getCurrentAvatarUrl = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      const avatar = document.querySelector('auth-avatar');
      avatar.updateAvatar(mockUser);
    });

    const avatar = page.locator('auth-avatar');
    const img = avatar.locator('img');

    await expect(img).toBeVisible();
    await expect(avatar.locator('.avatar')).not.toHaveClass(/signed-out/);

    await expect(avatar).toHaveScreenshot('auth-avatar-image.png');
  });

  test('opens auth modal when clicked (signed out)', async ({ page }) => {
    // Check signed out state click
    await page.evaluate(async () => {
      const authServiceModule = await import('/src/js/services/auth-service.js');
      const authService = authServiceModule.default;
      authService.getCurrentUser = () => null;

      const avatar = document.querySelector('auth-avatar');
      avatar.updateAvatar(null);

      // Mock auth controller and content methods
      const authController = document.querySelector('auth-controller');
      const authContent = document.querySelector('auth-content');

      window.modalOpened = false;
      window.authFormsShown = false;

      authController.openModal = () => { window.modalOpened = true; };
      authContent.showAuthForms = () => { window.authFormsShown = true; };
    });

    const avatar = page.locator('auth-avatar');
    await avatar.click();

    const result = await page.evaluate(() => ({
      modalOpened: window.modalOpened,
      authFormsShown: window.authFormsShown
    }));

    expect(result.modalOpened).toBe(true);
    expect(result.authFormsShown).toBe(true);
  });

  test('opens profile when clicked (signed in)', async ({ page }) => {
    await page.evaluate(async () => {
      const authServiceModule = await import('/src/js/services/auth-service.js');
      const authService = authServiceModule.default;
      const mockUser = { uid: 'u1', email: 'e@e.com' };
      authService.getCurrentUser = () => mockUser;

      const avatar = document.querySelector('auth-avatar');
      avatar.updateAvatar(mockUser);

      const authController = document.querySelector('auth-controller');
      const authContent = document.querySelector('auth-content');

      window.modalOpened = false;
      window.userProfileShown = false;

      authController.openModal = () => { window.modalOpened = true; };
      authContent.showUserProfile = () => { window.userProfileShown = true; };
    });

    const avatar = page.locator('auth-avatar');
    await avatar.click();

    const result = await page.evaluate(() => ({
      modalOpened: window.modalOpened,
      userProfileShown: window.userProfileShown
    }));

    expect(result.modalOpened).toBe(true);
    expect(result.userProfileShown).toBe(true);
  });
});
