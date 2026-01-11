import { test, expect } from '@playwright/test';

test.describe('LoginForm Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test harness page
    await page.goto('/tests/visuals/components/login-form/index.html');

    // Wait for the component to be defined and upgraded
    await page.waitForSelector('login-form', { state: 'visible' });

    // Mock auth controller and close modal functionality via closest
    await page.evaluate(() => {
      const loginForm = document.querySelector('login-form');

      const mockAuthController = {
        handleLogin: async (email, password, remember) => {
          console.log(`Login attempted with: ${email}, ${password}, ${remember}`);
          return Promise.resolve();
        },
        handleGoogleSignIn: async () => {
          console.log('Google Sign In attempted');
          return Promise.resolve();
        },
        closeModal: () => {
          console.log('Modal closed');
        },
      };

      // We need to override closest on the instance since it's a native method
      // Using Object.defineProperty to shadow the prototype method
      Object.defineProperty(loginForm, 'closest', {
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

  test('should render login form correctly (visual)', async ({ page }) => {
    const loginForm = page.locator('login-form');
    await expect(loginForm).toBeVisible();

    const emailInput = loginForm.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('id', 'login-email');

    const passwordInput = loginForm.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('id', 'login-password');

    const submitBtn = loginForm.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText('התחבר');

    // Visual Snapshot of the container to capture the form context
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('login-form-default.png');
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const loginForm = page.locator('login-form');

    const emailInput = loginForm.locator('input[type="email"]');
    await emailInput.fill('invalid-email');

    const isValid = await emailInput.evaluate((el) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should attempt login on submit', async ({ page }) => {
    const loginForm = page.locator('login-form');

    await loginForm.locator('input[type="email"]').fill('test@example.com');
    await loginForm.locator('input[type="password"]').fill('password123');

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await loginForm.locator('button[type="submit"]').click();

    await page.waitForTimeout(100);

    expect(consoleLogs).toContain('Login attempted with: test@example.com, password123, false');
    expect(consoleLogs).toContain('Modal closed');
  });

  test('should trigger google login', async ({ page }) => {
    const loginForm = page.locator('login-form');
    const googleBtn = loginForm.locator('.gsi-material-button');

    await expect(googleBtn).toBeVisible();

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await googleBtn.click();

    await page.waitForTimeout(100);

    expect(consoleLogs).toContain('Google Sign In attempted');
    expect(consoleLogs).toContain('Modal closed');
  });

  test('should show error message on failed login', async ({ page }) => {
    // Update mock to fail
    await page.evaluate(() => {
      const loginForm = document.querySelector('login-form');
      const mockAuthController = {
        handleLogin: async () => {
          const error = new Error('Invalid credentials');
          error.code = 'INVALID_LOGIN_CREDENTIALS';
          throw error;
        },
        closeModal: () => {},
      };

      Object.defineProperty(loginForm, 'closest', {
        value: (selector) => {
          if (selector === 'auth-controller') return mockAuthController;
          return null;
        },
      });
    });

    const loginForm = page.locator('login-form');

    await loginForm.locator('input[type="email"]').fill('wrong@example.com');
    await loginForm.locator('input[type="password"]').fill('wrongpass');

    await loginForm.locator('button[type="submit"]').click();

    const errorMsg = loginForm.locator('#login-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('שם משתמש או סיסמה שגויים');

    // Visual Snapshot for error state
    const container = page.locator('.test-container');
    await expect(container).toHaveScreenshot('login-form-error.png');
  });
});
