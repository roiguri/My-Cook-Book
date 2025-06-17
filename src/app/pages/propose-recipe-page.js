// SPA Propose Recipe Page Module
import authService from '../../js/services/auth-service.js';

export default {
  /**
   * Renders the propose recipe page HTML content
   * @param {Object} params - Route parameters and page data
   * @returns {Promise<string>} HTML content as string
   */
  async render() {
    try {
      // Resolve relative to this module so it works no matter where the SPA is mounted
      const response = await fetch(new URL('./propose-recipe-page.html', import.meta.url));
      if (!response.ok) {
        throw new Error(`Failed to load propose recipe template: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading propose recipe page template:', error);
      throw error;
    }
  },

  /**
   * Initialize page functionality after HTML is rendered
   * @param {HTMLElement} container - The SPA content container
   * @param {Object} params - Route parameters and page data
   */
  async mount(container, params) {
    console.log('Propose Recipe Page: mount() called with params:', params);
    
    try {
      // Import required components
      await this.importComponents();
      
      // Setup authentication and form handling
      await this.setupAuthentication(container);
      
      // Setup event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Error mounting propose recipe page:', error);
      this.handleError(error, 'mount');
    }
  },

  /**
   * Cleanup when leaving the page
   */
  async unmount() {
    console.log('Propose Recipe Page: unmount() called');
    
    try {
      // Remove event listeners
      this.removeEventListeners();
      
      // Clear any auth state listeners
      this.cleanupAuthListeners();
      
    } catch (error) {
      console.error('Error unmounting propose recipe page:', error);
    }
  },

  /**
   * Return page title
   * @param {Object} params - Route parameters
   * @returns {string} Page title
   */
  getTitle() {
    return 'Propose a Recipe - Our Kitchen Chronicles';
  },

  /**
   * Return page metadata
   * @param {Object} params - Route parameters
   * @returns {Object} Meta tags object
   */
  getMeta() {
    return {
      description: 'Share your culinary creations with our community. Propose a recipe and inspire others with your cooking expertise.',
      keywords: 'recipe, cooking, share, community, culinary, propose recipe, cooking tips',
    };
  },

  /**
   * Dynamic style paths for this page
   */
  stylePath: '/src/styles/pages/propose-recipe-spa.css',

  /**
   * Import required components
   */
  async importComponents() {
    try {
      await Promise.all([
        // Import recipe form component
        import('../../lib/recipes/recipe_form_component/propose_recipe_component.js'),
        // Import modal component
        import('../../lib/modals/message-modal/message-modal.js'),
      ]);
    } catch (error) {
      console.error('Error importing components for propose recipe page:', error);
      throw error;
    }
  },

  /**
   * Setup authentication handling
   */
  async setupAuthentication(container) {
    const proposeRecipeForm = container.querySelector('propose-recipe-component');
    const loginPromptModal = document.querySelector('#login-prompt-modal');
    const authController = document.querySelector('auth-controller');
    
    if (!proposeRecipeForm) {
      console.warn('propose-recipe-component not found in container');
      return;
    }

    // Store references for cleanup
    this.proposeRecipeForm = proposeRecipeForm;
    this.loginPromptModal = loginPromptModal;
    this.authController = authController;

    // Initially hide the form to prevent flash
    proposeRecipeForm.style.display = 'none';

    // Function to handle UI changes based on auth state
    this.handleAuthStateChange = (isAuthenticated) => {
      if (isAuthenticated) {
        // User is authenticated
        proposeRecipeForm.style.display = 'block';
        if (typeof proposeRecipeForm.setFormDisabled === 'function') {
          proposeRecipeForm.setFormDisabled(false);
        }
        if (loginPromptModal && loginPromptModal.isOpen) {
          loginPromptModal.close();
        }
      } else {
        // User is NOT authenticated
        proposeRecipeForm.style.display = 'block';
        if (typeof proposeRecipeForm.setFormDisabled === 'function') {
          proposeRecipeForm.setFormDisabled(true);
        } else {
          console.warn('setFormDisabled method not found on proposeRecipeForm');
          proposeRecipeForm.style.display = 'none';
        }
        this.showLoginPrompt();
      }
    };

    // Initialize auth service and set up listener
    authService.initialize();
    this.authStateUnsubscribe = authService.onAuthStateChanged((user) => {
      this.handleAuthStateChange(!!user);
    });
  },

  /**
   * Show login prompt modal
   */
  showLoginPrompt() {
    if (this.loginPromptModal && this.authController) {
      this.loginPromptModal.show(
        'רק משתמשים מחוברים יכולים להציע מתכונים. אנא התחבר או הירשם כדי להמשיך.',
        'נדרשת התחברות',
        'התחברות / הרשמה',
        () => {
          this.loginPromptModal.close();
          this.authController.openModal();
        }
      );
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle recipe proposal success
    this.recipeProposedHandler = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    document.addEventListener('recipe-proposed-success', this.recipeProposedHandler);

    // Handle login prompt modal close
    if (this.loginPromptModal) {
      this.modalClosedHandler = () => {
        if (!authService.isAuthenticated()) {
          // Navigate back to home if they close the prompt without logging in
          window.spa.router.navigate('/home');
        }
      };
      
      this.loginPromptModal.addEventListener('modal-closed-by-user', this.modalClosedHandler);
    }
  },

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    if (this.recipeProposedHandler) {
      document.removeEventListener('recipe-proposed-success', this.recipeProposedHandler);
      this.recipeProposedHandler = null;
    }
    
    if (this.loginPromptModal && this.modalClosedHandler) {
      this.loginPromptModal.removeEventListener('modal-closed-by-user', this.modalClosedHandler);
      this.modalClosedHandler = null;
    }
  },

  /**
   * Cleanup auth listeners
   */
  cleanupAuthListeners() {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
      this.authStateUnsubscribe = null;
    }
  },

  /**
   * Error handling
   */
  handleError(error, context = 'unknown') {
    console.error(`Propose Recipe Page Error in ${context}:`, error);
    
    // Show user-friendly error message
    const errorContainer = document.querySelector('.spa-content .error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <h3>Error Loading Page</h3>
          <p>Sorry, we couldn't load the propose recipe page. Please try again.</p>
          <button id="propose-error-go-home" class="btn-primary">Go Home</button>
        </div>
      `;
      
      // Attach event listener to the button (CSP-compliant)
      const goHomeButton = errorContainer.querySelector('#propose-error-go-home');
      if (goHomeButton) {
        goHomeButton.addEventListener('click', () => {
          window.spa.router.navigate('/home');
        });
      }
    }
  }
};