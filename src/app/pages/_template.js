// SPA Page Module Template
// Copy this template when creating new SPA pages

export default {
  /**
   * Required: Renders the page HTML content
   * @param {Object} params - Route parameters and page data
   * @returns {Promise<string>} HTML content as string
   */
  async render(params) {
    // Option 1: Load from external HTML file
    try {
      // Resolve relative to this module so it works no matter where the SPA is mounted
      const response = await fetch(new URL('./[page-name].html', import.meta.url));
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading page template:', error);
      throw error;
    }

    // Option 2: Return inline HTML string
    // return `
    //   <div class="[page-name]">
    //     <h1>Page Title</h1>
    //     <p>Page content...</p>
    //   </div>
    // `;
  },

  /**
   * Optional: Initialize page functionality after HTML is rendered
   * @param {HTMLElement} container - The SPA content container
   * @param {Object} params - Route parameters and page data
   */
  async mount(container, params) {
    console.log('[Page Name]: mount() called with params:', params);

    try {
      // Import required components
      await this.importComponents();

      // Load page data
      await this.loadData(params);

      // Setup event listeners
      this.setupEventListeners();

      // Initialize any third-party libraries
      this.initializeLibraries();
    } catch (error) {
      console.error('Error mounting [page-name]:', error);
      throw error;
    }
  },

  /**
   * Optional: Cleanup when leaving the page
   */
  async unmount() {
    console.log('[Page Name]: unmount() called');

    try {
      // Remove event listeners
      this.removeEventListeners();

      // Cancel any pending requests
      this.cancelRequests();

      // Clear timers/intervals
      this.clearTimers();

      // Cleanup third-party libraries
      this.cleanupLibraries();
    } catch (error) {
      console.error('Error unmounting [page-name]:', error);
    }
  },

  /**
   * Optional: Return page title
   * @param {Object} params - Route parameters
   * @returns {string} Page title
   */
  getTitle(params) {
    return '[Page Title] - Our Kitchen Chronicles';
  },

  /**
   * Optional: Return page metadata
   * @param {Object} params - Route parameters
   * @returns {Object} Meta tags object
   */
  getMeta(params) {
    return {
      description: 'Page description for SEO',
      keywords: 'page, keywords, for, seo',
      // Add other meta tags as needed
    };
  },

  /**
   * Optional: Return dynamic style paths
   * @param {Object} params - Route parameters
   * @returns {Promise<string[]>} Array of CSS file paths
   */
  async getStylePaths(params) {
    return ['/src/styles/pages/[page-name]-spa.css'];
  },

  // Alternative: Static style path property
  // stylePath: '/src/styles/pages/[page-name]-spa.css',

  /**
   * Import required components
   */
  async importComponents() {
    try {
      await Promise.all([
        // Import page-specific components
        // import('../../lib/component-name/component-name.js'),
      ]);
    } catch (error) {
      console.error('Error importing components for [page-name]:', error);
    }
  },

  /**
   * Load page data
   */
  async loadData(params) {
    try {
      // Load data from services
      // const data = await SomeService.getData(params.id);
      // this.pageData = data;
    } catch (error) {
      console.error('Error loading data for [page-name]:', error);
      throw error;
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Example: Button click handlers
    // const button = document.querySelector('.some-button');
    // if (button) {
    //   button.addEventListener('click', this.handleButtonClick.bind(this));
    // }
  },

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    // Remove any event listeners to prevent memory leaks
    // const button = document.querySelector('.some-button');
    // if (button) {
    //   button.removeEventListener('click', this.handleButtonClick);
    // }
  },

  /**
   * Initialize third-party libraries
   */
  initializeLibraries() {
    // Initialize any third-party libraries or plugins
  },

  /**
   * Cleanup third-party libraries
   */
  cleanupLibraries() {
    // Cleanup any third-party libraries or plugins
  },

  /**
   * Cancel pending requests
   */
  cancelRequests() {
    // Cancel any pending fetch requests or subscriptions
    // if (this.abortController) {
    //   this.abortController.abort();
    // }
  },

  /**
   * Clear timers and intervals
   */
  clearTimers() {
    // Clear any timers or intervals
    // if (this.timer) {
    //   clearTimeout(this.timer);
    //   this.timer = null;
    // }
  },

  /**
   * Example event handler
   */
  handleButtonClick(event) {
    // Handle button click
    console.log('Button clicked:', event.target);
  },

  /**
   * Utility method for error handling
   */
  handleError(error, context = 'unknown') {
    console.error(`[Page Name] Error in ${context}:`, error);

    // Show user-friendly error message
    const errorContainer = document.querySelector('.error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <p>Sorry, something went wrong. Please try again.</p>
        </div>
      `;
    }
  },
};
