// SPA Main Entry Point
import './styles/main.css';

import { initFirebase } from './js/services/firebase-service.js';
import firebaseConfig from './js/config/firebase-config.js';

// Import SPA core
import { AppRouter } from './app/core/router.js';
import { PageManager } from './app/core/page-manager.js';

// Initialize SPA when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSPA);

async function initializeSPA() {
  try {
    console.log('🚀 Initializing SPA...');
    
    // Initialize Firebase first
    console.log('🔥 Initializing Firebase...');
    initFirebase(firebaseConfig);
    console.log('✅ Firebase initialized');
    
    // Import and initialize auth components after Firebase is ready
    console.log('🔐 Loading auth components...');
    await Promise.all([
      import('./lib/auth/auth-controller.js'),
      import('./lib/auth/components/auth-avatar.js'),
      import('./lib/auth/components/auth-content.js'),
      import('./lib/auth/components/login-form.js'),
      import('./lib/auth/components/signup-form.js'),
      import('./lib/auth/components/forgot-password.js'),
      import('./lib/auth/components/user-profile.js'),
    ]);
    console.log('✅ Auth components loaded');
    
    // Import search component and navigation
    console.log('🔍 Loading search and navigation components...');
    await Promise.all([
      import('./lib/search/header-search-bar/header-search-bar.js'),
      import('./js/navigation-script.js')
    ]);
    console.log('✅ Search and navigation components loaded');
    
    // Get content container
    const contentContainer = document.getElementById('spa-content');
    if (!contentContainer) {
      throw new Error('SPA content container not found');
    }

    // Initialize core services
    const router = new AppRouter();
    const pageManager = new PageManager(contentContainer);
    
    // Make router available globally for debugging
    window.spa = { router, pageManager };
    
    // Register temporary placeholder routes
    registerPlaceholderRoutes(router, pageManager);
    
    // Initialize router
    router.initialize();
    
    console.log('✅ SPA initialized successfully');
    console.log('Available routes:', router.getRoutes());
    
  } catch (error) {
    console.error('❌ Failed to initialize SPA:', error);
    showInitializationError(error);
  }
}

function registerPlaceholderRoutes(router, pageManager) {
  // Home route
  router.registerRoute('/home', async (params) => {
    await pageManager.loadPage('/src/app/pages/home-page.js', { ...params, route: '/home' });
  });

  // Categories route - full implementation
  router.registerRoute('/categories', async (params) => {
    await pageManager.loadPage('/src/app/pages/categories-page.js', { ...params, route: '/categories' });
  });

  // Propose recipe route placeholder
  router.registerRoute('/propose-recipe', async (params) => {
    await pageManager.loadPage({
      async render(params) {
        return `
          <div class="spa-propose-placeholder">
            <div style="text-align: center; padding: 2rem;">
              <h1>✏️ Propose Recipe</h1>
              <p>Propose recipe page placeholder - will be implemented in future phases</p>
              <p><a href="#/home">← Back to Home</a></p>
            </div>
          </div>
        `;
      },
      
      getTitle() {
        return 'Propose Recipe - Our Kitchen Chronicles';
      }
    }, { ...params, route: '/propose-recipe' });
  });
}

function showInitializationError(error) {
  const contentContainer = document.getElementById('spa-content');
  if (contentContainer) {
    contentContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #d32f2f;">
        <h2>❌ Application Failed to Load</h2>
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