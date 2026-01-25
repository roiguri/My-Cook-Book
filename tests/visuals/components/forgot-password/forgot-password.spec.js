import { test, expect } from '@playwright/test';

test.describe('ForgotPassword Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test harness page
    await page.goto('/tests/visuals/components/forgot-password/index.html');

    // Wait for the component to be defined and upgraded
    await page.waitForSelector('forgot-password', { state: 'visible' });

    // Mock auth controller
    await page.evaluate(() => {
      const forgotPassword = document.querySelector('forgot-password');

      const mockAuthController = {
        handlePasswordReset: async (email) => {
          console.log(`Password reset attempted for: ${email}`);
          return Promise.resolve();
        },
      };

      // Override closest to return our mock
      Object.defineProperty(forgotPassword, 'closest', {
        value: (selector) => {
          if (selector === 'auth-controller') {
            return mockAuthController;
          }
          return null;
        },
        writable: true,
        configurable: true,
      });
    });

    // Wait for any animations or fonts
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
  });

  test('should render forgot password form correctly (visual)', async ({ page }) => {
    const forgotPassword = page.locator('forgot-password');
    await expect(forgotPassword).toBeVisible();

    const emailInput = forgotPassword.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('id', 'forgot-email');

    const submitBtn = forgotPassword.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText('שלח קישור לאיפוס סיסמה');

    const backLink = forgotPassword.locator('#back-to-login');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveText('חזרה להתחברות');

    // Visual Snapshot
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('forgot-password-default.png', {
      maxDiffPixels: 1000,
      threshold: 0.3,
    });
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const forgotPassword = page.locator('forgot-password');

    const emailInput = forgotPassword.locator('input[type="email"]');
    await emailInput.fill('invalid-email');

    const isValid = await emailInput.evaluate((el) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should attempt password reset on submit', async ({ page }) => {
    const forgotPassword = page.locator('forgot-password');

    await forgotPassword.locator('input[type="email"]').fill('test@example.com');

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await forgotPassword.locator('button[type="submit"]').click();

    await page.waitForTimeout(100);

    expect(consoleLogs).toContain('Password reset attempted for: test@example.com');

    // Check for success message
    const successMsg = forgotPassword.locator('#reset-success');
    await expect(successMsg).toBeVisible();
    await expect(successMsg).toHaveText('קישור לאיפוס סיסמה נשלח לכתובת המייל שלך');

    // Visual Snapshot for success state
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('forgot-password-success.png', {
      maxDiffPixels: 1000,
      threshold: 0.3,
    });
  });

  test('should show error message on failed reset', async ({ page }) => {
    // Update mock to fail
    await page.evaluate(() => {
      const forgotPassword = document.querySelector('forgot-password');
      const mockAuthController = {
        handlePasswordReset: async () => {
          throw new Error('User not found');
        },
      };

      Object.defineProperty(forgotPassword, 'closest', {
        value: (selector) => {
          if (selector === 'auth-controller') return mockAuthController;
          return null;
        },
        writable: true,
        configurable: true, // Allow redefining
      });
    });

    const forgotPassword = page.locator('forgot-password');

    await forgotPassword.locator('input[type="email"]').fill('unknown@example.com');
    await forgotPassword.locator('button[type="submit"]').click();

    const errorMsg = forgotPassword.locator('#reset-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('User not found');

    // Visual Snapshot for error state
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('forgot-password-error.png', {
      maxDiffPixels: 1000,
      threshold: 0.3,
    });
  });

  test('should emit back-to-login event', async ({ page }) => {
    // Listen for custom event
    await page.evaluate(() => {
      document.addEventListener('back-to-login', () => {
        console.log('back-to-login event caught');
      });
    });

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    const forgotPassword = page.locator('forgot-password');
    await forgotPassword.locator('#back-to-login').click();

    await page.waitForTimeout(50);
    expect(consoleLogs).toContain('back-to-login event caught');
  });
});
