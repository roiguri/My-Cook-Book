/**
 * RecipeScroller - Minimal horizontal scroller with browser-native scrolling
 *
 * @attribute {string} item-width - Fixed width for each item (default: 200px)
 * @attribute {string} gap - Gap between items (default: 20px)
 *
 * @example
 * <recipe-scroller item-width="200px" gap="20px">
 *   <div slot="items">
 *     <recipe-card recipe-id="1"></recipe-card>
 *     <recipe-card recipe-id="2"></recipe-card>
 *   </div>
 * </recipe-scroller>
 */

class RecipeScroller extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Defaults
    this.itemWidth = '200px';
    this.gap = '20px';

    // Bind resize handler
    this.handleResize = this.handleResize.bind(this);
  }

  static get observedAttributes() {
    return ['item-width', 'gap'];
  }

  connectedCallback() {
    this.render();
    window.addEventListener('resize', this.handleResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    this.updateCentering();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'item-width':
          this.itemWidth = newValue || '200px';
          break;
        case 'gap':
          this.gap = newValue || '20px';
          break;
      }
    }
  }

  applyItemStyles() {
    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) return;

    const assignedElements = slot.assignedElements();
    if (!assignedElements || assignedElements.length === 0) return;

    const container = assignedElements[0];
    if (!container) return;

    // Apply flex display and gap to container
    container.style.display = 'flex';
    container.style.gap = this.gap;

    // Set width for each child
    // For recipe-card, use card-width attribute which triggers internal dimension update
    Array.from(container.children).forEach((child) => {
      if (child.tagName.toLowerCase() === 'recipe-card') {
        child.setAttribute('card-width', this.itemWidth);
      }
      child.style.flexShrink = '0';
    });

    // Update centering after setting widths
    setTimeout(() => this.updateCentering(), 0);
  }

  updateCentering() {
    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) return;

    const assignedElements = slot.assignedElements();
    if (!assignedElements || assignedElements.length === 0) return;

    const container = assignedElements[0];
    if (!container) return;

    const scrollerDiv = this.shadowRoot.querySelector('.recipe-scroller');
    if (!scrollerDiv) return;

    // Calculate if content fits without scrolling
    const containerWidth = scrollerDiv.offsetWidth;
    const contentWidth = container.scrollWidth;

    // Only center if content fits within container (no overflow)
    if (contentWidth <= containerWidth) {
      container.style.justifyContent = 'center';
    } else {
      container.style.justifyContent = 'flex-start';
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .recipe-scroller {
          width: 100%;
          min-width: 200px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-top: 15px;
          padding-bottom: 15px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Scrollbar styling */
        .recipe-scroller::-webkit-scrollbar {
          height: 8px;
        }

        .recipe-scroller::-webkit-scrollbar-track {
          background: var(--background-light, #f5f5f5);
          border-radius: 4px;
        }

        .recipe-scroller::-webkit-scrollbar-thumb {
          background: var(--primary-color, #3498db);
          border-radius: 4px;
        }

        .recipe-scroller::-webkit-scrollbar-thumb:hover {
          background: var(--primary-dark, #2980b9);
        }
      </style>

      <div class="recipe-scroller">
        <slot name="items"></slot>
      </div>
    `;

    // Setup slot change listener to apply styles when content changes
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      this.applyItemStyles();
    });
  }
}

customElements.define('recipe-scroller', RecipeScroller);
