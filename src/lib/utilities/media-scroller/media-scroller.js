/**
 * @attribute {string} title - Sets the title of the media scroller. Default: "Media Scroller".
 * @attribute {number} visible-items - Sets the number of media items visible at a time. Default: 3.
 * @attribute {boolean} continuous - Enables continuous scrolling. Default: false.
 * @attribute {string} initial-state - Sets the initial state of the media scroller ("open" or "collapsed"). Default: "open".
 * @attribute {string} media-data - Provides the media data as a JSON string. Each item should have a 'path' and an optional 'caption'.
 *
 * @example
 * <media-scroller
 *   title="My Vacation Photos"
 *   visible-items="2"
 *   continuous="true"
 *   media-data='[{"path": "images/beach.jpg", "caption": "Beautiful beach"}, {"path": "images/mountain.jpg", "caption": "Hiking in the mountains"}]'>
 * </media-scroller>
 */

class MediaScroller extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Default values
    this.backgroundColor = 'var(--background-color)';
    this.visibleItems = 3;
    this.continuous = false;
    this.initialState = 'open'; // 'open' or 'collapsed'
    this.collapsible = false;

    // Initialize state
    this.currentIndex = 0;
    this.mediaItems = [];

    this.isCollapsed = this.initialState === 'collapsed';
  }

  static get observedAttributes() {
    return [
      'title',
      'visible-items',
      'continuous',
      'initial-state',
      'media-data',
      'item-height',
      'item-width',
      'collapsible',
      'background-color',
    ];
  }

  connectedCallback() {
    this.render();
    this.initScroller();
  }

  disconnectedCallback() {
    // Remove event listeners if needed
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
        case 'initial-state':
          this.initialState = newValue || 'open';
          this.isCollapsed = this.initialState === 'collapsed';
          if (this.isConnected) {
            this.updateCollapseState();
          }
          break;
        case 'media-data':
          this.mediaItems = JSON.parse(newValue);
          break;
        case 'item-height':
          this.itemHeight = newValue;
          break;
        case 'item-width':
          this.itemWidth = newValue;
          break;
        case 'collapsible':
          this.collapsible = newValue === 'true';
          break;
        case 'background-color':
          this.backgroundColor = newValue;
          break;
      }
      this.render();
      this.initScroller();
    }
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.updateCollapseState();
    this.updateNavigation();
  }

  updateCollapseState() {
    const container = this.shadowRoot.querySelector('.media-scroller__container');
    const dropdown = this.shadowRoot.querySelector('.media-scroller__dropdown');

    if (this.isCollapsed) {
      container.classList.add('collapsed');
      dropdown.innerHTML = '◀'; // Right arrow
    } else {
      container.classList.remove('collapsed');
      dropdown.innerHTML = '&#9660;'; // Down arrow
    }
  }

  initScroller() {
    this.scroller = this.shadowRoot.querySelector('.media-scroller__container');
    this.itemsContainer = this.shadowRoot.querySelector('.media-scroller__items');
    this.leftArrow = this.shadowRoot.querySelector('.media-scroller__arrow--left');
    this.rightArrow = this.shadowRoot.querySelector('.media-scroller__arrow--right');

    this.updateScrollerWidth();
    this.updateNavigation();

    this.leftArrow.addEventListener('click', () => this.scroll('left'));
    this.rightArrow.addEventListener('click', () => this.scroll('right'));

    // Add touch support for swipe
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

    // Only add dropdown handler if collapsible
    if (this.collapsible) {
      const dropdown = this.shadowRoot.querySelector('.media-scroller__dropdown');
      if (dropdown) {
        dropdown.addEventListener('click', () => this.toggleCollapse());
      }
      this.updateCollapseState();
    }
  }

  updateScrollerWidth() {
    const containerWidth = this.scroller.offsetWidth;
    const itemWidth = containerWidth / this.visibleItems;
    this.itemsContainer.style.width = `${this.mediaItems.length * itemWidth}px`;
    const items = this.shadowRoot.querySelectorAll('.media-scroller__item');
    items.forEach((item) => (item.style.width = `${itemWidth}px`));
  }

  scroll(direction) {
    const containerWidth = this.scroller.offsetWidth;
    const scrollAmount = containerWidth / this.visibleItems;
    if (direction === 'left') {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
    } else {
      this.currentIndex = this.continuous
        ? (this.currentIndex + 1) % this.mediaItems.length
        : Math.min(this.mediaItems.length - this.visibleItems, this.currentIndex + 1);
    }
    this.itemsContainer.style.transform = `translateX(-${this.currentIndex * scrollAmount}px)`;
    this.updateNavigation();
  }

  updateNavigation() {
    // If collapsed, don't show arrows regardless of scroll position
    if (this.isCollapsed) {
      this.leftArrow.classList.remove('navigation-visible');
      this.rightArrow.classList.remove('navigation-visible');
      return;
    }

    // Only update arrow visibility if not collapsed
    if (this.continuous || this.currentIndex > 0) {
      this.leftArrow.classList.add('navigation-visible');
    } else {
      this.leftArrow.classList.remove('navigation-visible');
    }

    if (this.continuous || this.currentIndex < this.mediaItems.length - this.visibleItems) {
      this.rightArrow.classList.add('navigation-visible');
    } else {
      this.rightArrow.classList.remove('navigation-visible');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .media-scroller {
          background-color: ${this.backgroundColor || 'var(--background-color)'};
          width: 100%;
          overflow: hidden;
          position: relative;
          border-radius: 10px;

        }

        .media-scroller__container {
          background-color: ${this.backgroundColor || 'var(--background-color)'};
          padding: 20px;
          transition: all 0.3s ease-in-out;
          overflow: hidden;
        }

        .media-scroller__container.collapsed {
          padding: 10px 20px;
        }

        .media-scroller__container.collapsed .media-scroller__items {
          height: 0;
          opacity: 0;
          margin: 0;
          padding: 0;
        }

        .media-scroller__container.collapsed .media-scroller__title {
          margin-bottom: 0;
        }

        .media-scroller__title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 1.2em;
          font-weight: bold;
        }

        .media-scroller__dropdown {
          cursor: pointer;
          transition: transform 0.3s ease;
          padding: 5px;
          user-select: none;
        }

        .media-scroller__dropdown:hover {
          opacity: 0.7;
        }

        .media-scroller__items {
          display: flex;
          transition: transform 0.3s ease-in-out;
          height: auto;
          opacity: 1;
          margin-top: 10px;
        }

        .media-scroller__item {
          margin: 10px; 
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box; 
          width: ${this.itemWidth || '200px'};
          height: ${this.itemHeight || '150px'};
        }

        .media-scroller__media {
          max-width: 100%;
          max-height: 90%;
          margin-bottom: 10px;
          border-radius: 10px;
          overflow: hidden;
          object-fit: cover;
        }

        .media-scroller__caption {
          margin-top: 5px;
          text-align: center;
          font-family: var(--body-font)
        }

        .media-scroller__arrow {
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

        .media-scroller__arrow:hover {
            background-color: var(--primary-dark, #2980b9);
            transform: translateY(-50%) scale(1.1);
        }

        .media-scroller__arrow:active {
            transform: translateY(-50%) scale(0.95);
        }

        .media-scroller:hover .media-scroller__arrow.navigation-visible {
          display: flex;  /* Show only navigation-visible arrows on hover */
        }

        .media-scroller__arrow--left {
          left: 15px;
        }

        .media-scroller__arrow--right {
          right: 15px;
        }

        .media-scroller__container.collapsed .media-scroller__arrow--left, 
        .media-scroller__container.collapsed .media-scroller__arrow--right{
          display: none;
        }
      </style>
      <div class="media-scroller">
        <div class="media-scroller__container">
          ${
            this.hasAttribute('title')
              ? `
                    <div class="media-scroller__title">
                        <span>${this.title}</span>
                        ${
                          this.collapsible
                            ? `<span class="media-scroller__dropdown">&#9660;</span>`
                            : ''
                        }
                    </div>
                `
              : ''
          }
          <div class="media-scroller__items">
            ${this.mediaItems
              .map(
                (item) => `
              <div class="media-scroller__item">
                ${
                  item.path.endsWith('.mp4')
                    ? `<video class="media-scroller__media" controls>
                        <source src="${item.path}" type="video/mp4">
                      </video>`
                    : `<img class="media-scroller__media" src="${item.path}" alt="${item.caption}">`
                }
                ${item.caption ? `<div class="media-scroller__caption">${item.caption}</div>` : ''}
              </div>
            `,
              )
              .join('')}
          </div>
              <div class="media-scroller__arrow media-scroller__arrow--left">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
              </div>
              <div class="media-scroller__arrow media-scroller__arrow--right">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
              </div>
          </div>
      </div>
    `;
  }
}

customElements.define('media-scroller', MediaScroller);
