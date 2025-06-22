/**
 * Recipe Pagination Web Component
 * Pure UI component for pagination controls
 * 
 * Architecture: Separated HTML, CSS, and JS files
 * - recipe-pagination.html: HTML template
 * - recipe-pagination-styles.js: Component styles  
 * - recipe-pagination-config.js: Configuration constants
 * - recipe-pagination.js: Component logic (this file)
 *
 * @attributes
 * - current-page: Current page number (default: 1)
 * - total-pages: Total number of pages (default: 1)
 * - total-items: Total number of items (default: 0)
 * - prev-text: Text for previous button (optional)
 * - next-text: Text for next button (optional)
 *
 * @events
 * - page-changed: Emitted when page changes
 *   detail: { page: number, direction: 'prev'|'next' }
 *
 * @features
 * - Previous/Next navigation buttons
 * - Page information display with item count
 * - Disabled state for buttons when at boundaries
 * - RTL support for Hebrew text
 * - Responsive design for mobile
 * - Customizable button text
 */

import { CONFIG, ATTRIBUTES } from './recipe-pagination-config.js';
import { styles } from './recipe-pagination-styles.js';

class RecipePagination extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalItems = 0;
    this.prevText = CONFIG.DEFAULT_TEXT.prevButton;
    this.nextText = CONFIG.DEFAULT_TEXT.nextButton;
    
    // Bindings
    this.handlePrevClick = this.handlePrevClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
  }

  static get observedAttributes() {
    return [
      ATTRIBUTES.currentPage,
      ATTRIBUTES.totalPages,
      ATTRIBUTES.totalItems,
      ATTRIBUTES.prevText,
      ATTRIBUTES.nextText
    ];
  }

  async connectedCallback() {
    await this.render();
    this.setupEventListeners();
    this.updateUI();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case ATTRIBUTES.currentPage:
        this.currentPage = parseInt(newValue) || 1;
        if (this.shadowRoot.innerHTML) {
          this.updateUI();
        }
        break;
      case ATTRIBUTES.totalPages:
        this.totalPages = parseInt(newValue) || 1;
        if (this.shadowRoot.innerHTML) {
          this.updateUI();
        }
        break;
      case ATTRIBUTES.totalItems:
        this.totalItems = parseInt(newValue) || 0;
        if (this.shadowRoot.innerHTML) {
          this.updateUI();
        }
        break;
      case ATTRIBUTES.prevText:
        this.prevText = newValue || CONFIG.DEFAULT_TEXT.prevButton;
        if (this.shadowRoot.innerHTML) {
          this.updateButtonTexts();
        }
        break;
      case ATTRIBUTES.nextText:
        this.nextText = newValue || CONFIG.DEFAULT_TEXT.nextButton;
        if (this.shadowRoot.innerHTML) {
          this.updateButtonTexts();
        }
        break;
    }
  }

  async render() {
    try {
      // Load template
      const templateResponse = await fetch(new URL('./recipe-pagination.html', import.meta.url));
      if (!templateResponse.ok) {
        throw new Error(`Failed to load template: ${templateResponse.status}`);
      }
      const template = await templateResponse.text();

      // Create complete HTML with styles
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        ${template}
      `;

      // Setup initial content
      this.updateButtonTexts();
      this.updateUI();

    } catch (error) {
      console.error('Error rendering recipe pagination:', error);
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="recipe-pagination">
          <div class="error">Error loading pagination</div>
        </div>
      `;
    }
  }

  updateButtonTexts() {
    const prevButton = this.shadowRoot.querySelector('.prev-button');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    if (prevButton) {
      prevButton.textContent = this.prevText;
    }
    
    if (nextButton) {
      nextButton.textContent = this.nextText;
    }
  }

  updateUI() {
    this.updatePageInfo();
    this.updateButtonStates();
  }

  updatePageInfo() {
    const pageInfo = this.shadowRoot.querySelector('.page-info');
    if (!pageInfo) return;

    const text = CONFIG.DEFAULT_TEXT.pageInfo
      .replace('{current}', this.currentPage)
      .replace('{total}', this.totalPages)
      .replace('{totalItems}', this.totalItems);
    
    pageInfo.textContent = text;
  }

  updateButtonStates() {
    const prevButton = this.shadowRoot.querySelector('.prev-button');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    if (prevButton) {
      prevButton.disabled = this.currentPage <= 1;
    }
    
    if (nextButton) {
      nextButton.disabled = this.currentPage >= this.totalPages;
    }
  }

  setupEventListeners() {
    const prevButton = this.shadowRoot.querySelector('.prev-button');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    if (prevButton) {
      prevButton.addEventListener('click', this.handlePrevClick);
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', this.handleNextClick);
    }
  }

  removeEventListeners() {
    const prevButton = this.shadowRoot.querySelector('.prev-button');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    if (prevButton) {
      prevButton.removeEventListener('click', this.handlePrevClick);
    }
    
    if (nextButton) {
      nextButton.removeEventListener('click', this.handleNextClick);
    }
  }

  handlePrevClick(event) {
    event.preventDefault();
    
    if (this.currentPage <= 1) return;
    
    const newPage = this.currentPage - 1;
    this.emitPageChanged(newPage, 'prev');
  }

  handleNextClick(event) {
    event.preventDefault();
    
    if (this.currentPage >= this.totalPages) return;
    
    const newPage = this.currentPage + 1;
    this.emitPageChanged(newPage, 'next');
  }

  emitPageChanged(page, direction) {
    const oldPage = this.currentPage;
    
    // Update internal state
    this.currentPage = page;
    this.updateUI();

    // Emit event
    this.dispatchEvent(new CustomEvent(CONFIG.EVENTS.pageChanged, {
      detail: {
        page,
        previousPage: oldPage,
        direction,
        totalPages: this.totalPages,
        totalItems: this.totalItems
      },
      bubbles: true
    }));
  }

  // Public API methods
  getCurrentPage() {
    return this.currentPage;
  }

  setCurrentPage(page) {
    this.setAttribute(ATTRIBUTES.currentPage, page.toString());
  }

  getTotalPages() {
    return this.totalPages;
  }

  setTotalPages(pages) {
    this.setAttribute(ATTRIBUTES.totalPages, pages.toString());
  }

  getTotalItems() {
    return this.totalItems;
  }

  setTotalItems(items) {
    this.setAttribute(ATTRIBUTES.totalItems, items.toString());
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return false;
    }
    
    const direction = page > this.currentPage ? 'next' : 'prev';
    this.emitPageChanged(page, direction);
    return true;
  }
}

// Register the custom element
customElements.define(CONFIG.COMPONENT_TAG, RecipePagination);

export default RecipePagination;