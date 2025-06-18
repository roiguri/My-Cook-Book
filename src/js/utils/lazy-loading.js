// src/js/utils/lazy-loading.js
// Lazy loading utilities for images and components

/**
 * Image lazy loading using Intersection Observer API
 */
export class LazyImageLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, this.options);
    }
  }

  /**
   * Observe an image element for lazy loading
   * @param {HTMLImageElement} img - Image element to observe
   */
  observe(img) {
    if (this.observer && img) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  /**
   * Load image by setting src from data-src
   * @param {HTMLImageElement} img - Image element to load
   */
  loadImage(img) {
    if (img.dataset.src) {
      // Add loading state
      img.classList.add('loading');
      
      // Create a new image to preload
      const imageLoader = new Image();
      
      imageLoader.onload = () => {
        img.src = img.dataset.src;
        img.classList.remove('loading');
        img.classList.add('loaded');
        
        // Remove data-src attribute
        delete img.dataset.src;
      };
      
      imageLoader.onerror = () => {
        img.classList.remove('loading');
        img.classList.add('error');
        
        // Set fallback image if available
        if (img.dataset.fallback) {
          img.src = img.dataset.fallback;
        }
      };
      
      imageLoader.src = img.dataset.src;
    }
  }

  /**
   * Observe all images with data-src attribute in a container
   * @param {HTMLElement} container - Container element
   */
  observeAll(container = document) {
    const lazyImages = container.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => this.observe(img));
  }

  /**
   * Destroy the observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Global lazy image loader instance
export const lazyImageLoader = new LazyImageLoader();

/**
 * Initialize lazy loading for images in a container
 * @param {HTMLElement} container - Container element
 */
export function initLazyLoading(container = document) {
  lazyImageLoader.observeAll(container);
}

/**
 * Create a lazy loading image element
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {string} className - CSS class name
 * @param {string} fallback - Fallback image URL
 * @returns {HTMLImageElement}
 */
export function createLazyImage(src, alt = '', className = '', fallback = '/img/placeholder.jpg') {
  const img = document.createElement('img');
  img.dataset.src = src;
  img.dataset.fallback = fallback;
  img.alt = alt;
  img.className = className;
  
  // Set placeholder or loading state
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';
  
  // Initialize lazy loading for this image
  lazyImageLoader.observe(img);
  
  return img;
}

/**
 * Component lazy loading
 */
export class LazyComponentLoader {
  constructor() {
    this.loadedComponents = new Map(); // Changed from Set to Map to cache modules
  }

  /**
   * Lazy load a component module
   * @param {string} componentPath - Path to component module
   * @returns {Promise<Object>} Component module
   */
  async loadComponent(componentPath) {
    // Return cached module if already loaded
    if (this.loadedComponents.has(componentPath)) {
      return this.loadedComponents.get(componentPath);
    }

    try {
      const module = await import(componentPath);
      this.loadedComponents.set(componentPath, module); // Cache the module
      return module;
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error);
      throw error;
    }
  }

  /**
   * Preload a component (without initializing)
   * @param {string} componentPath - Path to component module
   */
  preloadComponent(componentPath) {
    if (!this.loadedComponents.has(componentPath)) {
      import(/* webpackPrefetch: true */ componentPath)
        .then((module) => {
          this.loadedComponents.set(componentPath, module); // Cache the module
        })
        .catch(error => {
          console.warn(`Failed to preload component: ${componentPath}`, error);
        });
    }
  }
}

// Global component loader instance
export const lazyComponentLoader = new LazyComponentLoader();