/**
 * Forces all lazy-loaded images in the document and specified custom elements to load immediately.
 * Bypasses IntersectionObserver by setting src from data-src directly.
 * @param {import('@playwright/test').Page} page
 */
export async function forceLazyImages(page) {
  // Wait for all custom elements to finish loading data
  await page.evaluate(async () => {
    const customComponents = ['recipe-card'];

    // Helper to wait for all instances of a component to finish loading
    const waitForComponents = async () => {
      const allReady = () => {
        for (const tagName of customComponents) {
          const elements = document.querySelectorAll(tagName);
          for (const el of elements) {
            // Check if component has a shadow root and is NOT in loading state
            if (!el.shadowRoot || el.shadowRoot.querySelector('.loading')) {
              return false;
            }
            // Check if image is present but still has data-src
            const img = el.shadowRoot.querySelector('img[data-src]');
            if (img && !img.dataset.src) {
              return false; // Wait for data-src to be populated
            }
          }
        }
        return true;
      };

      if (allReady()) return;

      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (allReady()) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          resolve(); // Timeout fallback
        }, 5000);
      });
    };

    await waitForComponents();

    // 1. Handle regular img tags
    document.querySelectorAll('img[data-src]').forEach((img) => {
      if (img.dataset.src) {
        console.log('Force loading global image:', img.dataset.src.substring(0, 30));
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.remove('loading');
        img.classList.add('loaded');
      }
    });

    // 2. Handle known custom elements with shadow DOM
    customComponents.forEach((tagName) => {
      document.querySelectorAll(tagName).forEach((el) => {
        if (!el.shadowRoot) return;
        const img = el.shadowRoot.querySelector('img[data-src]');
        if (img && img.dataset.src) {
          console.log(`Force loading image in <${tagName}>:`, img.dataset.src.substring(0, 30));
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.remove('loading');
          img.classList.add('loaded');
        }
      });
    });
  });
}
