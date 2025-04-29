// Import styles
import '../styles/main.css';
import '../styles/pages/manager-dashboard.css';

import { auth, db, storage } from '../js/config/firebase-config.js';

// For all pages
import '../js/sw-register.js';
import '../js/config/firebase-config.js'

// General Components
import '../lib/utilities/modal/modal.js';
import '../lib/search/header-search-bar/header-search-bar.js';
import '../lib/auth/auth-controller.js';
import '../lib/auth/components/auth-content.js';
import '../lib/auth/components/auth-avatar.js';
import '../lib/auth/components/login-form.js';
import '../lib/auth/components/signup-form.js';
import '../lib/auth/components/forgot-password.js';
import '../lib/auth/components/user-profile.js';

// Page Specific Scripts
import '../js/manager-dashboard.js';
import '../js/navigation-script.js';
import '../js/utilities/firebase-storage-utils.js';

// Page Specific Components
import '../lib/utilities/scrolling_list/scroll_list.js';
import '../lib/modals/image_approval/image_approval.js';
import '../lib/recipes/recipe_preview_modal/recipe_preview_modal.js';
import '../lib/recipes/recipe_component/recipe_component.js';
import '../lib/recipes/recipe_preview_modal/edit_preview_recipe.js';
import '../lib/recipes/recipe_form_component/edit_recipe_component.js';
import '../lib/recipes/recipe_form_component/recipe_form_component.js';
import '../lib/utilities/image-carousel/image-carousel.js';