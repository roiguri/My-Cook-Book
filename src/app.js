/**
 * @fileoverview Main entry point for the My-Cook-Book Single Page Application (SPA).
 * This file handles the initialization of the application, including:
 * - Firebase service initialization
 * - Core dependency loading (Auth, Search, etc.)
 * - Router and PageManager setup
 * - Route registration with code splitting (dynamic imports)
 */

import './styles/main.css';

// Register Service Worker for PWA functionality
import './js/sw-register.js';

import { initFirebase } from './js/services/firebase-service.js';
import firebaseConfig from './js/config/firebase-config.js';

// Import SPA core
import { AppRouter } from './app/core/router.js';
import { PageManager } from './app/core/page-manager.js';

// Initialize SPA when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSPA);

/**
 * Initializes the SPA application when the DOM is ready.
 * Sets up Firebase, preloads essential components, and starts the router.
 */
async function initializeSPA() {
  try {
    initFirebase(firebaseConfig);

    // Preload critical components in parallel
    await Promise.all([
      import('./lib/auth/auth-controller.js'),
      import('./lib/auth/components/auth-avatar.js'),
      import('./lib/auth/components/auth-content.js'),
    ]);

    await Promise.all([
      import('./lib/search/header-search-bar/header-search-bar.js'),
      import('./js/navigation-script.js'),
    ]);

    const contentContainer = document.getElementById('spa-content');
    if (!contentContainer) {
      throw new Error('SPA content container not found');
    }

    const router = new AppRouter();
    const pageManager = new PageManager(contentContainer);

    window.spa = { router, pageManager };

    registerRoutes(router, pageManager);
    router.initialize();
  } catch (error) {
    console.error('Failed to initialize SPA:', error);
    showInitializationError(error);
  }
}

/**
 * Registers application routes and configures code splitting for pages.
 * Each route uses dynamic imports to lazily load the page module only when requested.
 *
 * @param {AppRouter} router - The application router instance
 * @param {PageManager} pageManager - The page manager instance for rendering pages
 */
function registerRoutes(router, pageManager) {
  router.registerRoute('/home', async (params) => {
    // Dynamic import ensures home-page chunk is loaded only when needed
    const module = await import('./app/pages/home-page.js');
    await pageManager.loadPage(module.default || module, {
      ...params,
      route: '/home',
    });
  });

  router.registerRoute('/categories', async (params) => {
    const module = await import('./app/pages/categories-page.js');
    await pageManager.loadPage(module.default || module, {
      ...params,
      route: '/categories',
    });
  });

  router.registerRoute('/recipe/:id', async (params) => {
    const module = await import('./app/pages/recipe-detail-page.js');
    await pageManager.loadPage(module.default || module, {
      ...params,
      route: '/recipe/:id',
    });
  });

  router.registerRoute('/propose-recipe', async (params) => {
    const module = await import('./app/pages/propose-recipe-page.js');
    await pageManager.loadPage(module.default || module, {
      ...params,
      route: '/propose-recipe',
    });
  });

  router.registerRoute('/grandmas-cooking', async (params) => {
    const module = await import('./app/pages/documents-page.js');
    await pageManager.loadPage(module.default || module, {
      ...params,
      route: '/grandmas-cooking',
    });
  });

  router.registerRoute('/dashboard', async (params) => {
    const module = await import('./app/pages/manager-dashboard-page.js');
    await pageManager.loadPage(module.default || module, {
      ...params,
      route: '/dashboard',
    });
  });
}

function showInitializationError(error) {
  const contentContainer = document.getElementById('spa-content');
  if (contentContainer) {
    contentContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #d32f2f;">
        <h2>Application Failed to Load</h2>
        <p>Sorry, there was an error initializing the application.</p>
        <details style="margin-top: 1rem; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
          <summary>Error Details</summary>
          <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">${error.message}</pre>
        </details>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Application
        </button>
      </div>
    `;
  }
}
