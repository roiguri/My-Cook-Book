export class PageManager {
  constructor(contentContainer) {
    if (!contentContainer) {
      throw new Error('Content container element is required');
    }

    this.contentContainer = contentContainer;
    this.currentPage = null;
    this.currentPageModule = null;
    this.isLoading = false;
    this.loadingTimeouts = new Set();
    this.loadedStyles = new Map(); // Track dynamically loaded styles
  }

  async loadPage(pageModule, params = {}) {
    // Prevent concurrent page loads
    if (this.isLoading) {
      console.warn('Page load already in progress, ignoring new request');
      return;
    }

    this.isLoading = true;

    try {
      // If pageModule is a string, import it dynamically
      let module;
      if (typeof pageModule === 'string') {
        module = await this.importPageModule(pageModule);
      } else {
        module = pageModule;
      }

      // Validate page module interface
      this.validatePageModule(module);

      // Check if this is the same page with different parameters
      const newPageRoute = params.route || 'unknown';
      const isSamePage = this.currentPage === newPageRoute && this.currentPageModule;

      if (isSamePage) {
        // Same page, different parameters - call handleRouteChange if available
        await this.callPageMethod('handleRouteChange', params);
      } else {
        // Different page - unload current and load new
        await this.unloadCurrentPage();
        await this.loadNewPage(module, params);
      }
    } catch (error) {
      console.error('Error loading page:', error);
      await this.handlePageLoadError(error);
    } finally {
      this.isLoading = false;
    }
  }

  async importPageModule(modulePath) {
    try {
      const module = await import(modulePath);
      return module.default || module;
    } catch (error) {
      throw new Error(`Failed to import page module: ${modulePath}. ${error.message}`);
    }
  }

  validatePageModule(module) {
    if (!module || typeof module !== 'object') {
      throw new Error('Page module must be an object');
    }

    if (typeof module.render !== 'function') {
      throw new Error('Page module must have a render() function');
    }

    // Optional methods - log warnings if missing
    if (typeof module.mount !== 'function') {
      console.warn('Page module missing mount() method - some functionality may not work');
    }

    if (typeof module.unmount !== 'function') {
      console.warn('Page module missing unmount() method - cleanup may not occur');
    }
  }

  async loadNewPage(module, params) {
    try {
      // Store references
      this.currentPageModule = module;
      this.currentPage = params.route || 'unknown';

      // Show loading state
      this.showLoadingState();

      // Load page-specific styles if defined
      await this.loadPageStyles(module, params);

      // Render page content
      const html = await this.callPageMethod('render', params);
      if (typeof html === 'string') {
        this.renderPageContent(html);
      }

      // Update page metadata
      await this.updatePageMetadata(module, params);

      // Mount page (initialize JavaScript functionality)
      await this.callPageMethod('mount', this.contentContainer, params);

      // Hide loading state
      this.hideLoadingState();
    } catch (error) {
      this.hideLoadingState();
      throw error;
    }
  }

  async unloadCurrentPage() {
    if (this.currentPageModule) {
      try {
        // Call unmount if available
        await this.callPageMethod('unmount');
      } catch (error) {
        console.error('Error unmounting current page:', error);
      }

      // Unload page-specific styles
      await this.unloadPageStyles();

      // Clear references
      this.currentPageModule = null;
      this.currentPage = null;
    }

    // Clear any loading timeouts
    this.clearLoadingTimeouts();

    // Clear content container
    this.clearContainer();
  }

  renderPageContent(html) {
    if (!html || typeof html !== 'string') {
      throw new Error('Page content must be a non-empty string');
    }

    this.contentContainer.innerHTML = html;
  }

  async callPageMethod(methodName, ...args) {
    if (!this.currentPageModule) return null;

    const method = this.currentPageModule[methodName];
    if (typeof method === 'function') {
      try {
        return await method.call(this.currentPageModule, ...args);
      } catch (error) {
        console.error(`Error calling page method ${methodName}:`, error);
        throw error;
      }
    }

    return null;
  }

  async updatePageMetadata(module, params) {
    try {
      // Update page title
      const title = await this.callPageMethod('getTitle', params);
      if (title) {
        this.updatePageTitle(title);
      }

      // Update meta tags
      const meta = await this.callPageMethod('getMeta', params);
      if (meta) {
        this.updatePageMeta(meta);
      }
    } catch (error) {
      console.error('Error updating page metadata:', error);
    }
  }

  updatePageTitle(title) {
    if (title && typeof title === 'string') {
      document.title = title;
    }
  }

  updatePageMeta(meta) {
    if (!meta || typeof meta !== 'object') return;

    // Update description
    if (meta.description) {
      this.updateMetaTag('description', meta.description);
    }

    // Update keywords
    if (meta.keywords) {
      this.updateMetaTag('keywords', meta.keywords);
    }

    // Update other meta tags
    Object.keys(meta).forEach((key) => {
      if (key !== 'description' && key !== 'keywords') {
        this.updateMetaTag(key, meta[key]);
      }
    });
  }

  updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }

    meta.content = content;
  }

  showLoadingState() {
    // Simple loading indicator
    this.contentContainer.innerHTML = `
      <div class="page-loading" style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        font-size: 1.1em;
        color: #666;
      ">
        <div>Loading...</div>
      </div>
    `;
  }

  hideLoadingState() {
    const loadingElement = this.contentContainer.querySelector('.page-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  clearContainer() {
    this.contentContainer.innerHTML = '';
  }

  clearLoadingTimeouts() {
    this.loadingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.loadingTimeouts.clear();
  }

  async handlePageLoadError(error) {
    console.error('Page load error:', error);

    // Show error message to user
    this.contentContainer.innerHTML = `
      <div class="page-error">
        <div class="error-card">
          <h2>Page Load Error</h2>
          <p>Sorry, there was an error loading this page.</p>
          <div class="error-details" id="error-details"></div>
          <button class="reload-button" id="reload-button">
            Reload Page
          </button>
        </div>
      </div>
    `;

    // Safely set error message and attach event listener
    const errorDetails = this.contentContainer.querySelector('#error-details');
    const reloadButton = this.contentContainer.querySelector('#reload-button');

    errorDetails.textContent = error.message;
    reloadButton.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Utility methods
  getCurrentPage() {
    return this.currentPage;
  }

  getCurrentPageModule() {
    return this.currentPageModule;
  }

  isPageLoading() {
    return this.isLoading;
  }

  // Dynamic style loading methods
  async loadPageStyles(module, params) {
    try {
      // Check if module defines custom styles
      let stylePaths = [];

      // Option 1: Module defines getStylePaths method
      if (typeof module.getStylePaths === 'function') {
        const paths = await module.getStylePaths(params);
        if (Array.isArray(paths)) {
          stylePaths = paths;
        }
      }

      // Option 2: Module defines stylePath property
      if (module.stylePath && typeof module.stylePath === 'string') {
        stylePaths.push(module.stylePath);
      }

      // Load each style file
      for (const stylePath of stylePaths) {
        await this.loadStyleSheet(stylePath);
      }
    } catch (error) {
      console.warn('Error loading page styles:', error);
      // Don't fail page load for style errors
    }
  }

  async loadStyleSheet(stylePath) {
    // Check if already loaded
    if (this.loadedStyles.has(stylePath)) {
      return this.loadedStyles.get(stylePath);
    }

    return new Promise((resolve, reject) => {
      // Create link element
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = stylePath;
      link.dataset.pageStyle = 'true'; // Mark as page-specific style

      // Handle load/error events
      link.onload = () => {
        this.loadedStyles.set(stylePath, link);
        resolve(link);
      };

      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${stylePath}`));
      };

      // Add to document head
      document.head.appendChild(link);

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (!this.loadedStyles.has(stylePath)) {
          reject(new Error(`Stylesheet load timeout: ${stylePath}`));
        }
      }, 5000);
    });
  }

  async unloadPageStyles() {
    // Remove all dynamically loaded page styles
    const pageStyleLinks = document.querySelectorAll('link[data-page-style="true"]');
    pageStyleLinks.forEach((link) => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });

    // Clear loaded styles map
    this.loadedStyles.clear();
  }

  // Cleanup method
  destroy() {
    this.clearLoadingTimeouts();
    this.unloadCurrentPage();
    this.contentContainer = null;
  }
}

// Helper function to create page manager instance
export function createPageManager(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error(`Container element not found: ${containerSelector}`);
  }
  return new PageManager(container);
}
