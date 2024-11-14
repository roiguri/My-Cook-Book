class HorizontalScroller extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // scrolling variables
      this.scrollableWidth = 0;
      this.currentIndex = 0;
      this.itemWidth = 200;
      this.gap = 20;
      this.handleResize = this.handleResize.bind(this);

      // Create observer
      this.contentObserver = new MutationObserver(this.handleContentChanges.bind(this));
      this.isUpdating = false; // Flag to prevent recursive updates
  }

  /**
  * Setup content observer for dynamic changes
  */
  setupContentObserver() {
    const slot = this.shadowRoot.querySelector('slot');
    const element = slot.assignedElements()[0];
    if (!element) return;

    this.contentObserver.observe(element, {
        childList: true,    // Track only added/removed children
        subtree: false,     // Don't watch descendants
        attributes: false   // Don't watch attributes
    });
  }

  /**
   * Handle content changes from MutationObserver
   * @param {MutationRecord[]} mutations - Array of mutation records
   */
  handleContentChanges(mutations) {
    if (this.isUpdating) return;
    
    try {
        this.isUpdating = true;
        
        // Apply styles first
        this.applyItemStyles();
        
        // Then recalculate everything
        this.calculateVisibleWidth();
        this.calculateTotalWidth();
        
        const maxScroll = this.getMaxScroll();
        if (this.currentIndex > maxScroll) {
            this.currentIndex = maxScroll;
        }
        
        this.updateLayout();
        this.updateArrowVisibility();
    } finally {
        this.isUpdating = false;
    }
  }

  static get observedAttributes() {
    return ['padding'];
  }

  /**
  * Handle attribute changes
  * @param {string} name - Attribute name
  * @param {string} oldValue - Old value
  * @param {string} newValue - New value
  */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'padding' && oldValue !== newValue) {
        this.containerPadding = parseInt(newValue, 10) || 20;
        this.updateStyles();
        if (this.isConnected) {
            this.calculateTotalWidth();
            this.isScrollNeeded();
        }
    }
  }

  /**
  * Lifecycle method: Setup event listeners and initial calculations
  */
  connectedCallback() {
      this.render();
      this.setupSlotted();

      this.setupArrowHandlers();
      this.calculateVisibleWidth();
      window.addEventListener('resize', this.handleResize);
      this.updateArrowVisibility();
      this.setupContentObserver(); // Add observer setup
  }

  /**
  * Lifecycle method: Clean up event listeners
  */
  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    this.contentObserver.disconnect(); // Cleanup observer
  }

  /**
  * Handle window resize event
  */
  handleResize() {
    this.calculateVisibleWidth();
    this.isScrollNeeded();

    // Recalculate current index based on new visible items
    const maxScroll = this.getMaxScroll();
    if (this.currentIndex > maxScroll) {
        this.currentIndex = maxScroll;
        this.updateScroll();
    }

    this.updateLayout();
    this.updateArrowVisibility();
  }

  /**
  * Calculate the visible width of the container
  * @returns {number} Width in pixels
  */
  calculateVisibleWidth() {
    const container = this.shadowRoot.querySelector('.scroller-container');
    return container?.offsetWidth || 0;
  }

  /**
  * Calculate total width of all items including gaps
  * @returns {number} Total width in pixels
  */
  calculateTotalWidth() {
    const slot = this.shadowRoot.querySelector('slot');
    const element = slot.assignedElements()[0];
    if (!element) return 0;
      
    const itemCount = element.children.length;
    const itemWidth = 200; // Fixed item width
    const gap = 20; // Gap between items
    const totalItemsWidth = (itemWidth * itemCount) + (gap * (itemCount - 1));
    const paddingWidth = this.containerPadding * 2;
      
    return totalItemsWidth + paddingWidth;
  }

  /**
  * Determine if scrolling is needed
  * @returns {boolean} True if content exceeds container width
  */
  isScrollNeeded() {
    const visibleWidth = this.calculateVisibleWidth();
    const totalWidth = this.calculateTotalWidth();
    return totalWidth > visibleWidth;
  }

  /**
  * Setup slotted content and apply styles
  */
  setupSlotted() {
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      this.applyItemStyles();
      this.calculateVisibleWidth();
      this.isScrollNeeded();
      this.updateLayout();
      this.updateArrowVisibility();
    });
  }

  /**
  * Apply styles to items regardless of count
  */
  applyItemStyles() {
    const slot = this.shadowRoot.querySelector('slot');
    const element = slot.assignedElements()[0];
    if (!element) return;

    // Always set container styles
    element.style.display = 'flex';
    element.style.gap = '20px';

    // Ensure styles are applied to each child
    Array.from(element.children).forEach(child => {
        child.style.width = `${this.itemWidth}px`;
        child.style.flexShrink = '0';
    });
  }

  /**
     * Get current scroll index
     * @returns {number} Current item index
     */
  getCurrentIndex() {
    return this.currentIndex;
  }

  getVisibleItems() {
    const containerWidth = this.calculateVisibleWidth();
    const padding = this.containerPadding || 20;
    const effectiveWidth = containerWidth - (padding * 2);
    return Math.floor((effectiveWidth + this.gap) / (this.itemWidth + this.gap));
  }

  /**
   * Get maximum possible scroll index
   * @returns {number} Maximum scroll index
   */
  getMaxScroll() {
    const slot = this.shadowRoot.querySelector('slot');
    const element = slot.assignedElements()[0];
    if (!element) return 0;
    
    const totalItems = element.children.length;
    const visibleItems = this.getVisibleItems();
    return Math.max(0, totalItems - visibleItems);
  }

  /**
   * Validate scroll index is within bounds
   * @param {number} index - Index to validate
   * @returns {number} Valid index within bounds
   */
  validateScroll(index) {
      return Math.min(Math.max(0, index), this.getMaxScroll());
  }

  /**
  * Setup arrow click handlers
  */
  setupArrowHandlers() {
    const leftArrow = this.shadowRoot.querySelector('.scroller-arrow--left');
    const rightArrow = this.shadowRoot.querySelector('.scroller-arrow--right');
    
    leftArrow.addEventListener('click', () => this.scrollLeft());
    rightArrow.addEventListener('click', () => this.scrollRight());
  }

  /**
  * Scroll to specific index
  * @param {number} index - Target index
  */
  scrollToIndex(index) {
    const validIndex = this.validateScroll(index);
    if (validIndex !== this.currentIndex) {
        this.currentIndex = validIndex;
        this.updateScroll();
        this.updateArrowVisibility();
    }
  }

  /**
   * Scroll one position left
   */
  scrollLeft() {
      this.scrollToIndex(this.currentIndex - 1);
  }

  /**
   * Scroll one position right
   */
  scrollRight() {
      this.scrollToIndex(this.currentIndex + 1);
  }

  /**
   * Update scroll position
   */
  updateScroll() {
    const itemsContainer = this.shadowRoot.querySelector('slot').assignedElements()[0];
    if (!itemsContainer) return;

    const totalWidth = this.calculateTotalWidth();
    const visibleWidth = this.calculateVisibleWidth();
    const maxScrollDistance = totalWidth - visibleWidth;
    const standardScrollAmount = this.itemWidth + this.gap;

    let scrollAmount;
    if (this.currentIndex === this.getMaxScroll()) {
        // Last position - adjust to show last item fully
        scrollAmount = maxScrollDistance;
    } else if (this.currentIndex === 0) {
        // First position - show from start
        scrollAmount = 0;
    } else {
        // Fixed scroll amount for middle positions
        scrollAmount = this.currentIndex * standardScrollAmount;
    }
    
    itemsContainer.style.transform = `translateX(-${scrollAmount}px)`;
    itemsContainer.style.transition = 'transform 0.3s ease';
  }

  /**
  * Update arrow visibility based on scroll position
  */
  updateArrowVisibility() {
    const leftArrow = this.shadowRoot.querySelector('.scroller-arrow--left');
    const rightArrow = this.shadowRoot.querySelector('.scroller-arrow--right');
    
    if (this.isScrollNeeded()) {
        leftArrow.classList.toggle('visible', this.currentIndex > 0);
        rightArrow.classList.toggle('visible', this.currentIndex < this.getMaxScroll());
    } else {
        leftArrow.classList.remove('visible');
        rightArrow.classList.remove('visible');
    }
  }

  /**
   * Change style for centered layout when scrolling is not needed
   */
  updateLayout() {
    const itemsContainer = this.shadowRoot.querySelector('slot').assignedElements()[0];
    if (!itemsContainer) return;

    if (!this.isScrollNeeded()) {
        // Apply centered layout
        itemsContainer.style.display = 'flex';
        itemsContainer.style.justifyContent = 'center';
        itemsContainer.style.transform = '';
    } else {
        // Reapply original scroll layout
        itemsContainer.style = ''; // Clear all styles
        itemsContainer.style.display = 'flex';
        itemsContainer.style.gap = '20px';
        Array.from(itemsContainer.children).forEach(child => {
            child.style.width = '200px';
            child.style.flexShrink = '0';
        });
        this.updateScroll(); // Apply scroll position
    }
  }

  /**
  * Update styles with new padding
  */
  updateStyles() {
    const wrapper = this.shadowRoot.querySelector('.items-wrapper');
    if (wrapper) {
      wrapper.style.padding = `${this.containerPadding}px`;
    }
  }

  render() {
      this.shadowRoot.innerHTML = `
          <style>
              .scroller-container {
                  width: 100%;
                  overflow: hidden;
                  position: relative;
              }

              .items-wrapper {
                  padding: ${this.getAttribute('padding') || 20}px;
              }

              .scroller-arrow {
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

              .scroller-container:hover .scroller-arrow.visible {
                  display: flex;
              }

              .scroller-arrow--left {
                  left: 15px;
              }

              .scroller-arrow--right {
                  right: 15px;
              }

              .scroller-arrow:hover {
                  background-color: var(--primary-dark, #2980b9);
                  transform: translateY(-50%) scale(1.1);
              }

              .scroller-arrow:active {
                  transform: translateY(-50%) scale(0.95);
              }
          </style>

          <div class="scroller-container">
              <div class="items-wrapper">
                  <slot name="items"></slot>
              </div>

              <div class="scroller-arrow scroller-arrow--left">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
              </div>
              <div class="scroller-arrow scroller-arrow--right">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
              </div>
          </div>
      `;
  }
}

customElements.define('horizontal-scroller', HorizontalScroller);