import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

initFirebase(firebaseConfig);

// Import styles
import '../styles/main.css';
import '../styles/pages/manager-dashboard.css';

// For all pages
import '../js/sw-register.js';
import '../js/config/firebase-config.js';
import '../lib/search/header-search-bar/header-search-bar.js';

// Authentication Components
import('../lib/auth/auth-controller.js');
import('../lib/auth/components/auth-content.js');
import('../lib/auth/components/auth-avatar.js');
import('../lib/auth/components/login-form.js');
import('../lib/auth/components/signup-form.js');
import('../lib/auth/components/forgot-password.js');
import('../lib/auth/components/user-profile.js');

// Page Specific Scripts
import '../js/manager-dashboard.js';
import '../js/navigation-script.js';

// Page Specific Components
import '../lib/utilities/scrolling_list/scroll_list.js';
import '../lib/recipes/recipe_preview_modal/edit_preview_recipe.js';
import '../lib/recipes/recipe_preview_modal/recipe_preview_modal.js';

// Dynamic imports (uses services)
import('../lib/modals/image_approval/image_approval.js');
import('../lib/utilities/image-carousel/image-carousel.js');
