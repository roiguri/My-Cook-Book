import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

initFirebase(firebaseConfig);

// Import styles
import '../styles/main.css';
import '../styles/pages/propose_recipe.css';

// Import components
import '../lib/recipes/recipe_form_component/propose_recipe_component.js';
import '../lib/search/header-search-bar/header-search-bar.js';

// Authentication Components
import('../lib/auth/auth-controller.js');
import('../lib/auth/components/auth-content.js');
import('../lib/auth/components/auth-avatar.js');
import('../lib/auth/components/login-form.js');
import('../lib/auth/components/signup-form.js');
import('../lib/auth/components/forgot-password.js');
import('../lib/auth/components/user-profile.js');

// Import page-specific scripts
import '../js/navigation-script.js';

// Register service worker
import '../js/sw-register.js';

// Import authService and MessageModal
import authService from '../js/services/auth-service.js';
import '../lib/modals/message-modal/message-modal.js';

// Scroll to top when recipe is successfully proposed
document.addEventListener('recipe-proposed-success', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('DOMContentLoaded', () => {
  const proposeRecipeForm = document.querySelector('propose-recipe-component');
  const loginPromptModal = document.querySelector('#login-prompt-modal');
  const authController = document.querySelector('auth-controller');
  
  let authInitialized = false;

  const showLoginPrompt = () => {
    if (loginPromptModal && authController) {
      loginPromptModal.show(
        'רק משתמשים מחוברים יכולים להציע מתכונים. אנא התחבר או הירשם כדי להמשיך.',
        'נדרשת התחברות',
        'התחברות / הרשמה', // buttonText
        () => { // buttonAction
          loginPromptModal.close();
          authController.openModal();
        }
      );
    }
  };

  // Initially hide the form to prevent flash
  if (proposeRecipeForm) {
    proposeRecipeForm.style.display = 'none';
  }

  // Function to handle UI changes based on auth state
  const handleAuthStateChange = (isAuthenticated) => {
    if (isAuthenticated) {
      // User is authenticated
      if (proposeRecipeForm) {
        proposeRecipeForm.style.display = 'block'; // Ensure it's visible
        if (typeof proposeRecipeForm.setFormDisabled === 'function') {
          proposeRecipeForm.setFormDisabled(false); // Enable the form
        } else {
          console.warn('setFormDisabled method not found on proposeRecipeForm for enabling.');
        }
      }
      if (loginPromptModal && loginPromptModal.isOpen) {
        loginPromptModal.close(); // Close the login prompt modal
      }
    } else {
      // User is NOT authenticated
      if (proposeRecipeForm) {
        proposeRecipeForm.style.display = 'block'; // Ensure it's visible (but will be disabled)
        if (typeof proposeRecipeForm.setFormDisabled === 'function') {
          proposeRecipeForm.setFormDisabled(true); // Disable the form
        } else {
          console.warn('setFormDisabled method not found on proposeRecipeForm for disabling.');
          // Fallback to old behavior if method is missing for some reason
          proposeRecipeForm.style.display = 'none';
        }
      }
      showLoginPrompt(); // Show the login prompt modal
    }
  };

  // Initialize auth service and use Firebase's onAuthStateChanged directly
  // This properly waits for the initial auth state to be determined
  authService.initialize();
  authService.onAuthStateChanged((user) => {
    handleAuthStateChange(!!user);
  });

  if (loginPromptModal) {
    loginPromptModal.addEventListener('modal-closed-by-user', () => {
      // This event now correctly fires only if 'x' or Esc used on loginPromptModal.
      if (!authService.isAuthenticated()) {
        // If they closed the prompt and are still not logged in, redirect.
        window.location.href = '/'; // Or appropriate homepage path
      }
    });
  }
});
