class ElementScroller extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // Default values
      this.itemWidth = 200;
      this.gap = 20;
      this.bgColor = `var(--background-color)`;
      this.borderRadius = 10;

      // scrolling variables
      this.scrollableWidth = 0;
      this.currentIndex = 0;
      this.handleResize = this.handleResize.bind(this);

      // Create observer
      this.contentObserver = new MutationObserver(this.handleContentChanges.bind(this));
      this.isUpdating = false; // Flag to prevent recursive updates

      // Touch handling state
      this.touchState = {
        startX: 0,
        startY: 0,
        startTime: 0,
        currentX: 0,
        isDragging: false,
        currentTranslate: 0,
        prevTranslate: 0,
        animationID: null
    };

    // Bind touch handlers
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
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
    return [
      'padding',
      'item-width',
      'background-color',
      'border-radius',
      'title'
    ];
  }

  /**
  * Handle attribute changes
  * @param {string} name - Attribute name
  * @param {string} oldValue - Old value
  * @param {string} newValue - New value
  */
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'item-width':
        if (oldValue !== newValue) {
          this.itemWidth = parseInt(newValue, 10) || 200;
          this.applyItemStyles();
          this.calculateTotalWidth();
          this.isScrollNeeded();
        }
        break;
      case 'padding':
        if (oldValue !== newValue) {
          this.containerPadding = parseInt(newValue, 10) || 20;
          this.updatePadding();
          if (this.isConnected) {
            this.calculateTotalWidth();
            this.isScrollNeeded();
          }
        }
        break;
      case 'background-color':
        if (oldValue !== newValue) {
          this.bgColor = newValue;
          this.updateContainerStyles();
        }
        break;
      case 'border-radius':
        if (oldValue !== newValue) {
          this.borderRadius = newValue;
          this.updateBorderRadius();
        }
        break;
      case 'title':
        this.title = newValue || undefined;
        break;
      default:
        break;
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
      this.setupTouchEvents();
  }

  /**
  * Lifecycle method: Clean up event listeners
  */
  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    this.contentObserver.disconnect(); // Cleanup observer
    this.removeTouchEvents();
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
    const gap = 20; // Gap between items
    const totalItemsWidth = (this.itemWidth * itemCount) + (gap * (itemCount - 1));
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
    element.style.gap = `${this.gap}px`;

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
   * handle touch events
   */
  setupTouchEvents() {
    const container = this.shadowRoot.querySelector('.items-wrapper');
    if (!container) return;

    // Add touch event listeners
    container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    container.addEventListener('touchend', this.handleTouchEnd);
    
    // Add mouse event listeners for desktop dragging
    container.addEventListener('mousedown', this.handleTouchStart);
    window.addEventListener('mousemove', this.handleTouchMove);
    window.addEventListener('mouseup', this.handleTouchEnd);
  }

  removeTouchEvents() {
      const container = this.shadowRoot.querySelector('.items-wrapper');
      if (!container) return;

      container.removeEventListener('touchstart', this.handleTouchStart);
      container.removeEventListener('touchmove', this.handleTouchMove);
      container.removeEventListener('touchend', this.handleTouchEnd);
      
      container.removeEventListener('mousedown', this.handleTouchStart);
      window.removeEventListener('mousemove', this.handleTouchMove);
      window.removeEventListener('mouseup', this.handleTouchEnd);
  }

  handleTouchStart(e) {
      if (e.type === 'mousedown') {
          e.preventDefault(); // Prevent text selection during drag
      }
      
      const point = e.touches ? e.touches[0] : e;
      
      this.touchState = {
          ...this.touchState,
          startX: point.clientX,
          startY: point.clientY,
          startTime: Date.now(),
          isDragging: true,
          currentTranslate: this.touchState.prevTranslate
      };

      // Stop any ongoing animation
      if (this.touchState.animationID) {
          cancelAnimationFrame(this.touchState.animationID);
      }

      // Get the current container position
      const container = this.shadowRoot.querySelector('slot').assignedElements()[0];
      if (container) {
          const transform = window.getComputedStyle(container).transform;
          if (transform !== 'none') {
              this.touchState.prevTranslate = parseFloat(transform.split(',')[4]) || 0;
          }
      }
  }

  handleTouchMove(e) {
      if (!this.touchState.isDragging) return;
      e.preventDefault(); // Prevent scrolling while dragging
      
      const point = e.touches ? e.touches[0] : e;
      const currentX = point.clientX;
      const currentY = point.clientY;
      
      // Calculate distance moved
      const deltaX = currentX - this.touchState.startX;
      
      // Update current position
      this.touchState.currentTranslate = this.touchState.prevTranslate + deltaX;
      
      // Apply constraints
      const maxTranslate = this.calculateMaxTranslate();
      this.touchState.currentTranslate = Math.max(
          -maxTranslate,
          Math.min(0, this.touchState.currentTranslate)
      );
      
      // Apply the transform
      this.applyTransform(this.touchState.currentTranslate);

      // Update currentIndex in parallel
      const itemWidth = this.itemWidth + this.gap;
      const newIndex = Math.round(Math.abs(this.touchState.currentTranslate) / itemWidth);
      if (this.currentIndex !== newIndex) {
          this.currentIndex = this.validateScroll(newIndex);
          this.updateArrowVisibility();
      }
  }

  handleTouchEnd() {
    if (!this.touchState.isDragging) return;
    
    const movedDistance = this.touchState.currentTranslate - this.touchState.prevTranslate;
    const timeTaken = Date.now() - this.touchState.startTime;
    
    // Calculate velocity for momentum scrolling
    const velocity = movedDistance / timeTaken;
    
    // Get current item index from touch position
    const itemWidth = this.itemWidth + this.gap;
    const currentPosition = Math.abs(this.touchState.currentTranslate);
    let targetIndex = Math.round(currentPosition / itemWidth);
    
    // Determine if this was a swipe
    if (Math.abs(velocity) > 0.5) {
        const itemsToScroll = Math.min(
            Math.ceil(Math.abs(velocity) * 2),
            this.getVisibleItems()
        );
        
        if (velocity < 0) {
            targetIndex += itemsToScroll;
        } else {
            targetIndex -= itemsToScroll;
        }
    }
    
    // Reset touch state
    this.touchState.isDragging = false;
    
    // Use the arrow-based scrolling system to finish the movement
    this.scrollToIndex(targetIndex);
  }

  snapToNearestItem() {
      const itemWidth = this.currentItemWidth + this.gap;
      const currentOffset = this.touchState.currentTranslate;
      
      // Calculate nearest item index
      const nearestIndex = Math.round(Math.abs(currentOffset) / itemWidth);
      
      // Calculate target position
      const targetPosition = -nearestIndex * itemWidth;
      
      // Animate to target position
      this.animateToPosition(targetPosition);
  }

  animateToPosition(targetPosition) {
    const startPosition = this.touchState.currentTranslate;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
    const duration = 300;

    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentPosition = startPosition + (distance * easeOut);
        this.applyTransform(currentPosition);
        
        // Update index based on current position
        const itemWidth = this.itemWidth + this.gap;
        const newIndex = Math.round(Math.abs(currentPosition) / itemWidth);
        if (this.currentIndex !== newIndex) {
            this.currentIndex = this.validateScroll(newIndex);
            this.updateArrowVisibility();
        }
        
        if (progress < 1) {
            this.touchState.animationID = requestAnimationFrame(animate);
        } else {
            this.touchState.prevTranslate = targetPosition;
            this.touchState.currentTranslate = targetPosition;
            this.updateArrowVisibility();
        }
    };

    this.touchState.animationID = requestAnimationFrame(animate);
}

  applyTransform(x) {
      const container = this.shadowRoot.querySelector('slot').assignedElements()[0];
      if (container) {
          container.style.transform = `translateX(${x}px)`;
          container.style.transition = 'none'; // Remove transition during touch/drag
      }
  }

  calculateMaxTranslate() {
      const container = this.shadowRoot.querySelector('slot').assignedElements()[0];
      if (!container) return 0;
      
      const containerWidth = this.calculateVisibleWidth();
      const totalWidth = this.calculateTotalWidth();
      
      return Math.max(0, totalWidth - containerWidth);
  }

  /**
  * Update arrow visibility based on scroll position
  */
  updateArrowVisibility() {
    console.log('updateArrowVisibility');
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
            child.style.width = '${this.itemWidth}px';
            child.style.flexShrink = '0';
        });
        this.updateScroll(); // Apply scroll position
    }
  }

  /**
  * Update styles with new padding
  */
  updatePadding() {
    const wrapper = this.shadowRoot.querySelector('.items-wrapper');
    if (wrapper) {
      wrapper.style.padding = `${this.containerPadding}px`;
    }
  }

  /**
  * Update container background color
  */
  updateContainerStyles() {
    const container = this.shadowRoot.querySelector('.scroller-container');
    if (container) {
      container.style.backgroundColor = this.bgColor || 'var(--background-color)';
    }
  }

  /**
  * Update container border radius
  */
  updateBorderRadius() {
    const container = this.shadowRoot.querySelector('.scroller-container');
    if (container) {
      container.style.borderRadius = `${this.borderRadius}px` || '10px';
    }
  }

  render() {
      this.shadowRoot.innerHTML = `
          <style>
              .scroller-container {
                  width: 100%;
                  overflow: hidden;
                  position: relative;
                  background-color: ${this.bgColor};
                  border-radius: ${this.borderRadius}px;
              }

              .element-scroller__title {
                  display: flex;
                  justify-content: center;
                  margin: 10px auto;
                  font-size: var(--size-header2, 1.2rem);
                  font-weight: bold;
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
              ${this.hasAttribute('title') ? `
                  <div class="element-scroller__title">
                      <span>${this.getAttribute('title')}</span>
                  </div>
              ` : ''}
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

customElements.define('element-scroller', ElementScroller);