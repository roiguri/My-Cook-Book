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
    if (this.isLoading) {
      console.warn('Page load already in progress, ignoring new request');
      return;
    }

    this.isLoading = true;

    try {
      let module;
      if (typeof pageModule === 'string') {
        module = await this.importPageModule(pageModule);
      } else {
        module = pageModule;
      }

      this.validatePageModule(module);

      const newPageRoute = params.route || 'unknown';
      const isSamePage = this.currentPage === newPageRoute && this.currentPageModule;

      if (isSamePage) {
        await this.callPageMethod('handleRouteChange', params);
      } else {
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
      const module = await import(/* webpackChunkName: "page-[request]" */ modulePath);
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

    if (typeof module.mount !== 'function') {
      console.warn('Page module missing mount() method - some functionality may not work');
    }

    if (typeof module.unmount !== 'function') {
      console.warn('Page module missing unmount() method - cleanup may not occur');
    }
  }

  async loadNewPage(module, params) {
    try {
      this.currentPageModule = module;
      this.currentPage = params.route || 'unknown';

      this.showLoadingState();


      const html = await this.callPageMethod('render', params);
      if (typeof html === 'string') {
        this.renderPageContent(html);
      }

      await this.updatePageMetadata(params);

      await this.callPageMethod('mount', this.contentContainer, params);

      this.hideLoadingState();
    } catch (error) {
      this.hideLoadingState();
      throw error;
    }
  }

  async unloadCurrentPage() {
    if (this.currentPageModule) {
      try {
        await this.callPageMethod('unmount');
      } catch (error) {
        console.error('Error unmounting current page:', error);
      }


      this.currentPageModule = null;
      this.currentPage = null;
    }

    this.clearLoadingTimeouts();

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

  async updatePageMetadata(params) {
    try {
      const title = await this.callPageMethod('getTitle', params);
      if (title) {
        this.updatePageTitle(title);
      }

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

    if (meta.description) {
      this.updateMetaTag('description', meta.description);
    }

    if (meta.keywords) {
      this.updateMetaTag('keywords', meta.keywords);
    }

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

    const errorDetails = this.contentContainer.querySelector('#error-details');
    const reloadButton = this.contentContainer.querySelector('#reload-button');

    errorDetails.textContent = error.message;
    reloadButton.addEventListener('click', () => {
      window.location.reload();
    });
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getCurrentPageModule() {
    return this.currentPageModule;
  }

  isPageLoading() {
    return this.isLoading;
  }


  destroy() {
    this.clearLoadingTimeouts();
    this.unloadCurrentPage();
    this.contentContainer = null;
  }
}

export function createPageManager(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error(`Container element not found: ${containerSelector}`);
  }
  return new PageManager(container);
}
