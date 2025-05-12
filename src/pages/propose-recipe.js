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

// Scroll to top when recipe is successfully proposed
document.addEventListener('recipe-proposed-success', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
