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
    this.title = 'Media Scroller';
    this.visibleItems = 3;
    this.continuous = false;
    this.initialState = 'open'; // 'open' or 'collapsed'

    // Initialize state
    this.currentIndex = 0;
    this.mediaItems = [];
  }

  static get observedAttributes() {
    return [
      'title',
      'visible-items',
      'continuous',
      'initial-state',
      'media-data',
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
          this.title = newValue;
          break;
        case 'visible-items':
          this.visibleItems = parseInt(newValue, 10) || 3;
          break;
        case 'continuous':
          this.continuous = newValue === 'true';
          break;
        case 'initial-state':
          this.initialState = newValue || 'open';
          break;
        case 'media-data':
          this.mediaItems = JSON.parse(newValue);
          break;
      }
      this.render();
      this.initScroller();
    }
  }

  initScroller() {
    this.scroller = this.shadowRoot.querySelector('.media-scroller__container');
    this.itemsContainer = this.shadowRoot.querySelector(
      '.media-scroller__items'
    );
    this.leftArrow = this.shadowRoot.querySelector('.media-scroller__arrow--left');
    this.rightArrow = this.shadowRoot.querySelector(
      '.media-scroller__arrow--right'
    );

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
  }

  updateScrollerWidth() {
    const containerWidth = this.scroller.offsetWidth;
    const itemWidth = containerWidth / this.visibleItems;
    this.itemsContainer.style.width = `${
      this.mediaItems.length * itemWidth
    }px`;
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
        : Math.min(
            this.mediaItems.length - this.visibleItems,
            this.currentIndex + 1
          );
    }
    this.itemsContainer.style.transform = `translateX(-${
      this.currentIndex * scrollAmount
    }px)`;
    this.updateNavigation();
  }

  updateNavigation() {
    if (this.continuous || this.currentIndex > 0) {
      this.leftArrow.style.display = 'block';
    } else {
      this.leftArrow.style.display = 'none';
    }
    if (
      this.continuous ||
      this.currentIndex < this.mediaItems.length - this.visibleItems
    ) {
      this.rightArrow.style.display = 'block';
    } else {
      this.rightArrow.style.display = 'none';
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .media-scroller {
          background-color: var(--background-color); /* Default background color */
          width: 100%;
          overflow: hidden;
          position: relative;
          border-radius: 10px;

        }

        .media-scroller__container {
          background-color: var(--background-color);
          padding: 20px;
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
        }

        .media-scroller__items {
          display: flex;
          transition: transform 0.3s ease-in-out;
        }

        .media-scroller__item {
          margin: 10px; 
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box; 
          width: 200px;
          height: 150px;
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
        }

        .media-scroller__arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 10px 15px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          display: none; /* Hidden by default */
          transform: translateY(-50%); 
          flex-shrink: 0;
        } 

        .media-scroller__arrow--left {
          left: 10px;
        }

        .media-scroller__arrow--right {
          right: 10px;
        }

        /* Responsiveness */
        @media (max-width: 1200px) {
          .media-scroller__item {
            flex: 0 0 calc(100% / 3);
          }
        }

        @media (max-width: 992px) {
          .media-scroller__item {
            flex: 0 0 calc(100% / 2);
          }
        }

        @media (max-width: 768px) {
          .media-scroller__item {
            flex: 0 0 100%;
          }
        }
      </style>
      <div class="media-scroller">
        <div class="media-scroller__container">
          <div class="media-scroller__title">
            <span>${this.title}</span>
            <span class="media-scroller__dropdown">&#9660;</span>
          </div>
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
                ${
                  item.caption
                    ? `<div class="media-scroller__caption">${item.caption}</div>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>
          <div class="media-scroller__arrow media-scroller__arrow--left">◀</div>
          <div class="media-scroller__arrow media-scroller__arrow--right">▶</div>
        </div>
      </div>
    `;
  }
}

customElements.define('media-scroller', MediaScroller);