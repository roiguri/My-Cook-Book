import { initFirebase } from '../js/services/firebase-service.js';
import firebaseConfig from '../js/config/firebase-config.js';

initFirebase(firebaseConfig);

// Import styles
import '../styles/main.css';
import '../styles/pages/documents.css';

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

// Page specific:
import '../js/navigation-script.js';
import '../js/documents.js';
import '../lib/utilities/modal/modal.js';

// Dynamic imports (uses services)
import('../lib/utilities/pdf_viewer/pdf_viewer.js');
