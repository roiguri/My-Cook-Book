import { FirestoreService } from '../../js/services/firestore-service.js';
import authService from '../../js/services/auth-service.js';
import { AppConfig } from '../../js/config/app-config.js';
import { CATEGORY_MAP } from '../../js/utils/recipes/recipe-data-utils.js';
import {
  DashboardRefreshManager,
  DASHBOARD_SECTIONS,
} from '../../lib/utilities/dashboard-refresh-manager.js';
import '../../styles/pages/manager-dashboard-spa.css';

export default {
  async render(params) {
    const response = await fetch(new URL('./manager-dashboard-page.html', import.meta.url));
    if (!response.ok) {
      throw new Error(
        `Failed to load manager dashboard template: ${response.status} ${response.statusText}`,
      );
    }
    return await response.text();
  },

  async mount(container, params) {
    // Wait for authentication to be ready and check manager privileges
    const currentUser = await authService.waitForAuth();
    if (!currentUser) {
      this.redirectToHome();
      return;
    }

    const isManager = await this.checkManagerStatus(currentUser);
    if (!isManager) {
      this.redirectToHome();
      return;
    }

    await this.importComponents();
    this.initializeRefreshManager();
    this.initializeDashboard();
    this.setupAuthListener();
    this.setupImageApprovalListeners();
    this.setupRefreshIconListeners();
    this.setupEditRecipeListener();
  },

  async unmount() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  },

  getTitle() {
    return AppConfig.getPageTitle('Manager Dashboard');
  },

  getMeta() {
    return {
      description: 'Manager dashboard for recipe and user management',
      keywords: 'manager, dashboard, admin, recipes, users',
    };
  },

  async importComponents() {
    await Promise.all([
      import('../../lib/utilities/scrolling_list/scroll_list.js'),
      import('../../lib/recipes/recipe_preview_modal/edit_preview_recipe.js'),
      import('../../lib/recipes/recipe_preview_modal/recipe_preview_modal.js'),
      import('../../lib/modals/image-approval-multi/image-approval-multi.js'),
      import('../../lib/utilities/image-carousel/image-carousel.js'),
      import('../../lib/utilities/modal/modal.js'),
      import('../../lib/utilities/loading-spinner/loading-spinner.js'),
      import('../../lib/images/image-handler.js'),
    ]);
  },

  async checkManagerStatus(user) {
    try {
      const userDoc = await FirestoreService.getDocument('users', user.uid);
      if (userDoc) {
        return userDoc.role === 'manager';
      }
      return false;
    } catch (error) {
      console.error('Error checking manager status:', error);
      return false;
    }
  },

  redirectToHome() {
    // Use SPA navigation to redirect to home
    if (window.spa && window.spa.router) {
      window.spa.router.navigate('/home');
    } else {
      // Fallback to traditional redirect
      window.location.href = '/';
    }
  },

  setupAuthListener() {
    // Listen for auth state changes to detect logout
    this.authUnsubscribe = authService.onAuthStateChanged((user) => {
      if (!user) {
        // User logged out, redirect to home
        this.redirectToHome();
      }
    });
  },

  setupImageApprovalListeners() {
    const imageApprovalMulti = document.querySelector('image-approval-multi');
    if (imageApprovalMulti) {
      imageApprovalMulti.addEventListener('images-approved', this.handleImagesApproved.bind(this));
      imageApprovalMulti.addEventListener('images-rejected', this.handleImagesRejected.bind(this));
    }
  },

  initializeRefreshManager() {
    // Create refresh manager instance
    this.refreshManager = new DashboardRefreshManager(this);

    // Register master refresh icon
    const masterRefreshIcon = document.getElementById('master-refresh');
    if (masterRefreshIcon) {
      this.refreshManager.registerIcon('master', masterRefreshIcon);
    }

    // Register section refresh icons
    const sectionIcons = document.querySelectorAll('.section-refresh');
    sectionIcons.forEach((icon) => {
      const section = icon.getAttribute('data-section');
      if (section) {
        this.refreshManager.registerIcon(section, icon);
      }
    });
  },

  setupRefreshIconListeners() {
    // Master refresh icon - refresh all dashboards
    const masterRefreshIcon = document.getElementById('master-refresh');
    if (masterRefreshIcon) {
      masterRefreshIcon.addEventListener('click', () => {
        this.refreshManager.refreshAll();
      });
    }

    // Section refresh icons - refresh individual sections
    const sectionIcons = document.querySelectorAll('.section-refresh');
    sectionIcons.forEach((icon) => {
      icon.addEventListener('click', () => {
        const section = icon.getAttribute('data-section');
        if (section) {
          this.refreshManager.refreshDashboards([section]);
        }
      });
    });
  },

  setupEditRecipeListener() {
    // Listen for recipe-updated events from edit-preview-recipe component
    document.addEventListener('recipe-updated', (event) => {
      console.log('Recipe updated:', event.detail.recipeId);
      // Refresh both all recipes and pending recipes (edits require re-approval)
      this.refreshManager.refreshRecipes(600);
    });
  },

  initializeDashboard() {
    this.loadUserList();
    this.loadAllRecipes();
    this.loadPendingRecipes();
    this.loadPendingImages();
  },

  /**
   * User Management
   */
  async loadUserList() {
    const userList = document.getElementById('user-list');
    userList.setItems([]); // Clear existing items first
    try {
      const users = await FirestoreService.queryDocuments('users');
      const userItems = users.map((user) => ({
        header: this.createHeader(user.email),
        content: this.createContent(user),
      }));
      userList.setItems(userItems);
    } catch (error) {
      this.handleError(error);
    }
  },

  createHeader(email) {
    const header = document.createElement('div');
    header.textContent = email;
    return header;
  },

  createContent(user) {
    const content = document.createElement('div');
    const select = document.createElement('select');
    select.innerHTML = `
        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
        <option value="approved" ${user.role === 'approved' ? 'selected' : ''}>approved</option>
        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
    `;
    const saveButton = document.createElement('button');
    saveButton.textContent = 'שמור';
    saveButton.addEventListener('click', () => this.updateUserRole(user.id, select.value));

    const space = document.createElement('div');
    space.style.width = '20px';

    content.appendChild(select);
    content.appendChild(space);
    content.appendChild(saveButton);
    return content;
  },

  async updateUserRole(userId, newRole) {
    try {
      await FirestoreService.updateDocument('users', userId, { role: newRole });
      this.showSuccessMessage('תפקיד המשתמש עודכן בהצלחה');
    } catch (error) {
      this.handleError(error);
    }
  },

  /**
   * All Recipes
   */
  async loadAllRecipes() {
    const recipeList = document.getElementById('all-recipes-list');
    recipeList.setItems([]);
    const searchInput = document.getElementById('recipe-search');
    const filterSelect = document.getElementById('recipe-filter');

    try {
      const recipes = await FirestoreService.queryDocuments('recipes', {
        where: [['approved', '==', true]],
      });
      this.allRecipes = recipes;
      this.updateRecipeList(recipes);
      this.populateFilterOptions(recipes);

      // Set up event listeners
      searchInput.addEventListener('input', () => this.filterRecipes());
      filterSelect.addEventListener('change', () => this.filterRecipes());
    } catch (error) {
      this.handleError(error);
    }
  },

  updateRecipeList(recipes) {
    const recipeList = document.getElementById('all-recipes-list');
    const recipeItems = recipes.map((recipe) => ({
      header: recipe.name,
      content: this.createRecipeContent(recipe),
    }));
    recipeList.setItems(recipeItems);
  },

  // Use central category mapping from single source of truth
  get categoryMapping() {
    return CATEGORY_MAP;
  },

  get reverseCategoryMapping() {
    return Object.fromEntries(Object.entries(CATEGORY_MAP).map(([key, value]) => [value, key]));
  },

  createRecipeContent(recipe) {
    const container = document.createElement('div');
    container.innerHTML = `
        <p>קטגוריה: ${this.categoryMapping[recipe.category]}</p>
        <p>זמן הכנה: ${recipe.prepTime + recipe.waitTime} דקות</p>
        <button class="edit-recipe" data-id="${recipe.id}">ערוך</button>
    `;
    container
      .querySelector('.edit-recipe')
      .addEventListener('click', () => this.editRecipe(recipe));
    return container;
  },

  editRecipe(recipe) {
    const editPreviewContainer = document.querySelector('.edit-preview-container');
    editPreviewContainer.innerHTML = '';
    editPreviewContainer.innerHTML = `
      <edit-preview-recipe
        path-to-icon="/img/icon/other/"
        recipe-id="${recipe.id}" 
        start-mode="edit">
      </edit-preview-recipe>
    `;
    const editPreviewRecipe = document.querySelector('edit-preview-recipe');
    setTimeout(() => {
      editPreviewRecipe.openModal();
    }, 100);
  },

  filterRecipes() {
    const searchTerm = document.getElementById('recipe-search').value.toLowerCase();
    const filterCategory = document.getElementById('recipe-filter').value;

    const filteredRecipes = this.allRecipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(searchTerm) &&
        (filterCategory === '' || recipe.category === this.reverseCategoryMapping[filterCategory]),
    );

    this.updateRecipeList(filteredRecipes);
  },

  populateFilterOptions(recipes) {
    const filterSelect = document.getElementById('recipe-filter');
    const categories = [...new Set(recipes.map((recipe) => this.categoryMapping[recipe.category]))];

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      filterSelect.appendChild(option);
    });
  },

  /**
   * Pending Recipes
   */
  async loadPendingRecipes() {
    const pendingRecipesList = document.getElementById('pending-recipes-list');
    const pendingRecipeSection = document.getElementById('pending-recipes');
    const noPendingMessage = pendingRecipeSection.querySelector('.no-pending-message');

    try {
      const pendingRecipes = await FirestoreService.queryDocuments('recipes', {
        where: [['approved', '==', false]],
      });
      const recipeItems = pendingRecipes.map((recipe) => ({
        header: this.createPendingRecipeHeader(recipe),
        content: this.createPendingRecipeContent(recipe),
      }));

      // Always update the message based on current state
      if (recipeItems.length == 0) {
        noPendingMessage.textContent = 'אין מתכונים הממתינים לאישור';
      } else {
        noPendingMessage.textContent = ''; // Clear message when items exist
      }

      if (pendingRecipesList) {
        pendingRecipesList.setItems(recipeItems);
      } else {
        console.error('Cannot find scrolling list element');
      }
    } catch (error) {
      this.handleError(error);
    }
  },

  createPendingRecipeHeader(recipe) {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = `
      <span>${recipe.name} | ${this.categoryMapping[recipe.category] || 'No category'}</span>
      <button class="preview-recipe" data-id="${recipe.id}">הצג</button>
    `;
    header
      .querySelector('.preview-recipe')
      .addEventListener('click', () => this.previewRecipe(recipe.id));
    return header;
  },

  createPendingRecipeContent(recipe) {
    const content = document.createElement('div');
    content.textContent = `Full recipe details will be shown in the preview modal.`;
    return content;
  },

  /**
   * Preview Recipe
   */
  previewRecipe(recipeId) {
    console.log(`Preview recipe with id: ${recipeId}`);
    const previewContainer = document.querySelector('.preview-recipe-container');
    previewContainer.innerHTML = `
    <recipe-preview-modal id="recipe-preview" recipe-id="${recipeId}" recipe-name="Delicious Cake" show-buttons="true">
    `;

    customElements.whenDefined('recipe-preview-modal').then(() => {
      const previewRecipeModal = document.querySelector('recipe-preview-modal');
      previewRecipeModal.openModal();

      previewRecipeModal.addEventListener('recipe-approved', (event) => {
        console.log('Recipe approved:', event.detail.recipeId);
        // Refresh the recipe dashboards immediately
        this.refreshManager.refreshRecipes();
      });

      previewRecipeModal.addEventListener('recipe-rejected', (event) => {
        console.log('Recipe rejected:', event.detail.recipeId);
        // Refresh the recipe dashboards with delay to allow animation to complete
        this.refreshManager.refreshRecipes(600);
      });
    });
  },

  /**
   * Pending Images
   */
  async loadPendingImages() {
    const pendingImagesList = document.getElementById('pending-images-list');
    const pendingImagesSection = document.getElementById('pending-images');
    const noPendingMessage = pendingImagesSection.querySelector('.no-pending-message');

    pendingImagesList.setItems([]);
    try {
      // TODO: Optimize with Firestore compound index
      // Current approach uses client-side filtering (works fine for small datasets)
      // To optimize for large datasets (1000+ recipes):
      // 1. Create Firestore composite index:
      //    Collection: recipes
      //    Fields: pendingImages (Array-contains), approved (Ascending), __name__ (Ascending)
      // 2. Replace with compound query:
      //    where: [['pendingImages', '!=', []], ['approved', '==', true]]
      // See: https://firebase.google.com/docs/firestore/query-data/indexing

      const allPendingRecipes = await FirestoreService.queryDocuments('recipes', {
        where: [['pendingImages', '!=', []]],
      });

      // Filter client-side to only include approved recipes (not recipe proposals)
      const pendingRecipes = allPendingRecipes.filter((recipe) => recipe.approved === true);

      const recipeItems = pendingRecipes.map((recipe) => ({
        header: this.createPendingImagesRecipeHeader(recipe),
        content: this.createPendingImagesRecipeContent(recipe),
      }));

      if (recipeItems.length == 0) {
        noPendingMessage.textContent = 'אין תמונות הממתינות לאישור';
      } else {
        noPendingMessage.textContent = ''; // Clear message when items exist
      }

      if (pendingImagesList) {
        pendingImagesList.setItems(recipeItems);
      } else {
        console.error('Cannot find pending images list element');
      }
    } catch (error) {
      this.handleError(error);
    }
  },

  createPendingImagesRecipeHeader(recipe) {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const span = document.createElement('span');
    const imageCount = recipe.pendingImages?.length || 0;
    span.innerHTML = `${recipe.name} (${imageCount} תמונות)`;

    const previewButton = document.createElement('button');
    previewButton.classList.add('preview-images');
    previewButton.textContent = 'הצג';
    previewButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.openMultiImageApprovalModal(recipe);
    });

    header.appendChild(span);
    header.appendChild(previewButton);

    return header;
  },

  createPendingImagesRecipeContent(recipe) {
    const content = document.createElement('div');
    const imageCount = recipe.pendingImages?.length || 0;
    const uploadedBy = recipe.pendingImages?.[0]?.uploadedBy || 'לא ידוע';
    content.textContent = `${imageCount} תמונות הועלו על ידי ${uploadedBy}`;
    return content;
  },

  /**
   * Preview Images (Multi-Image Approval)
   */
  openMultiImageApprovalModal(recipe) {
    const imageApprovalMulti = document.querySelector('image-approval-multi');
    imageApprovalMulti.openForRecipe(recipe);
  },

  handleImagesApproved(event) {
    console.log('Images approved for recipe:', event.detail.recipeId);
    console.log('Approved image IDs:', event.detail.imageIds);
    // Refresh both pending images and all recipes lists
    this.refreshManager.refreshImages();
  },

  handleImagesRejected(event) {
    console.log('Images rejected for recipe:', event.detail.recipeId);
    console.log('Rejected image IDs:', event.detail.imageIds);
    // Only refresh the pending images list
    this.refreshManager.refreshPendingImages();
  },

  /**
   * Helper functions
   */
  showSuccessMessage(message) {
    alert(message); // Replace with a more user-friendly notification system
  },

  handleError(error) {
    console.error('Error:', error);
    alert('אירעה שגיאה. אנא נסה שנית.'); // Replace with a more user-friendly error handling system
  },
};
