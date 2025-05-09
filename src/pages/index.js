import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

initFirebase(firebaseConfig);

// Import styles
import '../styles/main.css';
import '../styles/pages/index.css';

// Import components
import '../lib/search/header-search-bar/header-search-bar.js';
import '../lib/recipes/recipe-card/recipe-card.js';
import '../lib/utilities/element-scroller/element-scroller.js';

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
import '../js/featured-recipes.js';

// Register service worker
import '../js/sw-register.js';
