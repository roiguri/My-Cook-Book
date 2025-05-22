// Basic client-side router
import { loadPageContent } from './page-loader.js';
import { initCategoryPage, cleanupCategoryPage } from './pages/category-page.js';
import { initProfilePage, cleanupProfilePage } from './pages/profile-page.js';
import { initRecipeDetailPage, cleanupRecipeDetailPage } from './pages/recipe-detail-page.js';
import { initDocumentsPage, cleanupDocumentsPage } from './pages/documents-page.js';
import { initFeaturedRecipes, cleanupFeaturedRecipes } from './pages/home-page-logic.js';
import { initManagerDashboardPage, cleanupManagerDashboardPage } from './pages/manager-dashboard-page.js';
import { initProposeRecipePage, cleanupProposeRecipePage } from './pages/propose-recipe-page.js';

// Store the cleanup function for the currently active page-specific logic
let currentPageCleanup = null;
// Store the instance of the category page module to call its methods
let categoryPageModuleInstance = null;

/**
 * @type {Map<string, function>}
 * Stores route definitions.
 * Keys are URL hash paths (e.g., '#/categories'), and values are handler functions.
 */
export const routes = new Map();

/**
 * Adds a new route to the router.
 * @param {string} path - The URL hash path (e.g., '#/categories').
 * @param {function} handler - The function to call when the route is matched.
 */
export function addRoute(path, handler) {
  routes.set(path, handler);
}

/**
 * Handles changes in the URL hash.
 * Parses the current URL hash, looks up the corresponding handler in the `routes` object,
 * and calls it if found. Otherwise, logs an error or handles sub-routes.
 */
async function handleRouteChange() {
  // Call cleanup for the previous page's logic if it exists
  if (currentPageCleanup) {
    console.log('Calling cleanup for previous page:', currentPageCleanup);
    try {
      await currentPageCleanup(); // Make it async if cleanup can be async
    } catch (e) {
      console.error("Error during page cleanup:", e);
    }
    currentPageCleanup = null;
    categoryPageModuleInstance = null; // Clear instance if it was set
  }

  let path = window.location.hash || '#/'; // Default to '#/' if no hash
  console.log(`Attempting to navigate to: ${path}`);

  // Handle routes with sub-parts, e.g., #/categories#appetizers or #/recipe?id=123
  // The main path key for `routes` Map should be the part before the second '#' or '?'.
  let mainPath = path;
  let subPath = '';
  let queryParams = '';

  if (path.includes('?')) {
    [mainPath, queryParams] = path.split('?');
  }
  
  if (mainPath.includes('#', 2)) { // check for a second '#' (e.g. in #/categories#appetizers)
      const parts = mainPath.split('#'); // e.g., ["", "/categories", "appetizers"]
      mainPath = `#${parts[1]}`; // Reconstruct main path e.g., #/categories
      subPath = parts[2]; // e.g., appetizers
  }


  if (routes.has(mainPath)) {
    const handler = routes.get(mainPath);
    try {
      // Pass subPath and queryParams to the handler if needed
      // For now, handlers are expected to read window.location.hash themselves if they need subPath/queryParams
      await handler(subPath, queryParams); // Make handler async if it wasn't already
    } catch (error) {
      console.error(`Error executing handler for route ${mainPath}:`, error);
    }
  } else {
    console.error(`No handler found for route: ${mainPath}. Full path was ${path}.`);
    // Optionally, load a "not found" view here
    const targetElement = document.getElementById('app-content');
    if (targetElement) {
      targetElement.innerHTML = `<h1>404 - Page Not Found</h1><p>No handler for ${mainPath}</p>`;
    }
  }
}

// --- Page Loading Functions ---

async function loadHomePage() {
  console.log('Attempting to load home page...');
  currentPageCleanup = null; 
  categoryPageModuleInstance = null;
  try {
    const contentElement = await loadPageContent('index.html', 'main', 'app-content');
    console.log('Home page HTML loaded successfully. Initializing featured recipes...');
    await initFeaturedRecipes(contentElement); // Make it await if init is async
    currentPageCleanup = () => cleanupFeaturedRecipes(contentElement); // Pass contentElement to cleanup
    console.log('Home page logic initialized and cleanup function set.');
  } catch (error) {
    console.error('Failed to load or initialize home page:', error);
    const targetElement = document.getElementById('app-content');
    if (targetElement) {
      targetElement.innerHTML = `<p>Error loading page. Please try again later.</p><p><small>${error.message}</small></p>`;
    }
  }
}

