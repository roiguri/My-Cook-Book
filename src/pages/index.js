import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

// Initialize Firebase first
initFirebase(firebaseConfig);

// Import global styles
import '../styles/main.css';
import '../styles/pages/index.css'; // Styles for the main page shell

// Import common UI components (static imports for faster first paint of common elements)
import '../lib/search/header-search-bar/header-search-bar.js';
import '../lib/recipes/recipe-card/recipe-card.js';
import '../lib/utilities/element-scroller/element-scroller.js';
import '../lib/utilities/scrolling_list/scroll_list.js';
import '../lib/recipes/recipe_component/recipe_component.js';
import '../lib/search/filter-search-bar/filter-search-bar.js';
import '../lib/utilities/modal/modal.js';
import '../lib/modals/filter_modal/filter_modal.js';
import '../lib/modals/message-modal/message-modal.js';
import '../lib/recipes/recipe_preview_modal/edit_preview_recipe.js';
import '../lib/recipes/recipe_preview_modal/recipe_preview_modal.js';
import '../lib/modals/image_approval/image_approval.js';
import '../lib/utilities/pdf_viewer/pdf_viewer.js';


// Authentication Components (dynamic imports, as they might not be needed immediately)
import('../lib/auth/auth-controller.js');
import('../lib/auth/components/auth-content.js');
import('../lib/auth/components/auth-avatar.js');
import('../lib/auth/components/login-form.js');
import('../lib/auth/components/signup-form.js');
import('../lib/auth/components/forgot-password.js');
import('../lib/auth/components/user-profile.js');

// Import main navigation script (for header, etc.)
import '../js/navigation-script.js';

// Initialize the router - This will handle page loading and SPA logic
import '../js/router.js';

// Register service worker (can be last or after router init)
import '../js/sw-register.js';

console.log('Main SPA entry point (index.js) initialized.');
