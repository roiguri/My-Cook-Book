// SPA Main Entry Point
import './styles/main.css';

import { initFirebase } from './js/services/firebase-service.js';
import firebaseConfig from './js/config/firebase-config.js';

// Import SPA core
import { AppRouter } from './app/core/router.js';
import { PageManager } from './app/core/page-manager.js';

// Import all page modules statically
import homePage from './app/pages/home-page.js';
import categoriesPage from './app/pages/categories-page.js';
import recipeDetailPage from './app/pages/recipe-detail-page.js';
import proposeRecipePage from './app/pages/propose-recipe-page.js';
import documentsPage from './app/pages/documents-page.js';
import managerDashboardPage from './app/pages/manager-dashboard-page.js';

// Initialize SPA when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSPA);

async function initializeSPA() {
  try {
    initFirebase(firebaseConfig);

    await Promise.all([
      import('./lib/auth/auth-controller.js'),
      import('./lib/auth/components/auth-avatar.js'),
      import('./lib/auth/components/auth-content.js'),
      import('./lib/auth/components/login-form.js'),
      import('./lib/auth/components/signup-form.js'),
      import('./lib/auth/components/forgot-password.js'),
      import('./lib/auth/components/user-profile.js'),
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

function registerRoutes(router, pageManager) {
  router.registerRoute('/home', async (params) => {
    await pageManager.loadPage(homePage, { ...params, route: '/home' });
  });

  router.registerRoute('/categories', async (params) => {
    await pageManager.loadPage(categoriesPage, {
      ...params,
      route: '/categories',
    });
  });

  router.registerRoute('/recipe/:id', async (params) => {
    await pageManager.loadPage(recipeDetailPage, {
      ...params,
      route: '/recipe/:id',
    });
  });

  router.registerRoute('/propose-recipe', async (params) => {
    await pageManager.loadPage(proposeRecipePage, {
      ...params,
      route: '/propose-recipe',
    });
  });

  router.registerRoute('/grandmas-cooking', async (params) => {
    await pageManager.loadPage(documentsPage, {
      ...params,
      route: '/grandmas-cooking',
    });
  });

  router.registerRoute('/dashboard', async (params) => {
    await pageManager.loadPage(managerDashboardPage, {
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
