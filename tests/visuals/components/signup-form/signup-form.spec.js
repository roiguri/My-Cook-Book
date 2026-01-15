import { test, expect } from '@playwright/test';

test.describe('SignupForm Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test harness page
    await page.goto('/tests/visuals/components/signup-form/index.html');

    // Wait for the component to be defined and upgraded
    await page.waitForSelector('signup-form', { state: 'visible' });

    // Mock auth controller functionality via closest
    await page.evaluate(() => {
      const signupForm = document.querySelector('signup-form');

      const mockAuthController = {
        handleSignup: async (email, password, fullName) => {
          console.log(`Signup attempted with: ${email}, ${password}, ${fullName}`);
          return Promise.resolve();
        },
        handleGoogleSignIn: async () => {
          console.log('Google Sign In attempted');
          return Promise.resolve();
        },
      };

      // Override closest to return our mock
      Object.defineProperty(signupForm, 'closest', {
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
  });

  test('should render signup form correctly (visual)', async ({ page }) => {
    const signupForm = page.locator('signup-form');
    await expect(signupForm).toBeVisible();

    // Check inputs
    const nameInput = signupForm.locator('input#fullName');
    await expect(nameInput).toBeVisible();

    const emailInput = signupForm.locator('input#signup-email');
    await expect(emailInput).toBeVisible();

    const passwordInput = signupForm.locator('input#signup-password');
    await expect(passwordInput).toBeVisible();

    const confirmInput = signupForm.locator('input#signup-confirmPassword');
    await expect(confirmInput).toBeVisible();

    const submitBtn = signupForm.locator('button.submit-button');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText('הרשמה');

    // Visual Snapshot
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('signup-form-default.png');
  });

  test('should show password strength indicator', async ({ page }) => {
    const signupForm = page.locator('signup-form');
    const passwordInput = signupForm.locator('input#signup-password');
    const strengthMeter = signupForm.locator('.strength-meter');

    // Weak (just length)
    await passwordInput.fill('password');
    await expect(strengthMeter).toHaveClass(/weak/);

    // Medium (length + number + caps)
    await passwordInput.fill('Password123');
    await expect(strengthMeter).toHaveClass(/medium/);

    // Strong (length + number + caps + special)
    await passwordInput.fill('Password123!');
    await expect(strengthMeter).toHaveClass(/strong/);
  });

  test('should show error when passwords do not match', async ({ page }) => {
    const signupForm = page.locator('signup-form');

    await signupForm.locator('input#signup-password').fill('password123');
    await signupForm.locator('input#signup-confirmPassword').fill('password456');

    // Trigger validation logic (on input)
    await signupForm.locator('input#signup-confirmPassword').dispatchEvent('input');

    const errorMsg = signupForm.locator('#signup-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('הסיסמאות אינן תואמות');
  });

  test('should attempt signup on submit', async ({ page }) => {
    const signupForm = page.locator('signup-form');

    await signupForm.locator('input#fullName').fill('Test User');
    await signupForm.locator('input#signup-email').fill('newuser@example.com');
    await signupForm.locator('input#signup-password').fill('Password123!');
    await signupForm.locator('input#signup-confirmPassword').fill('Password123!');

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await signupForm.locator('button.submit-button').click();

    // Verify loading state
    const submitBtn = signupForm.locator('button.submit-button');
    // It might be too fast to catch "disabled", but we can check the log

    await page.waitForTimeout(100);

    expect(consoleLogs).toContain('Signup attempted with: newuser@example.com, Password123!, Test User');
  });

  test('should trigger google signup', async ({ page }) => {
    const signupForm = page.locator('signup-form');
    const googleBtn = signupForm.locator('.gsi-material-button');

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await googleBtn.click();

    await page.waitForTimeout(100);

    expect(consoleLogs).toContain('Google Sign In attempted');
  });

  test('should show error message on failed signup', async ({ page }) => {
    // Update mock to fail
    await page.evaluate(() => {
      const signupForm = document.querySelector('signup-form');
      const mockAuthController = {
        handleSignup: async () => {
          throw new Error('Email already in use');
        },
      };

      Object.defineProperty(signupForm, 'closest', {
        value: (selector) => {
          if (selector === 'auth-controller') return mockAuthController;
          return null;
        },
      });
    });

    const signupForm = page.locator('signup-form');

    await signupForm.locator('input#fullName').fill('Test User');
    await signupForm.locator('input#signup-email').fill('existing@example.com');
    await signupForm.locator('input#signup-password').fill('Password123!');
    await signupForm.locator('input#signup-confirmPassword').fill('Password123!');

    await signupForm.locator('button.submit-button').click();

    const errorMsg = signupForm.locator('#signup-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Email already in use');

    // Visual Snapshot for error state
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('signup-form-error.png');
  });
});
