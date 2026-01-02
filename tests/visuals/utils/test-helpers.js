/**
 * Forces all lazy-loaded images in the document and specified custom elements to load immediately.
 * Bypasses IntersectionObserver by setting src from data-src directly.
 * @param {import('@playwright/test').Page} page
 */
export async function forceLazyImages(page) {
  await page.evaluate(() => {
    // 1. Handle regular img tags
    document.querySelectorAll('img[data-src]').forEach((img) => {
      console.log('Force loading global image:', img.dataset.src.substring(0, 30));
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      img.classList.remove('loading');
      img.classList.add('loaded');
    });

    // 2. Handle known custom elements with shadow DOM (e.g. recipe-card)
    // Add other components here as needed
    const customComponents = ['recipe-card'];

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