async function loadCategoriesPage(subCategoryFromHash) {
  console.log('Attempting to load categories page...');
  currentPageCleanup = null; // Default, will be set if successful
  categoryPageModuleInstance = null;
  try {
    const contentElement = await loadPageContent('pages/categories.html', 'main', 'app-content');
    console.log('Categories page HTML loaded successfully. Initializing page logic...');
    // Create a new "instance" of the category page logic
    // The initCategoryPage function might benefit from being a class constructor
    // or returning an object with methods if more complex interaction is needed.
    // For now, we assume initCategoryPage sets up everything and cleanupCategoryPage tears it down.
    // We also need a way to communicate sub-category changes to the already loaded page.
    
    if (categoryPageModuleInstance && categoryPageModuleInstance.handleCategoryChangeForRouter) {
        // If page is already loaded and we are just changing sub-category
        await categoryPageModuleInstance.handleCategoryChangeForRouter(subCategoryFromHash);
    } else {
        // Initial load of categories page
        categoryPageModuleInstance = {}; // Simple object to hold the exposed router interaction method
        // Pass the instance to initCategoryPage so it can attach methods to it
        initCategoryPage.call(categoryPageModuleInstance, contentElement); // Use .call to set 'this' inside initCategoryPage
        currentPageCleanup = cleanupCategoryPage;
        console.log('Categories page logic initialized and cleanup function set.');

        // If there was a subCategory in the hash, tell the newly initialized page
        if (subCategoryFromHash && categoryPageModuleInstance.handleCategoryChangeForRouter) {
             await categoryPageModuleInstance.handleCategoryChangeForRouter(subCategoryFromHash);
        }
    }

  } catch (error) {
    console.error('Failed to load or initialize categories page:', error);
    const targetElement = document.getElementById('app-content');
    if (targetElement) {
      targetElement.innerHTML = `<p>Error loading categories. Please try again later.</p><p><small>${error.message}</small></p>`;
    }
  }
}

async function loadProposeRecipePage() {
  console.log('Attempting to load propose recipe page...');
  currentPageCleanup = null;
  categoryPageModuleInstance = null;
  try {
    const contentElement = await loadPageContent('pages/propose-recipe.html', 'main', 'app-content');
    console.log('Propose recipe page loaded successfully. Initializing page logic...');
    initProposeRecipePage(contentElement);
    currentPageCleanup = () => cleanupProposeRecipePage(contentElement);
    console.log('Propose recipe page logic initialized and cleanup function set.');
  } catch (error) {
    console.error('Failed to load propose recipe page:', error);
    const targetElement = document.getElementById('app-content');
    if (targetElement) {
      targetElement.innerHTML = `<p>Error loading page. Please try again later.</p><p><small>${error.message}</small></p>`;
    }
  }
}

async function loadDocumentsPage() {
  console.log('Attempting to load documents page...');
  currentPageCleanup = null;
  categoryPageModuleInstance = null;
  try {
    const contentElement = await loadPageContent('pages/documents.html', 'main', 'app-content');
    console.log('Documents page HTML loaded successfully. Initializing page logic...');
    initDocumentsPage(contentElement);
    currentPageCleanup = cleanupDocumentsPage;
    console.log('Documents page logic initialized and cleanup function set.');
  } catch (error) {
    console.error('Failed to load or initialize documents page:', error);
    const targetElement = document.getElementById('app-content');
    if (targetElement) {
      targetElement.innerHTML = `<p>Error loading page. Please try again later.</p><p><small>${error.message}</small></p>`;
    }
  }
}

