import { test, expect } from '@playwright/test';

test.describe('Loading Spinner Visuals', () => {
  test('renders correctly', async ({ page }) => {
    // Navigate to a blank page on the dev server domain to avoid cross-origin issues
    await page.goto('/tests/visuals/components/utilities/index.html');

    // Wait for the component to be defined
    await page.waitForFunction(() => !!customElements.get('loading-spinner'));

    // Get the element
    const spinner = page.locator('loading-spinner');

    // Take a screenshot
    await expect(spinner).toHaveScreenshot('loading-spinner-inactive.png');
  });
});

test('renders active overlay', async ({ page }) => {
  await page.goto('/tests/visuals/components/utilities/index.html');
  await page.waitForFunction(() => !!customElements.get('loading-spinner'));

  // Add overlay and active attributes
  await page.evaluate(() => {
    const spinner = document.querySelector('loading-spinner');
    spinner.setAttribute('overlay', '');
    spinner.setAttribute('active', '');

    // Stop the animation for a stable screenshot
    const style = document.createElement('style');
    style.innerHTML = `
        * {
          animation: none !important;
          transition: none !important;
        }
      `;
    spinner.shadowRoot.appendChild(style);
  });

  const spinner = page.locator('loading-spinner');

  // The overlay should cover the whole page, so we screenshot the page body
  await expect(page.locator('body')).toHaveScreenshot('loading-spinner-active-overlay.png');
});

test('renders custom color and size', async ({ page }) => {
  await page.goto('/tests/visuals/components/utilities/index.html');
  await page.waitForFunction(() => !!customElements.get('loading-spinner'));

  // Customize attributes
  await page.evaluate(() => {
    const spinner = document.querySelector('loading-spinner');
    spinner.setAttribute('color', '#ff0000');
    spinner.setAttribute('size', '80px');
    spinner.setAttribute('line-width', '8px');
    spinner.setAttribute('length', 'half');
    spinner.setAttribute('active', '');

    // Stop the animation for a stable screenshot
    const style = document.createElement('style');
    style.innerHTML = `
        * {
          animation: none !important;
          transition: none !important;
        }
      `;
    spinner.shadowRoot.appendChild(style);
  });

  const spinner = page.locator('loading-spinner');
  await expect(spinner).toHaveScreenshot('loading-spinner-custom.png');
});
