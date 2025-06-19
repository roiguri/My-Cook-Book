import { FirestoreService } from '../../js/services/firestore-service.js';
import authService from '../../js/services/auth-service.js';

export default {
  stylePath: '/src/styles/pages/manager-dashboard-spa.css',

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
    this.initializeDashboard();
    this.setupAuthListener();
    this.setupImageApprovalListeners();
  },

  async unmount() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  },

  getTitle() {
    return 'Manager Dashboard - Our Kitchen Chronicles';
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
      import('../../lib/modals/image_approval/image_approval.js'),
      import('../../lib/utilities/image-carousel/image-carousel.js'),
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
    const imageApprovalComponent = document.querySelector('image-approval-component');
    if (imageApprovalComponent) {
      imageApprovalComponent.addEventListener(
        'image-approved',
        this.handleImageApproved.bind(this),
      );
      imageApprovalComponent.addEventListener(
        'image-rejected',
        this.handleImageRejected.bind(this),
      );
    }
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
    try {
      const users = await FirestoreService.queryDocuments('users');
      const userList = document.getElementById('user-list');
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

  categoryMapping: {
    appetizers: 'מנות ראשונות',
    'main-courses': 'מנות עיקריות',
    'side-dishes': 'תוספות',
    'soups-stews': 'מרקים ותבשילים',
    salads: 'סלטים',
    'breakfast-brunch': 'ארוחות בוקר',
    snacks: 'חטיפים',
    beverages: 'משקאות',
    desserts: 'קינוחים',
  },

  get reverseCategoryMapping() {
    return Object.fromEntries(
      Object.entries(this.categoryMapping).map(([key, value]) => [value, key]),
    );
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
    try {
      const pendingRecipes = await FirestoreService.queryDocuments('recipes', {
        where: [['approved', '==', false]],
      });
      const recipeItems = pendingRecipes.map((recipe) => ({
        header: this.createPendingRecipeHeader(recipe),
        content: this.createPendingRecipeContent(recipe),
      }));

      if (recipeItems.length == 0) {
        const pendingRecipeSection = document.getElementById('pending-recipes');
        pendingRecipeSection.querySelector('.no-pending-message').textContent =
          'אין מתכונים הממתינים לאישור';
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
        // Refresh the recipe dashboards
        this.loadPendingRecipes();
        this.loadAllRecipes();
      });

      previewRecipeModal.addEventListener('recipe-rejected', (event) => {
        console.log('Recipe rejected:', event.detail.recipeId);
        // Refresh the recipe dashboards
        setTimeout(() => {
          this.loadPendingRecipes();
          this.loadAllRecipes();
        }, 600);
      });
    });
  },

  /**
   * Pending Images
   */
  async loadPendingImages() {
    const pendingImagesList = document.getElementById('pending-images-list');
    pendingImagesList.setItems([]);
    try {
      const pendingRecipes = await FirestoreService.queryDocuments('recipes', {
        where: [['pendingImage', '!=', null]],
      });
      const pendingImages = pendingRecipes.map((recipe) => ({
        recipeId: recipe.id,
        recipeName: recipe.name,
        imageUrl: recipe.pendingImage.full,
      }));
      const imageItems = pendingImages.map((image) => ({
        header: this.createPendingImageHeader(image),
        content: this.createPendingImageContent(image),
      }));

      if (imageItems.length == 0) {
        const pendingRecipeSection = document.getElementById('pending-images');
        pendingRecipeSection.querySelector('.no-pending-message').textContent =
          'אין תמונות הממתינות לאישור';
      }

      if (pendingImagesList) {
        pendingImagesList.setItems(imageItems);
      } else {
        console.error('Cannot find pending images list element');
      }
    } catch (error) {
      this.handleError(error);
    }
  },

  createPendingImageHeader(image) {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const span = document.createElement('span');
    span.innerHTML = `${image.recipeName}`;

    const previewButton = document.createElement('button');
    previewButton.classList.add('preview-image');
    previewButton.setAttribute('data-url', `${image.imageUrl}`);
    previewButton.setAttribute('data-recipe-id', `${image.recipeId}`);
    previewButton.textContent = 'הצג';
    previewButton.addEventListener('click', (event) => {
      event.preventDefault();
      const imageUrl = previewButton.getAttribute('data-url');
      const recipeId = previewButton.getAttribute('data-recipe-id');
      this.openImageApprovalModal(imageUrl, recipeId, image.recipeName);
    });

    header.appendChild(span);
    header.appendChild(previewButton);

    return header;
  },

  createPendingImageContent(image) {
    const content = document.createElement('div');
    content.textContent = `Image preview will be shown in the modal.`;
    return content;
  },

  /**
   * Preview Image
   */
  openImageApprovalModal(imageUrl, recipeId, recipeName) {
    const imageData = {
      recipeId: recipeId,
      imageUrl: imageUrl,
      recipeName: recipeName,
    };
    const imageApprovalComponent = document.querySelector('image-approval-component');
    imageApprovalComponent.openModalForImage(imageData);
  },

  handleImageApproved(event) {
    console.log('Image approved for recipe:', event.detail.recipeId);
    // Refresh both pending images and all recipes lists
    this.loadPendingImages();
    this.loadAllRecipes();
  },

  handleImageRejected(event) {
    console.log('Image rejected for recipe:', event.detail.recipeId);
    // Only refresh the pending images list
    this.loadPendingImages();
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
