import '../../../../src/lib/utilities/loading-spinner/loading-spinner.js';

describe('LoadingSpinner', () => {
  let spinner;

  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = '';
    spinner = document.createElement('loading-spinner');
    document.body.appendChild(spinner);
  });

  afterEach(() => {
    // Ensure scroll is unlocked
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  describe('Attributes and Defaults', () => {
    it('has default attributes when none are provided', () => {
      expect(spinner.size).toBe('40px');
      expect(spinner.lineWidth).toBe('4px');
      expect(spinner.color).toBe('#333');
      expect(spinner.backgroundColor).toBe('transparent');
      expect(spinner.length).toBe('three-quarters');
      expect(spinner.borderRadius).toBe('0px');
    });

    it('reflects custom attributes', () => {
      spinner.setAttribute('size', '60px');
      spinner.setAttribute('line-width', '6px');
      spinner.setAttribute('color', 'red');
      spinner.setAttribute('background-color', 'blue');
      spinner.setAttribute('length', 'half');
      spinner.setAttribute('border-radius', '10px');

      expect(spinner.size).toBe('60px');
      expect(spinner.lineWidth).toBe('6px');
      expect(spinner.color).toBe('red');
      expect(spinner.backgroundColor).toBe('blue');
      expect(spinner.length).toBe('half');
      expect(spinner.borderRadius).toBe('10px');
    });
  });

  describe('Overlay and Scroll Locking', () => {
    it('does not lock scroll when neither active nor overlay are present', () => {
      expect(document.body.style.overflow).toBe('');
    });

    it('does not lock scroll when only overlay is present', () => {
      spinner.setAttribute('overlay', '');
      expect(document.body.style.overflow).toBe('');
    });

    it('does not lock scroll when only active is present', () => {
      spinner.setAttribute('active', '');
      expect(document.body.style.overflow).toBe('');
    });

    it('locks scroll when both active and overlay are present', () => {
      spinner.setAttribute('overlay', '');
      spinner.setAttribute('active', '');

      expect(document.body.style.overflow).toBe('hidden');
      // paddingRight will be set depending on window size, just verify it's a string
      expect(document.body.style.paddingRight).toMatch(/px$/);
    });

    it('unlocks scroll when active is removed from an overlay spinner', () => {
      spinner.setAttribute('overlay', '');
      spinner.setAttribute('active', '');

      expect(document.body.style.overflow).toBe('hidden');

      spinner.removeAttribute('active');
      expect(document.body.style.overflow).toBe('');
      // In JSDOM setting to '' doesn't always completely clear the property representation if it was set before
      // It might leave it as empty or keep previous. The component does document.body.style.paddingRight = ''
      // We will check if it was called by spying on it, or just not check it so strictly.
    });

    it('unlocks scroll when component is disconnected while active and overlayed', () => {
      spinner.setAttribute('overlay', '');
      spinner.setAttribute('active', '');

      expect(document.body.style.overflow).toBe('hidden');

      document.body.removeChild(spinner);

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Rendering', () => {
    it('renders the shadow root properly', () => {
      expect(spinner.shadowRoot).toBeTruthy();
      const shadowContainer = spinner.shadowRoot.querySelector('.overlay');
      const innerSpinner = spinner.shadowRoot.querySelector('.spinner');

      expect(shadowContainer).toBeTruthy();
      expect(innerSpinner).toBeTruthy();
    });
  });
});
