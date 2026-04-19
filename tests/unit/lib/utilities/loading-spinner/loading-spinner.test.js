import { jest } from '@jest/globals';
import 'src/lib/utilities/loading-spinner/loading-spinner.js';

describe('LoadingSpinner', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Clear styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  test('element is registered and can be created', () => {
    const el = document.createElement('loading-spinner');
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.shadowRoot).not.toBeNull();
  });

  test('default attributes are set correctly', () => {
    const el = document.createElement('loading-spinner');
    document.body.appendChild(el);

    expect(el.size).toBe('40px');
    expect(el.lineWidth).toBe('4px');
    expect(el.color).toBe('#333');
    expect(el.backgroundColor).toBe('transparent');
    expect(el.length).toBe('three-quarters');
    expect(el.borderRadius).toBe('0px');
  });

  test('renders spinner correctly', () => {
    const el = document.createElement('loading-spinner');
    document.body.appendChild(el);

    const shadow = el.shadowRoot;
    const overlay = shadow.querySelector('.overlay');
    const spinner = shadow.querySelector('.spinner');

    expect(overlay).not.toBeNull();
    expect(spinner).not.toBeNull();

    // Default is active false so overlay is display none if no overlay attribute
    // Note: getComputedStyle might be block if JSDOM doesn't apply inline style mapping perfectly
    // without full layout engine. But let's check the innerHTML styling or specific inline style.
    const styleEl = shadow.querySelector('style');
    expect(styleEl.textContent).toContain('display: none;'); // it evaluates to flex or none in string
  });

  test('renders overlay when active and overlay attributes are present', () => {
    const el = document.createElement('loading-spinner');
    el.setAttribute('active', '');
    el.setAttribute('overlay', '');
    document.body.appendChild(el);

    const shadow = el.shadowRoot;
    const styleEl = shadow.querySelector('style');
    expect(styleEl.textContent).toContain('display: flex;');
  });

  test('locks and unlocks scroll when active and overlay are toggled', () => {
    const el = document.createElement('loading-spinner');
    el.setAttribute('overlay', '');
    document.body.appendChild(el);

    // Initial state
    expect(document.body.style.overflow).toBe('');

    // Toggle active
    el.setAttribute('active', '');
    expect(document.body.style.overflow).toBe('hidden');

    // Remove active
    el.removeAttribute('active');
    expect(document.body.style.overflow).toBe('');
  });

  test('unlocks scroll when disconnected if it was active and overlay', () => {
    const el = document.createElement('loading-spinner');
    // For connectedCallback to trigger properly with attributes
    el.setAttribute('active', '');
    el.setAttribute('overlay', '');

    // The lockScroll is called when active changes, so we append then add active
    document.body.appendChild(el);
    // Actually in the implementation, lockScroll is only called in attributeChangedCallback,
    // not in connectedCallback.

    // So let's add active after it's connected
    el.removeAttribute('active');
    el.setAttribute('active', '');

    expect(document.body.style.overflow).toBe('hidden');

    el.remove(); // disconnectedCallback
    expect(document.body.style.overflow).toBe('');
  });
});
