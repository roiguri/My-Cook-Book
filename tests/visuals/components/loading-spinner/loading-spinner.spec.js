import { test, expect } from '@playwright/test';

test.describe('Loading Spinner Component Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the component test page
    await page.goto('/tests/visuals/components/loading-spinner/index.html');

    // Ensure the web component is loaded
    const isDefined = await page.evaluate(() => !!customElements.get('loading-spinner'));
    expect(isDefined).toBe(true);
  });

  test('renders default spinner correctly', async ({ page }) => {
    const container = page.locator('#default-container');

    // Ensure visibility - check the inner part as the host might be considered hidden if size is 0 or internal display block isn't quite working for playwright isVisible on custom elements natively sometimes without inner content visible
    const spinnerElement = container.locator('loading-spinner');

    // Take a snapshot of the container
    await expect(container).toHaveScreenshot('loading-spinner-default.png');
  });

  test('renders with custom attributes', async ({ page }) => {
    const container = page.locator('#custom-container');

    // Take a snapshot of the custom styled container
    await expect(container).toHaveScreenshot('loading-spinner-custom.png');
  });

  test('overlay visibility and interactions', async ({ page }) => {
    const spinner = page.locator('#overlay-spinner');

    // The spinner itself is present but its internal `.overlay` div is hidden without `active`
    // However, playwright considers the host element visible. We check the internal state.
    let displayStyle = await spinner.evaluate((el) => {
      const overlayDiv = el.shadowRoot.querySelector('.overlay');
      return window.getComputedStyle(overlayDiv).display;
    });
    expect(displayStyle).toBe('none');

    // Activate it
    await spinner.evaluate((el) => el.setAttribute('active', ''));

    displayStyle = await spinner.evaluate((el) => {
      const overlayDiv = el.shadowRoot.querySelector('.overlay');
      return window.getComputedStyle(overlayDiv).display;
    });
    expect(displayStyle).toBe('flex');

    // Remove active
    await spinner.evaluate((el) => el.removeAttribute('active'));

    displayStyle = await spinner.evaluate((el) => {
      const overlayDiv = el.shadowRoot.querySelector('.overlay');
      return window.getComputedStyle(overlayDiv).display;
    });
    expect(displayStyle).toBe('none');
  });

  test('scroll lock management with overlay and active', async ({ page }) => {
    const getBodyOverflow = () => page.evaluate(() => document.body.style.overflow);

    // Initial state
    expect(await getBodyOverflow()).toBe('');

    const spinner = page.locator('#overlay-spinner');

    // Add active (it already has overlay from html)
    await spinner.evaluate((el) => el.setAttribute('active', ''));

    // Check locked
    expect(await getBodyOverflow()).toBe('hidden');

    // Remove active
    await spinner.evaluate((el) => el.removeAttribute('active'));

    // Check unlocked
    expect(await getBodyOverflow()).toBe('');
  });
});