async function loadManagerDashboardPage() {
  console.log('Attempting to load manager dashboard page...');
  currentPageCleanup = null;
  categoryPageModuleInstance = null;
  try {
    const contentElement = await loadPageContent('pages/manager-dashboard.html', 'main', 'app-content');
    console.log('Manager dashboard HTML loaded successfully. Initializing page logic...');
    initManagerDashboardPage(contentElement);
    currentPageCleanup = () => cleanupManagerDashboardPage(contentElement); // Pass contentElement
    console.log('Manager dashboard logic initialized and cleanup function set.');
  } catch (error) {
    console.error('Failed to load or initialize manager dashboard page:', error);
    const targetElement = document.getElementById('app-content');
    if (targetElement) {
      targetElement.innerHTML = `<p>Error loading page. Please try again later.</p><p><small>${error.message}</small></p>`;
    }
  }
}

async function loadProfilePage() {
  console.log('Attempting to load profile page...');
  currentPageCleanup = null;
  categoryPageModuleInstance = null;
  try {
    const contentElement = await loadPageContent('pages/profile.html', 'main', 'app-content');
    console.log('Profile page HTML loaded successfully. Initializing page logic...');
    initProfilePage(contentElement);
    currentPageCleanup = cleanupProfilePage;
    console.log('Profile page logic initialized and cleanup function set.');
  } catch (error) {
    console.error('Failed to load or initialize profile page:', error);
    const targetElement = document.getElementById('app-content');
    if (targetElement) {
      targetElement.innerHTML = `<p>Error loading page. Please try again later.</p><p><small>${error.message}</small></p>`;
    }
  }
}

async function loadRecipePage() {
  console.log('Attempting to load recipe page...');
  currentPageCleanup = null;
  categoryPageModuleInstance = null;
  try {
    const contentElement = await loadPageContent('pages/recipe-page.html', 'main', 'app-content');
    console.log('Recipe page HTML loaded successfully. Initializing page logic...');

    const recipeId = new URLSearchParams(queryParams).get('id');

    if (recipeId) {
      initRecipeDetailPage(contentElement, recipeId);
      // Pass contentElement to cleanup via lambda
      currentPageCleanup = () => cleanupRecipeDetailPage(contentElement); 
      console.log(`Recipe detail page for ID ${recipeId} initialized and cleanup function set.`);
    } else {
      console.error('No recipeId found in query parameters.');
      if (contentElement) {
        contentElement.innerHTML = '<p>Error: Recipe ID not found in URL.</p>';
      }
    }
  } catch (error) {
    console.error('Failed to load or initialize recipe detail page:', error);
    const targetElement = document.getElementById('app-content'); // Fallback if contentElement failed to load
    if (targetElement) {
      targetElement.innerHTML = `<p>Error loading recipe page. Please try again later.</p><p><small>${error.message}</small></p>`;
    }
  }
}

function loadNotFoundContent() {
  console.log('Load Page Not Found content (placeholder)');
  // Example: document.getElementById('app-content').innerHTML = '<h1>404 - Page Not Found</h1>';
}

// --- Initialize Router ---

// Add routes for all pages
addRoute('#/', loadHomePage);
addRoute('#/categories', loadCategoriesPage);
addRoute('#/propose-recipe', loadProposeRecipePage);
addRoute('#/documents', loadDocumentsPage);
addRoute('#/manager-dashboard', loadManagerDashboardPage);
addRoute('#/profile', loadProfilePage);
addRoute('#/recipe', loadRecipePage); // Generic recipe page route

// A catch-all or specific 404 route could also be added if desired,
// but the current handleRouteChange handles unknown paths by logging an error.
// For a more explicit "Not Found" page, you could use:
// addRoute('#/not-found', loadNotFoundContent);
// And then redirect to '#/not-found' in handleRouteChange's else block.

// Listen for hash changes
window.addEventListener('hashchange', handleRouteChange);

// Handle the initial route when the script loads
// Ensure this runs after the DOM is fully loaded if it manipulates the DOM early.
// Using a timeout to ensure window.location.hash is correctly populated at load time.
window.addEventListener('DOMContentLoaded', () => {
  // Add a default route for the root if no hash is present
  if (!window.location.hash) {
    window.location.hash = '#/';
  }
  handleRouteChange();
});

console.log('Router initialized. Listening for hash changes.');
