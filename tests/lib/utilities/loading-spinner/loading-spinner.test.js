import '../../../../src/lib/utilities/loading-spinner/loading-spinner.js';

describe('LoadingSpinner', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('loading-spinner');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  test('default attributes are used when none are provided', () => {
    expect(element.size).toBe('40px');
    expect(element.lineWidth).toBe('4px');
    expect(element.color).toBe('#333');
    expect(element.backgroundColor).toBe('transparent');
    expect(element.length).toBe('three-quarters');
    expect(element.borderRadius).toBe('0px');
  });

  test('attributes override defaults', () => {
    element.setAttribute('size', '10px');
    element.setAttribute('line-width', '1px');
    element.setAttribute('color', 'red');
    element.setAttribute('background-color', 'blue');
    element.setAttribute('length', 'half');
    element.setAttribute('border-radius', '10px');

    expect(element.size).toBe('10px');
    expect(element.lineWidth).toBe('1px');
    expect(element.color).toBe('red');
    expect(element.backgroundColor).toBe('blue');
    expect(element.length).toBe('half');
    expect(element.borderRadius).toBe('10px');
  });

  test('scroll locking works when overlay and active are true', () => {
    // Initial state
    expect(document.body.style.overflow).toBe('');

    // Both overlay and active needed
    element.setAttribute('overlay', '');
    element.setAttribute('active', '');

    // Fast forward to trigger attributeChangedCallback
    expect(document.body.style.overflow).toBe('hidden');

    // Removing active restores scroll
    element.removeAttribute('active');
    expect(document.body.style.overflow).toBe('');
  });
});
