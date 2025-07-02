import authService from '../../js/services/auth-service.js';
import { AppConfig } from '../../js/config/app-config.js';
import '../../styles/pages/propose-recipe-spa.css';

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
      await this.setupAuthentication(container); // this.proposeComponent is set here
      this.setupEventListeners();

      // Bind context for handleBeforeUnload
      this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
      window.addEventListener('beforeunload', this.handleBeforeUnload);

      // Get the confirmation modal - assuming it's in propose-recipe-page.html or added by a parent
      // It's better to have it inside the page's own template or ensure its availability.
      // For now, query globally. If page has its own shadow DOM, this might need adjustment.
      this.navConfirmationModal = document.querySelector('#propose-page-confirmation-modal');
      if (!this.navConfirmationModal) {
          // Fallback: create and append if not found. This is not ideal for component structure.
          console.warn('Propose page confirmation modal not found in DOM, creating one.');
          this.navConfirmationModal = document.createElement('confirmation-modal');
          this.navConfirmationModal.id = 'propose-page-confirmation-modal'; // Ensure it has an ID if created
          document.body.appendChild(this.navConfirmationModal); // Or append to container
      }

    } catch (error) {
      console.error('Error mounting propose recipe page:', error);
      this.handleError(error, 'mount');
    }
  },

  async showNavigationConfirmationModal() {
    return new Promise((resolve) => {
      if (!this.navConfirmationModal) {
        console.error('Navigation confirmation modal not available.');
        resolve(window.confirm('You have unsaved changes. Are you sure you want to leave?')); // Fallback
        return;
      }

      const message = 'יש לך שינויים שלא נשמרו. האם ברצונך לצאת?';
      const title = 'שינויים לא שמורים';
      const approveText = 'צא'; // Leave
      const rejectText = 'הישאר'; // Stay

      const approvedHandler = () => {
        this.navConfirmationModal.removeEventListener('confirm-approved', approvedHandler);
        this.navConfirmationModal.removeEventListener('confirm-rejected', rejectedHandler);
        resolve(true);
      };
      const rejectedHandler = () => {
        this.navConfirmationModal.removeEventListener('confirm-approved', approvedHandler);
        this.navConfirmationModal.removeEventListener('confirm-rejected', rejectedHandler);
        resolve(false);
      };

      this.navConfirmationModal.addEventListener('confirm-approved', approvedHandler);
      this.navConfirmationModal.addEventListener('confirm-rejected', rejectedHandler);

      this.navConfirmationModal.confirm(message, title, approveText, rejectText);
    });
  },

  async unmount() {
    if (this.hasUnsavedChanges()) {
      const confirmed = await this.showNavigationConfirmationModal();
      if (!confirmed) {
        console.log('Page unmount cancelled by user due to unsaved changes.');
        return false; // Indicate that unmount should be aborted
      }
    }

    try {
      this.removeEventListeners();
      this.cleanupAuthListeners();
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      // If modal was dynamically added and needs cleanup:
      // if (this.navConfirmationModal && this.navConfirmationModal.parentElement === document.body) {
      //    this.navConfirmationModal.remove();
      // }
    } catch (error) {
      console.error('Error unmounting propose recipe page:', error);
    }
    return true; // Indicate successful unmount
  },

  handleBeforeUnload(event) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault(); // Standard for most browsers
      event.returnValue = ''; // Required for Chrome and Firefox
      return ''; // For older browsers
    }
  },

  getTitle() {
    return AppConfig.getPageTitle('הצעת מתכון');
  },

  getMeta() {
    return {
      description:
        'Share your culinary creations with our community. Propose a recipe and inspire others with your cooking expertise.',
      keywords: 'recipe, cooking, share, community, culinary, propose recipe, cooking tips',
    };
  },

  async importComponents() {
    try {
      await Promise.all([
        import('../../lib/recipes/recipe_form_component/propose_recipe_component.js'),
        import('../../lib/modals/message-modal/message-modal.js'),
        import('../../lib/modals/confirmation_modal/confirmation_modal.js'),
      ]);
    } catch (error) {
      console.error('Error importing components for propose recipe page:', error);
      throw error;
    }
  },

  async setupAuthentication(container) {
    this.proposeComponent = container.querySelector('propose-recipe-component');
    const loginPromptModal = document.querySelector('#login-prompt-modal');
    const authController = document.querySelector('auth-controller');

    if (!this.proposeComponent) {
      console.warn('propose-recipe-component not found in container');
      return;
    }

    this.loginPromptModal = loginPromptModal;
    this.authController = authController;

    this.proposeComponent.style.display = 'none';

    this.handleAuthStateChange = (isAuthenticated) => {
      if (isAuthenticated) {
        // User is authenticated
        this.proposeComponent.style.display = 'block';
        if (typeof this.proposeComponent.setFormDisabled === 'function') {
          this.proposeComponent.setFormDisabled(false);
        }
        if (loginPromptModal && loginPromptModal.isOpen) {
          loginPromptModal.close();
        }
      } else {
        // User is NOT authenticated
        this.proposeComponent.style.display = 'block';
        if (typeof this.proposeComponent.setFormDisabled === 'function') {
          this.proposeComponent.setFormDisabled(true);
        } else {
          console.warn('setFormDisabled method not found on proposeComponent');
          this.proposeComponent.style.display = 'none';
        }
        this.showLoginPrompt();
      }
    };

    authService.initialize();
    this.authStateUnsubscribe = authService.onAuthStateChanged((user) => {
      this.handleAuthStateChange(!!user);
    });
  },

  hasUnsavedChanges() {
    if (this.proposeComponent && typeof this.proposeComponent.isDirty === 'function') {
      return this.proposeComponent.isDirty();
    }
    return false;
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
