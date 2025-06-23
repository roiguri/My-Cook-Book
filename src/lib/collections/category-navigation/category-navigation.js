/**
 * Category Navigation Web Component
 * Pure UI component for category selection with tabs and dropdown
 *
 * Architecture: Separated HTML, CSS, and JS files
 * - category-navigation.html: HTML template
 * - category-navigation-styles.js: Component styles
 * - category-navigation-config.js: Configuration constants
 * - category-navigation.js: Component logic (this file)
 *
 * @attributes
 * - current-category: Currently selected category (default: 'all')
 * - categories: JSON string of categories array (optional, uses defaults)
 * - mobile-breakpoint: Breakpoint for mobile layout (default: 768)
 *
 * @events
 * - category-changed: Emitted when category selection changes
 *   detail: { category: string, categoryData: object }
 *
 * @features
 * - Category tabs for desktop display
 * - Dropdown select for mobile display
 * - Responsive behavior based on breakpoint
 * - Active state management
 * - RTL support
 * - Keyboard navigation support
 */

import { CONFIG, ATTRIBUTES } from './category-navigation-config.js';
import { styles } from './category-navigation-styles.js';

// Template cache to avoid repeated fetches
let templateCache = null;

class CategoryNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State
    this.currentCategory = 'all';
    this.categories = CONFIG.DEFAULT_CATEGORIES;
    this.mobileBreakpoint = CONFIG.MOBILE_BREAKPOINT;

    // Bindings
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  static get observedAttributes() {
    return [ATTRIBUTES.currentCategory, ATTRIBUTES.categories, ATTRIBUTES.mobileBreakpoint];
  }

  async connectedCallback() {
    await this.render();
    this.setupEventListeners();
    this.updateActiveStates();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case ATTRIBUTES.currentCategory:
        this.currentCategory = newValue || 'all';
        if (this.shadowRoot.innerHTML) {
          this.updateActiveStates();
        }
        break;
      case ATTRIBUTES.categories:
        try {
          this.categories = newValue ? JSON.parse(newValue) : CONFIG.DEFAULT_CATEGORIES;
          if (this.shadowRoot.innerHTML) {
            this.render();
          }
        } catch (error) {
          console.warn('Invalid categories JSON, using defaults:', error);
          this.categories = CONFIG.DEFAULT_CATEGORIES;
        }
        break;
      case ATTRIBUTES.mobileBreakpoint:
        this.mobileBreakpoint = parseInt(newValue) || CONFIG.MOBILE_BREAKPOINT;
        break;
    }
  }

  async render() {
    try {
      // Load template (with caching)
      if (!templateCache) {
        const templateResponse = await fetch(new URL('./category-navigation.html', import.meta.url));
        if (!templateResponse.ok) {
          throw new Error(`Failed to load template: ${templateResponse.status}`);
        }
        templateCache = await templateResponse.text();
      }
      const template = templateCache;

      // Create complete HTML with styles
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        ${template}
      `;

      // Populate the component
      this.populateTabs();
      this.populateDropdown();
      this.updateActiveStates();

      // Re-setup event listeners since DOM was recreated
      this.removeEventListeners();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error rendering category navigation:', error);
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="category-navigation">
          <div class="error">Error loading category navigation</div>
        </div>
      `;
    }
  }

  populateTabs() {
    const tabsList = this.shadowRoot.querySelector('.category-tabs-list');
    if (!tabsList) return;

    tabsList.innerHTML = '';

    this.categories.forEach((category) => {
      const li = document.createElement('li');
      li.className = CONFIG.CSS_CLASSES.tabsItem;

      const button = document.createElement('button');
      button.className = CONFIG.CSS_CLASSES.tabsLink;
      button.textContent = category.label;
      button.dataset.category = category.value;
      button.type = 'button';

      li.appendChild(button);
      tabsList.appendChild(li);
    });
  }

  populateDropdown() {
    const select = this.shadowRoot.querySelector('.category-dropdown-select');
    if (!select) return;

    select.innerHTML = '';

    this.categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.value;
      option.textContent = category.label;
      select.appendChild(option);
    });
  }

  updateActiveStates() {
    // Update tabs active state
    const tabLinks = this.shadowRoot.querySelectorAll('.category-tabs-link');
    tabLinks.forEach((link) => {
      if (link.dataset.category === this.currentCategory) {
        link.classList.add(CONFIG.CSS_CLASSES.tabsLinkActive);
      } else {
        link.classList.remove(CONFIG.CSS_CLASSES.tabsLinkActive);
      }
    });

    // Update dropdown selected state
    const select = this.shadowRoot.querySelector('.category-dropdown-select');
    if (select) {
      select.value = this.currentCategory;
    }
  }

  setupEventListeners() {
    // Tab clicks
    const tabsList = this.shadowRoot.querySelector('.category-tabs-list');
    if (tabsList) {
      tabsList.addEventListener('click', this.handleTabClick);
    }

    // Dropdown change
    const select = this.shadowRoot.querySelector('.category-dropdown-select');
    if (select) {
      select.addEventListener('change', this.handleDropdownChange);
    }

    // Resize handling for responsive behavior
    window.addEventListener('resize', this.handleResize);
  }

  removeEventListeners() {
    const tabsList = this.shadowRoot.querySelector('.category-tabs-list');
    if (tabsList) {
      tabsList.removeEventListener('click', this.handleTabClick);
    }

    const select = this.shadowRoot.querySelector('.category-dropdown-select');
    if (select) {
      select.removeEventListener('change', this.handleDropdownChange);
    }

    window.removeEventListener('resize', this.handleResize);
  }

  handleTabClick(event) {
    const button = event.target.closest('.category-tabs-link');
    if (!button) return;

    event.preventDefault();

    const category = button.dataset.category;
    this.selectCategory(category);
  }

  handleDropdownChange(event) {
    const category = event.target.value;
    this.selectCategory(category);
  }

  handleResize() {
    // Handle any resize-specific logic if needed
    // Currently responsive behavior is handled by CSS media queries
  }

  selectCategory(category) {
    if (category === this.currentCategory) return;

    const oldCategory = this.currentCategory;
    this.currentCategory = category;

    // Update UI
    this.updateActiveStates();

    // Find category data
    const categoryData = this.categories.find((cat) => cat.value === category);

    // Emit event
    this.dispatchEvent(
      new CustomEvent(CONFIG.EVENTS.categoryChanged, {
        detail: {
          category,
          categoryData,
          previousCategory: oldCategory,
        },
        bubbles: true,
      }),
    );
  }

  // Public API methods
  getCurrentCategory() {
    return this.currentCategory;
  }

  setCurrentCategory(category) {
    this.setAttribute(ATTRIBUTES.currentCategory, category);
  }

  getCategories() {
    return this.categories;
  }

  setCategories(categories) {
    this.setAttribute(ATTRIBUTES.categories, JSON.stringify(categories));
  }
}

// Register the custom element
customElements.define(CONFIG.COMPONENT_TAG, CategoryNavigation);

export default CategoryNavigation;
