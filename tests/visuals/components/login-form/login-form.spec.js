import { test, expect } from '@playwright/test';

test.describe('LoginForm Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app root to ensure we are in the correct context/origin
    await page.goto('/');

    // Inject the component script and styles dynamically
    await page.evaluate(async () => {
      // Import the component module
      await import('/src/lib/auth/components/login-form.js');

      // Create and append the component to the body, clearing existing content to isolate
      document.body.innerHTML = '';
      const loginForm = document.createElement('login-form');

      // Style it to be visible
      loginForm.style.display = 'block';
      loginForm.style.width = '100%';
      loginForm.style.maxWidth = '500px';
      loginForm.style.margin = '20px auto';
      loginForm.style.border = '1px solid #ccc';
      // Add padding for better snapshot
      loginForm.style.padding = '20px';
      loginForm.style.backgroundColor = '#fff';

      document.body.appendChild(loginForm);

      // Mock auth controller and close modal functionality via closest
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
          // Fallback to original behavior if needed, though for this test likely not
          return HTMLElement.prototype.closest.call(loginForm, selector);
        },
        writable: true,
        configurable: true,
      });
    });

    // Wait for the component to be defined and upgraded
    await page.waitForSelector('login-form', { state: 'visible' });
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

    // Visual Snapshot
    await expect(loginForm).toHaveScreenshot('login-form-default.png');
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
    await expect(loginForm).toHaveScreenshot('login-form-error.png');
  });
});
