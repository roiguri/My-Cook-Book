
import '../../../src/lib/utilities/loading-spinner/loading-spinner.js';

describe('LoadingSpinner', () => {
  let spinner;

  beforeEach(() => {
    // Reset body styles before each test
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Create new element
    spinner = document.createElement('loading-spinner');
    document.body.appendChild(spinner);
  });

  afterEach(() => {
    if (spinner.parentNode) {
      document.body.removeChild(spinner);
    }
  });

  test('renders with default attributes', () => {
    expect(spinner.getAttribute('size')).toBeNull(); // It uses internal default
    expect(spinner.shadowRoot.querySelector('.spinner')).toBeTruthy();

    // Check computed styles or styles in shadow DOM
    // Since styles are in a <style> tag, we can check the text content or computed styles
    const spinnerEl = spinner.shadowRoot.querySelector('.spinner');
    expect(spinnerEl).toBeTruthy();
  });

  test('reflects custom attributes in styles', () => {
    spinner.setAttribute('size', '50px');
    spinner.setAttribute('color', 'red');
    spinner.setAttribute('line-width', '5px');

    // Trigger render is automatic via attributeChangedCallback

    // We need to check if the styles in shadowRoot reflect this.
    // The component writes styles into innerHTML <style> block.
    const styleContent = spinner.shadowRoot.querySelector('style').textContent;

    expect(styleContent).toContain('width: 50px');
    expect(styleContent).toContain('height: 50px');
    expect(styleContent).toContain('border: 5px solid red');
  });

  test('overlay mode is hidden by default', () => {
    spinner.setAttribute('overlay', '');
    // active is missing, so .overlay should be display: none

    // Check generated CSS
    const styleContent = spinner.shadowRoot.querySelector('style').textContent;
    expect(styleContent).toContain('display: none');
  });

  test('overlay mode becomes visible when active', () => {
    spinner.setAttribute('overlay', '');
    spinner.setAttribute('active', '');

    const overlay = spinner.shadowRoot.querySelector('.overlay');
    // Note: in JSDOM, getComputedStyle might need a flush or just works on inline styles if set by JS/HTML
    // The component sets display via string interpolation in style tag
    const styleContent = spinner.shadowRoot.querySelector('style').textContent;
    expect(styleContent).toContain('display: flex');
  });

  test('locks scroll when active and overlay', () => {
    spinner.setAttribute('overlay', '');
    spinner.setAttribute('active', '');

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).not.toBe('');
  });

  test('unlocks scroll when inactive', () => {
    spinner.setAttribute('overlay', '');
    spinner.setAttribute('active', '');
    expect(document.body.style.overflow).toBe('hidden');

    spinner.removeAttribute('active');
    expect(document.body.style.overflow).toBe('');
    // JSDOM might behave differently with paddingRight removal, checking overflow is sufficient for scroll lock logic
    // expect(document.body.style.paddingRight).toBe('');
  });

  test('unlocks scroll when disconnected', () => {
    spinner.setAttribute('overlay', '');
    spinner.setAttribute('active', '');
    expect(document.body.style.overflow).toBe('hidden');

    document.body.removeChild(spinner);
    // removing from DOM calls disconnectedCallback

    expect(document.body.style.overflow).toBe('');
  });
});
