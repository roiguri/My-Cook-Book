/**
 * Sets up a mock AuthController for testing components that depend on it (like login-form, signup-form).
 * It overrides the `closest` method on the target component to return a mock controller.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object
 * @param {string} componentSelector - Selector for the component to mock context for (e.g. 'signup-form')
 * @param {Object} options - Mock behavior options
 * @param {string|Object} options.failSignupWith - If set, handleSignup will throw error. Can be string or { code, message }
 * @param {string|Object} options.failLoginWith - If set, handleLogin will throw error. Can be string or { code, message }
 */
export async function setupAuthControllerMock(page, componentSelector, options = {}) {
  await page.evaluate(({ selector, opts }) => {
    const component = document.querySelector(selector);
    if (!component) return;

    const createError = (errorInput) => {
      if (typeof errorInput === 'string') {
        return new Error(errorInput);
      }
      const error = new Error(errorInput.message || 'Auth Error');
      if (errorInput.code) {
        error.code = errorInput.code;
      }
      return error;
    };

    const mockAuthController = {
      handleSignup: async (email, password, fullName) => {
        if (opts.failSignupWith) {
          throw createError(opts.failSignupWith);
        }
        console.log(`Signup attempted with: ${email}, ${password}, ${fullName}`);
        return Promise.resolve();
      },
      handleLogin: async (email, password, remember) => {
        if (opts.failLoginWith) {
           throw createError(opts.failLoginWith);
        }
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

    // Override closest to return our mock when asking for auth-controller
    Object.defineProperty(component, 'closest', {
      value: (selector) => {
        if (selector === 'auth-controller') {
          return mockAuthController;
        }
        return null;
      },
      writable: true,
      configurable: true,
    });
  }, { selector: componentSelector, opts: options });
}
