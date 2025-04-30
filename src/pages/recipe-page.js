import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

initFirebase(firebaseConfig);

// Import styles
import '../styles/main.css';
import '../styles/pages/recipe_page.css';

// Import components
import '../lib/search/header-search-bar/header-search-bar.js';
import '../lib/utilities/image-carousel/image-carousel.js';
import '../lib/modals/missing_image_upload/missing_image_upload.js';
import '../lib/utilities/modal/modal.js';
import '../lib/recipes/recipe_component/recipe_component.js';

// Authentication Components
import('../lib/auth/auth-controller.js');
import('../lib/auth/components/auth-content.js');
import('../lib/auth/components/auth-avatar.js');
import('../lib/auth/components/login-form.js');
import('../lib/auth/components/signup-form.js');
import('../lib/auth/components/forgot-password.js');
import('../lib/auth/components/user-profile.js');

// Import page-specific scripts
import '../js/recipe-script.js';
import '../js/navigation-script.js';

// Register service worker
import '../js/sw-register.js';
