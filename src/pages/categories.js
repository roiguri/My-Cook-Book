import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

initFirebase(firebaseConfig);

// Import styles
import '../styles/main.css';
import '../styles/pages/categories.css';

// For all pages
import '../js/sw-register.js';
import '../js/config/firebase-config.js';
import '../lib/search/header-search-bar/header-search-bar.js';
import '../js/navigation-script.js';

// Authentication Components
import('../lib/auth/auth-controller.js');
import('../lib/auth/components/auth-content.js');
import('../lib/auth/components/auth-avatar.js');
import('../lib/auth/components/login-form.js');
import('../lib/auth/components/signup-form.js');
import('../lib/auth/components/forgot-password.js');
import('../lib/auth/components/user-profile.js');

// Page Specific Scripts
import '../js/category.js';

// Page Specific Components
import '../lib/recipes/recipe-card/recipe-card.js';
import '../lib/search/filter-search-bar/filter-search-bar.js';
import '../lib/search/search-service/search-service.js';

// Dynamic imports (uses services)
import('../lib/modals/filter_modal/filter_modal.js');
