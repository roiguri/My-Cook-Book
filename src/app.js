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
    
    // Import search component
    console.log('🔍 Loading search components...');
    await import('./lib/search/header-search-bar/header-search-bar.js');
    console.log('✅ Search components loaded');
    
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
    
    // Initialize router (this will trigger initial route)
    router.initialize();
    
    console.log('✅ SPA initialized successfully');
    console.log('Available routes:', router.getRoutes());
    
  } catch (error) {
    console.error('❌ Failed to initialize SPA:', error);
    showInitializationError(error);
  }
}

function registerPlaceholderRoutes(router, pageManager) {
  // Home route placeholder
  router.registerRoute('/home', async (params) => {
    await pageManager.loadPage({
      async render(params) {
        return `
          <div class="spa-home-placeholder">
            <div style="text-align: center; padding: 2rem;">
              <h1>🏠 SPA Home Page</h1>
              <p>The SPA shell is working! This is a placeholder for the home page.</p>
              <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin: 1rem 0; max-width: 600px; margin-left: auto; margin-right: auto;">
                <h3>✅ What's Working:</h3>
                <ul style="text-align: left;">
                  <li>SPA application shell loaded</li>
                  <li>Firebase services initialized</li>
                  <li>Authentication components loaded</li>
                  <li>Router and page manager working</li>
                  <li>Header navigation converted to hash links</li>
                </ul>
              </div>
              <p><strong>Next step:</strong> Implement actual home page content</p>
            </div>
          </div>
        `;
      },
      
      async mount(container) {
        console.log('Home placeholder page mounted');
      },
      
      getTitle() {
        return 'Our Kitchen Chronicles';
      }
    }, { ...params, route: '/home' });
  });

  // Categories route placeholder
  router.registerRoute('/categories', async (params) => {
    await pageManager.loadPage({
      async render(params) {
        return `
          <div class="spa-categories-placeholder">
            <div style="text-align: center; padding: 2rem;">
              <h1>📚 Categories Page</h1>
              <p>Categories page placeholder - will be implemented in future phases</p>
              <p><a href="#/home">← Back to Home</a></p>
            </div>
          </div>
        `;
      },
      
      getTitle() {
        return 'Categories - Our Kitchen Chronicles';
      }
    }, { ...params, route: '/categories' });
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