import authService from '../../js/services/auth-service.js';

export default {
  async render() {
    try {
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

  async mount(container, params) {
    try {
      await this.importComponents();

      await this.setupAuthentication(container);

      this.setupEventListeners();
    } catch (error) {
      console.error('Error mounting propose recipe page:', error);
      this.handleError(error, 'mount');
    }
  },

  async unmount() {
    try {
      this.removeEventListeners();

      this.cleanupAuthListeners();
    } catch (error) {
      console.error('Error unmounting propose recipe page:', error);
    }
  },

  getTitle() {
    return 'Propose a Recipe - Our Kitchen Chronicles';
  },

  getMeta() {
    return {
      description:
        'Share your culinary creations with our community. Propose a recipe and inspire others with your cooking expertise.',
      keywords: 'recipe, cooking, share, community, culinary, propose recipe, cooking tips',
    };
  },

  stylePath: '/src/styles/pages/propose-recipe-spa.css',

  async importComponents() {
    try {
      await Promise.all([
        import('../../lib/recipes/recipe_form_component/propose_recipe_component.js'),
        import('../../lib/modals/message-modal/message-modal.js'),
      ]);
    } catch (error) {
      console.error('Error importing components for propose recipe page:', error);
      throw error;
    }
  },

  async setupAuthentication(container) {
    const proposeRecipeForm = container.querySelector('propose-recipe-component');
    const loginPromptModal = document.querySelector('#login-prompt-modal');
    const authController = document.querySelector('auth-controller');

    if (!proposeRecipeForm) {
      console.warn('propose-recipe-component not found in container');
      return;
    }

    this.proposeRecipeForm = proposeRecipeForm;
    this.loginPromptModal = loginPromptModal;
    this.authController = authController;

    proposeRecipeForm.style.display = 'none';

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

    authService.initialize();
    this.authStateUnsubscribe = authService.onAuthStateChanged((user) => {
      this.handleAuthStateChange(!!user);
    });
  },

  showLoginPrompt() {
    if (this.loginPromptModal && this.authController) {
      this.loginPromptModal.show(
        'רק משתמשים מחוברים יכולים להציע מתכונים. אנא התחבר או הירשם כדי להמשיך.',
        'נדרשת התחברות',
        'התחברות / הרשמה',
        () => {
          this.loginPromptModal.close();
          this.authController.openModal();
        },
      );
    }
  },

  setupEventListeners() {
    this.recipeProposedHandler = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    document.addEventListener('recipe-proposed-success', this.recipeProposedHandler);

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

  cleanupAuthListeners() {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
      this.authStateUnsubscribe = null;
    }
  },

  handleError(error, context = 'unknown') {
    console.error(`Propose Recipe Page Error in ${context}:`, error);

    const errorContainer = document.querySelector('.spa-content .error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <h3>Error Loading Page</h3>
          <p>Sorry, we couldn't load the propose recipe page. Please try again.</p>
          <button id="propose-error-go-home" class="btn-primary">Go Home</button>
        </div>
      `;

      const goHomeButton = errorContainer.querySelector('#propose-error-go-home');
      if (goHomeButton) {
        goHomeButton.addEventListener('click', () => {
          window.spa.router.navigate('/home');
        });
      }
    }
  },
};
