import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

initFirebase(firebaseConfig);

// Import styles
import '../styles/main.css';
import '../styles/pages/categories.css';
import '../styles/pages/profile.css';

// TODO: remove after completing migration to service
// Import Firebase instances
import { auth, db, storage } from '../js/config/firebase-config.js';

// Import components
import '../lib/modals/filter_modal/filter_modal.js';
import '../lib/utilities/modal/modal.js';
import '../lib/recipes/recipe-card/recipe-card.js';
import '../lib/search/header-search-bar/header-search-bar.js';
import '../lib/search/filter-search-bar/filter-search-bar.js';
import '../lib/search/search-service/search-service.js';

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
import '../js/profile.js';

// Register service worker
import '../js/sw-register.js';
