// Import Firebase instances
import { auth, db, storage } from '../js/config/firebase-config.js';

// Import components
import '../lib/utilities/modal/modal.js';
import '../lib/modals/message-modal/message-modal.js';
import '../lib/recipes/recipe_form_component/recipe_form_component.js';
import '../lib/recipes/recipe_form_component/propose_recipe_component.js';
import '../lib/search/header-search-bar/header-search-bar.js';
import '../lib/images/image-handler.js';

// Import Auth Components
import '../lib/auth/auth-controller.js';
import '../lib/auth/components/auth-content.js';
import '../lib/auth/components/auth-avatar.js';
import '../lib/auth/components/login-form.js';
import '../lib/auth/components/signup-form.js';
import '../lib/auth/components/forgot-password.js';
import '../lib/auth/components/user-profile.js';

// Import page-specific scripts
import '../js/navigation-script.js';

// Import styles
import '../styles/main.css';
import '../styles/pages/propose_recipe.css';

// Register service worker
import '../js/sw-register.js';
