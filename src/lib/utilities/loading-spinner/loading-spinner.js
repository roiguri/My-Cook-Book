/**
 * Loading Spinner Web Component
 * A customizable loading spinner component
 *
 * @attributes
 * - size: The size of the spinner (default: 40px)
 * - line-width: The width of the spinner line (default: 4px)
 * - color: The color of the spinner (default: #333)
 * - length: The length of the spinner (default: 'three-quarters', options: 'quarter', 'half', 'three-quarters')
 * - background-color: The background color of the spinner (default: transparent)
 * - overlay: If present, spinner is centered in a full-cover overlay
 * - active: If present, spinner is visible; if not, spinner is hidden
 */
class LoadingSpinner extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'line-width', 'color', 'background-color', 'length', 'overlay', 'active'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._size = '40px';
    this._lineWidth = '4px';
    this._length = 'three-quarters';
    this._color = '#333';
    this._backgroundColor = 'transparent';
  }

  get size() {
    return this.getAttribute('size') || this._size;
  }

  get lineWidth() {
    return this.getAttribute('line-width') || this._lineWidth;
  }

  get color() {
    return this.getAttribute('color') || this._color;
  }

  get backgroundColor() {
    return this.getAttribute('background-color') || this._backgroundColor;
  }

  get length() {
    return this.getAttribute('length') || this._length;
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this._render();
  }

  _render() {
    const isOverlay = this.hasAttribute('overlay');
    const isActive = this.hasAttribute('active');
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        position: ${isOverlay ? 'relative' : 'static'};
      }
      .overlay {
        display: ${isActive && isOverlay ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        position: fixed;
        inset: 0;
        background: rgba(255,255,255,0.7);
        z-index: 10000;
        pointer-events: all;
      }
      .spinner {
        border: ${this.lineWidth} solid ${this.color};
        border-top-color: transparent;
        border-right-color: ${this.length === 'half' || this.length === 'quarter' ? 'transparent' : this.color};
        border-bottom-color: ${this.length === 'quarter' ? 'transparent' : this.color};
        border-radius: 50%;
        width: ${this.size};
        height: ${this.size};
        background: ${this.backgroundColor};
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      </style>
      <slot></slot>
      <div class="overlay"><div class="spinner"></div></div>
    `;
  }
}

customElements.define('loading-spinner', LoadingSpinner);
