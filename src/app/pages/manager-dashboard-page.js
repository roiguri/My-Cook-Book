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
    this.loadFailedUrls();
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
    header.style.cssText =
      'font-family: var(--font-ui-he); font-size: 14px; color: var(--ink);' +
      'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    header.textContent = email;
    return header;
  },

  createContent(user) {
    const content = document.createElement('div');
    content.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const label = document.createElement('span');
    label.textContent = 'תפקיד:';
    label.style.cssText =
      'font-family: var(--font-ui-he); font-size: 11px; font-weight: 600;' +
      'letter-spacing: 0.08em; color: var(--ink-3); flex-shrink: 0;';

    const select = document.createElement('select');
    select.style.cssText =
      'flex: 1; padding: 7px 10px;' +
      'border: 1.5px solid var(--hairline-strong, rgba(31,29,24,0.15));' +
      'border-radius: var(--r-sm, 10px); font-family: var(--font-ui-he);' +
      'font-size: 13px; background: var(--surface-0); color: var(--ink); cursor: pointer; outline: none;';
    select.innerHTML = `
      <option value="user"     ${user.role === 'user' ? 'selected' : ''}>משתמש</option>
      <option value="approved" ${user.role === 'approved' ? 'selected' : ''}>מאושר</option>
      <option value="manager"  ${user.role === 'manager' ? 'selected' : ''}>מנהל</option>
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'שמור';
    saveBtn.style.cssText =
      'background: var(--primary); color: #fff; border: none;' +
      'padding: 7px 16px; border-radius: var(--r-pill, 999px);' +
      'font-family: var(--font-ui-he); font-size: 13px; font-weight: 500;' +
      'cursor: pointer; flex-shrink: 0;';
    saveBtn.addEventListener('mouseover', () => {
      saveBtn.style.background = 'var(--primary-dark)';
    });
    saveBtn.addEventListener('mouseout', () => {
      saveBtn.style.background = 'var(--primary)';
    });
    saveBtn.addEventListener('click', () => this.updateUserRole(user.id, select.value));

    content.appendChild(label);
    content.appendChild(select);
    content.appendChild(saveBtn);
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
    container.style.cssText =
      'display: flex; align-items: center; justify-content: space-between; gap: 10px;';

    const meta = document.createElement('div');
    meta.style.cssText = 'display: flex; gap: 6px;';
    const chipStyle =
      'background: var(--surface-2, #f0ede6);' +
      'border-radius: var(--r-pill, 999px);' +
      'padding: 3px 10px;' +
      'font-family: var(--font-ui-he, sans-serif);' +
      'font-size: 12px;' +
      'color: var(--ink, #1f1d18);';
    meta.innerHTML =
      `<span style="${chipStyle}">${this.categoryMapping[recipe.category] || '—'}</span>` +
      `<span style="${chipStyle}">${recipe.prepTime + recipe.waitTime} דק׳</span>`;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'ערוך';
    editBtn.dataset.id = recipe.id;
    editBtn.style.cssText =
      'background: transparent; color: var(--primary-dark);' +
      'border: 1.5px solid var(--primary-dark); padding: 5px 14px;' +
      'border-radius: var(--r-pill, 999px); font-family: var(--font-ui-he);' +
      'font-size: 12px; font-weight: 500; cursor: pointer; flex-shrink: 0;';
    editBtn.addEventListener('mouseover', () => {
      editBtn.style.background = 'rgba(106,153,78,0.08)';
    });
    editBtn.addEventListener('mouseout', () => {
      editBtn.style.background = 'transparent';
    });
    editBtn.addEventListener('click', () => this.editRecipe(recipe));

    container.appendChild(meta);
    container.appendChild(editBtn);
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
    header.style.cssText =
      'display:flex; align-items:center; justify-content:space-between; gap:8px;';

    const info = document.createElement('div');
    info.style.cssText = 'display:flex; flex-direction:column; gap:2px; min-width:0;';

    const name = document.createElement('span');
    name.textContent = recipe.name;
    name.style.cssText =
      'font-family:var(--font-ui-he); font-size:14px; color:var(--ink);' +
      'overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';

    const cat = document.createElement('span');
    cat.textContent = this.categoryMapping[recipe.category] || '—';
    cat.style.cssText =
      'font-family:var(--font-mono); font-size:11px; color:var(--ink-3); letter-spacing:0.04em;';

    info.appendChild(name);
    info.appendChild(cat);

    const btn = this._ghostPillBtn('הצג');
    btn.addEventListener('click', () => this.previewRecipe(recipe.id));

    header.appendChild(info);
    header.appendChild(btn);
    return header;
  },

  createPendingRecipeContent() {
    const content = document.createElement('div');
    content.style.cssText =
      'font-family:var(--font-ui-he); font-size:13px; color:var(--ink-3); font-style:italic;';
    content.textContent = 'לחץ על "הצג" לצפייה בפרטי המתכון המלאים';
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
    header.style.cssText =
      'display:flex; align-items:center; justify-content:space-between; gap:8px;';

    const info = document.createElement('div');
    info.style.cssText = 'display:flex; align-items:center; gap:8px; min-width:0;';

    const name = document.createElement('span');
    name.textContent = recipe.name;
    name.style.cssText =
      'font-family:var(--font-ui-he); font-size:14px; color:var(--ink);' +
      'overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';

    const imageCount = recipe.pendingImages?.length || 0;
    const countChip = document.createElement('span');
    countChip.textContent = `${imageCount} תמונות`;
    countChip.style.cssText =
      'flex-shrink:0; background:var(--surface-2,#f0ede6); border-radius:var(--r-pill,999px);' +
      'padding:2px 8px; font-family:var(--font-ui-he); font-size:11px; color:var(--ink-3);';

    info.appendChild(name);
    info.appendChild(countChip);

    const btn = this._ghostPillBtn('הצג');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.openMultiImageApprovalModal(recipe);
    });

    header.appendChild(info);
    header.appendChild(btn);
    return header;
  },

  createPendingImagesRecipeContent(recipe) {
    const content = document.createElement('div');
    content.style.cssText = 'display:flex; align-items:center; gap:8px;';

    const imageCount = recipe.pendingImages?.length || 0;
    const uploadedBy = recipe.pendingImages?.[0]?.uploadedBy || 'לא ידוע';
    const chipStyle =
      'background:var(--surface-2,#f0ede6); border-radius:var(--r-pill,999px);' +
      'padding:3px 10px; font-family:var(--font-ui-he); font-size:12px; color:var(--ink);';
    content.innerHTML =
      `<span style="${chipStyle}">${imageCount} תמונות</span>` +
      `<span style="font-family:var(--font-ui-he); font-size:13px; color:var(--ink-3);">` +
      `הועלו על ידי ${uploadedBy}</span>`;
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
   * Failed URLs
   */
  async loadFailedUrls() {
    const failedUrlsList = document.getElementById('failed-urls-list');
    const failedUrlsSection = document.getElementById('failed-urls');
    const noItemsMessage = failedUrlsSection.querySelector('.no-items-message');

    try {
      const failedUrls = await FirestoreService.queryDocuments('failed_url_extractions', {
        orderBy: ['lastAttempt', 'desc'],
      });

      const items = failedUrls.map((item) => ({
        header: this.createFailedUrlHeader(item),
        content: this.createFailedUrlContent(item),
      }));

      if (items.length === 0) {
        noItemsMessage.textContent = 'אין כתובות שנכשלו';
      } else {
        noItemsMessage.textContent = '';
      }

      if (failedUrlsList) {
        failedUrlsList.setItems(items);
      } else {
        console.error('Cannot find failed urls list element');
      }
    } catch (error) {
      this.handleError(error);
    }
  },

  createFailedUrlHeader(item) {
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; gap:8px;';

    const urlSpan = document.createElement('span');
    urlSpan.textContent = item.url;
    urlSpan.title = item.url;
    urlSpan.style.cssText =
      'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;' +
      'direction:ltr; font-family:var(--font-mono); font-size:12px; color:var(--ink-3); text-align:left;';

    const countChip = document.createElement('span');
    countChip.innerHTML = `${item.count}<span style="margin-inline-start:3px; opacity:0.75;">✕</span>`;
    countChip.style.cssText =
      'flex-shrink:0; background:rgba(188,71,73,0.08); border-radius:var(--r-pill,999px);' +
      'padding:2px 8px; font-family:var(--font-mono); font-size:11px; color:var(--secondary-dark,#bc4749);';

    header.appendChild(urlSpan);
    header.appendChild(countChip);
    return header;
  },

  createFailedUrlContent(item) {
    const content = document.createElement('div');
    content.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

    const errorMsg = document.createElement('div');
    errorMsg.textContent = item.error?.message || 'שגיאה לא ידועה';
    errorMsg.style.cssText =
      'font-family:var(--font-mono); font-size:12px; color:var(--secondary-dark,#bc4749); word-break:break-all;';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:8px;';

    const detailsBtn = this._outlinePillBtn('פרטים נוספים');
    detailsBtn.addEventListener('click', () => this.showFullError(item));

    const deleteBtn = this._dangerPillBtn('מחק');
    deleteBtn.addEventListener('click', () => this.deleteFailedUrl(item.id));

    actions.appendChild(detailsBtn);
    actions.appendChild(deleteBtn);
    content.appendChild(errorMsg);
    content.appendChild(actions);
    return content;
  },

  /** Shared button helpers — inline styles so they work inside scrolling-list shadow DOM */
  _ghostPillBtn(label) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'background:transparent; color:var(--primary-dark); border:1.5px solid var(--primary-dark);' +
      'padding:5px 14px; border-radius:var(--r-pill,999px); font-family:var(--font-ui-he);' +
      'font-size:12px; font-weight:500; cursor:pointer; flex-shrink:0;';
    btn.addEventListener('mouseover', () => {
      btn.style.background = 'rgba(106,153,78,0.08)';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.background = 'transparent';
    });
    return btn;
  },

  _outlinePillBtn(label) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'background:transparent; color:var(--ink-3); border:1.5px solid var(--hairline-strong,rgba(31,29,24,0.15));' +
      'padding:5px 14px; border-radius:var(--r-pill,999px); font-family:var(--font-ui-he);' +
      'font-size:12px; font-weight:500; cursor:pointer; flex-shrink:0;';
    btn.addEventListener('mouseover', () => {
      btn.style.background = 'var(--surface-2,#f0ede6)';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.background = 'transparent';
    });
    return btn;
  },

  _dangerPillBtn(label) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'background:transparent; color:var(--secondary-dark,#bc4749); border:1.5px solid var(--secondary-dark,#bc4749);' +
      'padding:5px 14px; border-radius:var(--r-pill,999px); font-family:var(--font-ui-he);' +
      'font-size:12px; font-weight:500; cursor:pointer; flex-shrink:0;';
    btn.addEventListener('mouseover', () => {
      btn.style.background = 'rgba(188,71,73,0.08)';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.background = 'transparent';
    });
    return btn;
  },

  showFullError(item) {
    const errorText = JSON.stringify(item.error, null, 2);
    // Simple modal for now
    alert(errorText);
  },

  async deleteFailedUrl(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
      try {
        await FirestoreService.deleteDocument('failed_url_extractions', id);
        this.loadFailedUrls(); // Reload list
      } catch (error) {
        this.handleError(error);
      }
    }
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
