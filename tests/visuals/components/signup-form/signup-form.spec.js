import { test, expect } from '@playwright/test';
import { setupAuthControllerMock } from '../../utils/auth-mocks.js';

test.describe('SignupForm Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test harness page
    await page.goto('/tests/visuals/components/signup-form/index.html');

    // Wait for the component to be defined and upgraded
    await page.waitForSelector('signup-form', { state: 'visible' });

    // Setup Mock
    await setupAuthControllerMock(page, 'signup-form');

    // Wait for any animations or fonts
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
  });

  test('should render signup form correctly (visual)', async ({ page }) => {
    const signupForm = page.locator('signup-form');
    await expect(signupForm).toBeVisible();

    // Check inputs using accessibility selectors
    await expect(signupForm.getByLabel('שם מלא')).toBeVisible();
    await expect(signupForm.getByLabel('כתובת מייל')).toBeVisible();
    await expect(signupForm.getByLabel(/^סיסמה$/)).toBeVisible(); // Exact match to avoid confusion with confirm password if it contained "password"
    await expect(signupForm.getByLabel('אימות סיסמה')).toBeVisible();

    const submitBtn = signupForm.getByRole('button', { name: /^הרשמה$/ });
    await expect(submitBtn).toBeVisible();

    // Visual Snapshot
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('signup-form-default.png', {
      maxDiffPixels: 1000,
      threshold: 0.3,
    });
  });

  test('should show password strength indicator', async ({ page }) => {
    const signupForm = page.locator('signup-form');
    const passwordInput = signupForm.getByLabel(/^סיסמה$/);
    const strengthMeter = signupForm.locator('.strength-meter');

    // Weak
    await passwordInput.fill('password');
    await expect(strengthMeter).toHaveClass(/weak/);

    // Medium
    await passwordInput.fill('Password123');
    await expect(strengthMeter).toHaveClass(/medium/);

    // Strong
    await passwordInput.fill('Password123!');
    await expect(strengthMeter).toHaveClass(/strong/);
  });

  test('should show error when passwords do not match', async ({ page }) => {
    const signupForm = page.locator('signup-form');

    await signupForm.getByLabel(/^סיסמה$/).fill('password123');
    await signupForm.getByLabel('אימות סיסמה').fill('password456');

    // Trigger validation logic (on input)
    await signupForm.getByLabel('אימות סיסמה').dispatchEvent('input');

    const errorMsg = signupForm.locator('#signup-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('הסיסמאות אינן תואמות');
  });

  test('should attempt signup on submit', async ({ page }) => {
    const signupForm = page.locator('signup-form');

    await signupForm.getByLabel('שם מלא').fill('Test User');
    await signupForm.getByLabel('כתובת מייל').fill('newuser@example.com');
    await signupForm.getByLabel(/^סיסמה$/).fill('Password123!');
    await signupForm.getByLabel('אימות סיסמה').fill('Password123!');

    // Setup listener for console log
    const consolePromise = page.waitForEvent('console', (msg) =>
      msg.text().includes('Signup attempted with: newuser@example.com, Password123!, Test User'),
    );

    await signupForm.getByRole('button', { name: /^הרשמה$/ }).click();

    // Wait for the log message to confirm the mock was called
    await consolePromise;
  });

  test('should trigger google signup', async ({ page }) => {
    const signupForm = page.locator('signup-form');
    const googleBtn = signupForm.getByRole('button', { name: 'הרשמה עם Google' });

    const consolePromise = page.waitForEvent('console', (msg) =>
      msg.text().includes('Google Sign In attempted'),
    );

    await googleBtn.click();

    await consolePromise;
  });

  test('should show error message on failed signup', async ({ page }) => {
    // Re-configure mock to fail with specific code
    await setupAuthControllerMock(page, 'signup-form', {
      failSignupWith: {
        code: 'auth/email-already-in-use',
        message: 'The email address is already in use by another account.',
      },
    });

    const signupForm = page.locator('signup-form');

    await signupForm.getByLabel('שם מלא').fill('Test User');
    await signupForm.getByLabel('כתובת מייל').fill('existing@example.com');
    await signupForm.getByLabel(/^סיסמה$/).fill('Password123!');
    await signupForm.getByLabel('אימות סיסמה').fill('Password123!');

    await signupForm.getByRole('button', { name: /^הרשמה$/ }).click();

    const errorMsg = signupForm.locator('#signup-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('כתובת האימייל הזו כבר נמצאת בשימוש.'); // Expect localized message

    // Visual Snapshot for error state
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('signup-form-error.png', {
      maxDiffPixels: 1000,
      threshold: 0.3,
    });
  });
});
