/**
 * ElementScroller Component
 * A horizontal scroller that can contain any HTML elements
 * 
 * @attribute {string} title - Optional title for the scroller
 * @attribute {boolean} collapsible - Whether the scroller can be collapsed
 * @attribute {string} background-color - Custom background color
 * @attribute {number} visible-items - Number of items visible at once (default: 3)
 * @attribute {boolean} continuous - Enable continuous scrolling (default: false)
 * 
 * Usage example:
 * <element-scroller visible-items="3" title="My Items">
 *   <div slot="items">
 *     <div class="item">Item 1</div>
 *     <div class="item">Item 2</div>
 *     <div class="item">Item 3</div>
 *   </div>
 * </element-scroller>
 */

class ElementScroller extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      this.collapsible = false;
      this.backgroundColor = null;
      this.visibleItems = 3;
      this.continuous = false;
      this.initialState = 'open';
      this.currentIndex = 0;
      this.isCollapsed = false;
  }

  static get observedAttributes() {
      return [
          'title',
          'visible-items',
          'continuous',
          'collapsible',
          'background-color',
          'item-height',
      ];
  }

  connectedCallback() {
      this.render();
      this.initScroller();
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
          switch (name) {
              case 'title':
                  this.title = newValue || undefined;
                  break;
              case 'visible-items':
                  this.visibleItems = parseInt(newValue, 10) || 3;
                  break;
              case 'continuous':
                  this.continuous = newValue === 'true';
                  break;
              case 'collapsible':
                  this.collapsible = newValue === 'true';
                  break;
              case 'background-color':
                  this.backgroundColor = newValue;
                  break;
              case 'item-height':
                this.itemHeight = newValue;
                break;
          }
          if (this.isConnected) {
              this.render();
              this.initScroller();
          }
      }
  }

  toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.updateCollapseState();
      this.updateNavigation();
  }

  updateCollapseState() {
    const container = this.shadowRoot.querySelector('.element-scroller__container');
    const dropdown = this.shadowRoot.querySelector('.element-scroller__dropdown');
    
    if (this.isCollapsed) {
      container.classList.add('collapsed');
      dropdown.innerHTML = '◀'; // Right arrow
    } else {
      container.classList.remove('collapsed');
      dropdown.innerHTML = '&#9660;'; // Down arrow
    }
  }

  initScroller() {
      this.scroller = this.shadowRoot.querySelector('.element-scroller__container');
      this.itemsContainer = this.shadowRoot.querySelector('.element-scroller__items');
      this.leftArrow = this.shadowRoot.querySelector('.element-scroller__arrow--left');
      this.rightArrow = this.shadowRoot.querySelector('.element-scroller__arrow--right');

      if (!this.scroller || !this.itemsContainer) return;

      this.updateScrollerWidth();
      this.updateNavigation();

      // Arrow navigation
      this.leftArrow?.addEventListener('click', () => this.scroll('left'));
      this.rightArrow?.addEventListener('click', () => this.scroll('right'));

      // Touch support
      let touchStartX = 0;
      this.itemsContainer.addEventListener('touchstart', (e) => {
          touchStartX = e.touches[0].clientX;
      });

      this.itemsContainer.addEventListener('touchend', (e) => {
          const touchEndX = e.changedTouches[0].clientX;
          if (touchEndX < touchStartX) {
              this.scroll('right');
          } else if (touchEndX > touchStartX) {
              this.scroll('left');
          }
      });

      // Add resize listener for responsiveness
      window.addEventListener('resize', this.updateScrollerWidth.bind(this));

      // Collapse functionality
      if (this.collapsible) {
          const dropdown = this.shadowRoot.querySelector('.element-scroller__dropdown');
          if (dropdown) {
              dropdown.addEventListener('click', () => this.toggleCollapse());
          }
          this.updateCollapseState();
      }
      
      // Observe slot changes
      const slot = this.shadowRoot.querySelector('slot');
      slot?.addEventListener('slotchange', () => {
          this.updateScrollerWidth();
          this.updateNavigation();
      });
  }

  updateScrollerWidth() {
    if (!this.scroller || !this.itemsContainer) return;

    const container = this.itemsContainer.assignedElements()[0];
    if (!container) return;

    this.updateNavigation();
  }

  scroll(direction) {
    if (!this.scroller || !this.itemsContainer) return;

    const container = this.itemsContainer.assignedElements()[0];
    if (!container) return;

    const items = container.children;
    const containerWidth = this.scroller.offsetWidth;

    if (direction === 'left') {
        this.currentIndex = Math.max(0, this.currentIndex - 1);
    } else {
        this.currentIndex = this.continuous
            ? (this.currentIndex + 1) % items.length
            : Math.min(items.length - this.visibleItems, this.currentIndex + 1);
    }
    console.log(this.currentIndex);

    const scrollAmount = containerWidth / this.visibleItems + 20; // 20px for gap
    container.style.transform = `translateX(-${this.currentIndex * scrollAmount}px)`;
    this.updateNavigation();
  }

  updateNavigation() {
    if (!this.leftArrow || !this.rightArrow || !this.itemsContainer) return;

    // If collapsed, hide arrows
    if (this.isCollapsed) {
        this.leftArrow.classList.remove('navigation-visible');
        this.rightArrow.classList.remove('navigation-visible');
        return;
    }

    const container = this.itemsContainer.assignedElements()[0];
    if (!container) return;
    
    const items = container.children;

    // Show left arrow only if we're not at the start (and not in continuous mode)
    if (this.continuous && this.currentIndex <= 0) {
      console.log('hide left');
        console.log('hide ' + this.currentIndex);
        console.log('hide ' + this.continuous);
        this.leftArrow.classList.remove('navigation-visible');
    } else {
      console.log('show left');
      console.log('show ' + this.currentIndex);
      console.log('show ' + this.continuous);
        this.leftArrow.classList.add('navigation-visible');
    }

    // Show right arrow only if we have more items to show (and not in continuous mode)
    if (this.continuous && this.currentIndex >= items.length - this.visibleItems) {
        this.rightArrow.classList.remove('navigation-visible');
    } else {
        this.rightArrow.classList.add('navigation-visible');
    }
  }

  render() {
      this.shadowRoot.innerHTML = `
          <style>
              .element-scroller {
                  background-color: ${this.backgroundColor || 'var(--background-color)'};
                  width: 100%;
                  overflow: hidden;
                  position: relative;
                  border-radius: 10px;
              }

              .element-scroller__container {
                  background-color: ${this.backgroundColor || 'var(--background-color)'};
                  padding: 20px;
                  transition: all 0.3s ease-in-out;
                  overflow: hidden;
              }

              .element-scroller__container.collapsed {
                  padding: 10px 20px;
              }

              .element-scroller__container.collapsed .element-scroller__items-wrapper {
                  height: 0;
                  opacity: 0;
                  margin: 0;
                  padding: 0;
              }

              .element-scroller__container.collapsed .element-scroller__title {
                margin-bottom: 0;
              }

              .element-scroller__title {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 10px;
                  font-size: 1.2em;
                  font-weight: bold;
              }

              .element-scroller__dropdown {
                  cursor: pointer;
                  transition: transform 0.3s ease;
                  padding: 5px;
                  user-select: none;
              }

              .element-scroller__dropdown:hover {
                  opacity: 0.7;
              }

              .element-scroller__items-wrapper {
                  overflow: hidden;
                  transition: all 0.3s ease-in-out;
              }

              ::slotted(*) {
                  display: flex !important;
                  gap: 20px;
                  transition: transform 0.3s ease-in-out;
                  height: ${this.itemHeight};
              }

              /* Fix for slotted items */
              ::slotted(*) > * {
                  flex: 0 0 calc(${100/this.visibleItems}% - ${(20 * (this.visibleItems-1))/this.visibleItems}px);
                  max-width: calc(${100/this.visibleItems}% - ${(20 * (this.visibleItems-1))/this.visibleItems}px);
                  box-sizing: border-box;
              }

              .element-scroller__items {
                  display: flex;
                  transition: transform 0.3s ease-in-out;
              }

              .element-scroller__arrow {
                  position: absolute;
                  top: 50%;
                  transform: translateY(-50%);
                  background-color: var(--primary-color, #3498db);
                  color: white;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  cursor: pointer;
                  z-index: 10;
                  display: none;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                  border: 2px solid white;
                  font-size: 18px;
                  transition: transform 0.2s ease, background-color 0.2s ease;
              }

              .element-scroller:hover .element-scroller__arrow.navigation-visible {
                  display: flex;
              }

              .element-scroller__arrow--left {
                  left: 15px;
              }

              .element-scroller__arrow--right {
                  right: 15px;
              }

              .element-scroller__arrow:hover {
                  background-color: var(--primary-dark, #2980b9);
                  transform: translateY(-50%) scale(1.1);
              }

              .element-scroller__arrow:active {
                  transform: translateY(-50%) scale(0.95);
              }

              @media (max-width: 768px) {
                  .element-scroller__arrow {
                      width: 35px;
                      height: 35px;
                  }
              }
          </style>
          <div class="element-scroller">
              <div class="element-scroller__container">
                  ${this.hasAttribute('title') ? `
                      <div class="element-scroller__title">
                          <span>${this.getAttribute('title')}</span>
                          ${this.collapsible ? 
                              `<span class="element-scroller__dropdown">&#9660;</span>` : 
                              ''}
                      </div>
                  ` : ''}
                  <div class="element-scroller__items-wrapper">
                      <slot name="items" class="element-scroller__items"></slot>
                  </div>
                  <div class="element-scroller__arrow element-scroller__arrow--left">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                  </div>
                  <div class="element-scroller__arrow element-scroller__arrow--right">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                  </div>
              </div>
          </div>
      `;
  }
}

customElements.define('element-scroller', ElementScroller);