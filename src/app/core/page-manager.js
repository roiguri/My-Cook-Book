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

      // Unload current page first
      await this.unloadCurrentPage();

      // Load new page
      await this.loadNewPage(module, params);

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
    Object.keys(meta).forEach(key => {
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
    this.loadingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.loadingTimeouts.clear();
  }

  async handlePageLoadError(error) {
    console.error('Page load error:', error);
    
    // Show error message to user
    this.contentContainer.innerHTML = `
      <div class="page-error" style="
        padding: 2rem;
        text-align: center;
        color: #d32f2f;
        background-color: #ffebee;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        margin: 1rem;
      ">
        <h2>Page Load Error</h2>
        <p>Sorry, there was an error loading this page.</p>
        <p style="font-size: 0.9em; color: #666; margin-top: 1rem;">
          ${error.message}
        </p>
        <button onclick="window.location.reload()" style="
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #d32f2f;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">
          Reload Page
        </button>
      </div>
    `;
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