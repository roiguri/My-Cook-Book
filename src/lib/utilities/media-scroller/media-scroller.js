/**
 * MediaScroller - Simplified horizontal scroller for media instructions
 *
 * @attribute {string} media-data - JSON string of media items with {path, caption, type}
 * @attribute {string} item-width - Fixed width for each item (default: 280px)
 * @attribute {string} item-height - Height for each item (default: auto)
 *
 * @fires itemclick - Dispatched when a media item is clicked
 *
 * @example
 * <media-scroller
 *   item-width="280px"
 *   item-height="auto"
 *   media-data='[{"path": "url", "caption": "text", "type": "image"}]'>
 * </media-scroller>
 */

class MediaScroller extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Defaults
    this.mediaItems = [];
    this.itemWidth = '280px';
    this.itemHeight = 'auto';
  }

  static get observedAttributes() {
    return ['media-data', 'item-width', 'item-height'];
  }

  connectedCallback() {
    this.render();
    this.attachItemClickListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'media-data':
          try {
            this.mediaItems = JSON.parse(newValue) || [];
          } catch (e) {
            console.error('[MediaScroller] Invalid media-data JSON:', e);
            this.mediaItems = [];
          }
          break;
        case 'item-width':
          this.itemWidth = newValue || '280px';
          break;
        case 'item-height':
          this.itemHeight = newValue || 'auto';
          break;
      }
      if (this.isConnected) {
        this.render();
        this.attachItemClickListeners();
      }
    }
  }

  attachItemClickListeners() {
    const items = this.shadowRoot.querySelectorAll('.media-scroller__item');
    items.forEach((itemElement) => {
      itemElement.addEventListener('click', (e) => {
        const index = parseInt(itemElement.getAttribute('data-index'), 10);
        const item = this.mediaItems[index];
        this.dispatchEvent(
          new CustomEvent('itemclick', {
            detail: { index, item },
            bubbles: true,
            composed: true,
          }),
        );
      });
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .media-scroller {
          width: 100%;
          direction: rtl;
        }

        .media-scroller__items {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0;
          padding-bottom: 10px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Scrollbar styling */
        .media-scroller__items::-webkit-scrollbar {
          height: 8px;
        }

        .media-scroller__items::-webkit-scrollbar-track {
          background: var(--background-light, #f5f5f5);
          border-radius: 4px;
        }

        .media-scroller__items::-webkit-scrollbar-thumb {
          background: var(--primary-color, #3498db);
          border-radius: 4px;
        }

        .media-scroller__items::-webkit-scrollbar-thumb:hover {
          background: var(--primary-dark, #2980b9);
        }

        .media-scroller__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          box-sizing: border-box;
          width: 90%; /* Mobile: 90% of container width for full visibility with scrollbar */
          min-width: 250px; /* Ensure minimum readable size */
          min-height: ${this.itemHeight};
          flex-shrink: 0;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          padding: 15px;
          background-color: var(--background-light, #f9f9f9);
          transition: all 0.3s ease;
          position: relative;
          cursor: pointer;
        }

        /* Tablet and up: use fixed width */
        @media (min-width: 768px) {
          .media-scroller__item {
            width: ${this.itemWidth};
          }
        }

        .media-scroller__item:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .media-scroller__media {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 5px;
          margin-bottom: 10px;
          background-color: var(--background-light, #f5f5f5);
        }

        .media-type-badge {
          position: absolute;
          top: 25px;
          left: 25px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          z-index: 5;
        }

        .media-scroller__caption {
          margin-top: 5px;
          text-align: center;
          font-family: var(--body-font, Arial, sans-serif);
          font-size: 14px;
          direction: rtl;
          width: 100%;
          word-wrap: break-word;
        }
      </style>

      <div class="media-scroller">
        <div class="media-scroller__items">
          ${this.mediaItems
            .map((item, index) => {
              // Determine media type
              const isVideo = item.type === 'video' || (!item.type && item.path.endsWith('.mp4'));
              const mediaType = isVideo ? 'וידאו' : 'תמונה';

              return `
                <div class="media-scroller__item" data-index="${index}">
                  <span class="media-type-badge">${mediaType}</span>
                  ${
                    isVideo
                      ? `<video class="media-scroller__media" controls>
                          <source src="${item.path}" type="video/mp4">
                        </video>`
                      : `<img class="media-scroller__media" src="${item.path}" alt="${item.caption || ''}">`
                  }
                  ${item.caption ? `<div class="media-scroller__caption">${item.caption}</div>` : ''}
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('media-scroller', MediaScroller);
