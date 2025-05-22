import { FirestoreService } from '../services/firestore-service.js'; // Adjusted path
import authService from '../services/auth-service.js'; // Adjusted path

// Module-scoped variables for auth, elements, and handlers
let authUnsubscribe = null;
let imageApprovalComponent = null;
let imageApprovedHandler = null;
let imageRejectedHandler = null;

let pendingRecipeListElement = null; // Store the element itself
let pendingRecipeListShadowClickHandler = null; // Store the handler for shadow DOM clicks

// Category mapping (can remain module-scoped constants)
const categoryMapping = {
  appetizers: 'מנות ראשונות',
  'main-courses': 'מנות עיקריות',
  'side-dishes': 'תוספות',
  'soups-stews': 'מרקים ותבשילים',
  salads: 'סלטים',
  'breakfast-brunch': 'ארוחות בוקר',
  snacks: 'חטיפים',
  beverages: 'משקאות',
  desserts: 'קינוחים',
};
const reverseCategoryMapping = Object.fromEntries(
  Object.entries(categoryMapping).map(([key, value]) => [value, key])
);

async function checkManagerStatus(user) {
  if (!user || !user.uid) return false;
  try {
    const userDoc = await FirestoreService.getDocument('users', user.uid);
    return userDoc && userDoc.role === 'manager';
  } catch (error) {
    console.error("Error checking manager status:", error);
    return false;
  }
}

function showSuccessMessage(message, contentElement) {
  // TODO: Implement a better notification system within contentElement
  console.log("Success:", message);
  alert(message); 
}

function handleError(error, contentElement) {
  console.error('Error:', error);
  // TODO: Implement a better error display within contentElement
  alert('אירעה שגיאה. אנא נסה שנית.');
}


function initializeDashboard(contentElement) {
  console.log("Initializing manager dashboard content...");
  loadUserList(contentElement);
  loadAllRecipes(contentElement);
  loadPendingRecipes(contentElement);
  loadPendingImages(contentElement);

  // Setup listeners for image-approval-component
  imageApprovalComponent = contentElement.querySelector('image-approval-component');
  if (imageApprovalComponent) {
    imageApprovedHandler = (event) => handleImageApproved(event, contentElement);
    imageRejectedHandler = (event) => handleImageRejected(event, contentElement);
    imageApprovalComponent.addEventListener('image-approved', imageApprovedHandler);
    imageApprovalComponent.addEventListener('image-rejected', imageRejectedHandler);
  } else {
    console.warn('image-approval-component not found in contentElement.');
  }
}

// User Management
async function loadUserList(contentElement) {
  try {
    const users = await FirestoreService.queryDocuments('users');
    const userList = contentElement.querySelector('#user-list');
    if (!userList) {
        console.error('#user-list element not found.');
        return;
    }
    const userItems = users.map((user) => ({
      header: createHeader(user.email),
      content: createContent(user, contentElement), // Pass contentElement for potential error/success messages
    }));
    userList.setItems(userItems);
  } catch (error) {
    handleError(error, contentElement);
  }
}

function createHeader(email) {
  const header = document.createElement('div');
  header.textContent = email;
  return header;
}

function createContent(user, contentElement) {
  const content = document.createElement('div');
  const select = document.createElement('select');
  select.innerHTML = `
      <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
      <option value="approved" ${user.role === 'approved' ? 'selected' : ''}>approved</option>
      <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
  `;
  const saveButton = document.createElement('button');
  saveButton.textContent = 'שמור';
  saveButton.addEventListener('click', () => updateUserRole(user.id, select.value, contentElement));

  const space = document.createElement('div');
  space.style.width = '20px';

  content.appendChild(select);
  content.appendChild(space);
  content.appendChild(saveButton);
  return content;
}

async function updateUserRole(userId, newRole, contentElement) {
  try {
    await FirestoreService.updateDocument('users', userId, { role: newRole });
    showSuccessMessage('תפקיד המשתמש עודכן בהצלחה', contentElement);
  } catch (error) {
    handleError(error, contentElement);
  }
}

// All Recipes
async function loadAllRecipes(contentElement) {
  const recipeList = contentElement.querySelector('#all-recipes-list');
  const searchInput = contentElement.querySelector('#recipe-search');
  const filterSelect = contentElement.querySelector('#recipe-filter');
  
  if (!recipeList || !searchInput || !filterSelect) {
      console.error('Missing one or more elements for "All Recipes" section.');
      return;
  }
  recipeList.setItems([]); // Clear previous items

  try {
    const recipes = await FirestoreService.queryDocuments('recipes', { where: [['approved', '==', true]] });
    let allRecipes = recipes; // Store for filtering
    updateRecipeList(allRecipes, contentElement);
    populateFilterOptions(allRecipes, contentElement);

    // Remove old listeners if any (though DOM replacement should handle this)
    // Then add new ones to avoid multiple bindings if element isn't fully replaced
    searchInput.oninput = () => filterRecipes(allRecipes, contentElement); // Use oninput to simplify listener management for this
    filterSelect.onchange = () => filterRecipes(allRecipes, contentElement); // Use onchange
  } catch (error) {
    handleError(error, contentElement);
  }
}

function updateRecipeList(recipes, contentElement) {
  const recipeList = contentElement.querySelector('#all-recipes-list');
  if (!recipeList) return;
  const recipeItems = recipes.map((recipe) => ({
    header: recipe.name,
    content: createRecipeContent(recipe, contentElement),
  }));
  recipeList.setItems(recipeItems);
}

function createRecipeContent(recipe, contentElement) {
  const container = document.createElement('div');
  container.innerHTML = `
      <p>קטגוריה: ${categoryMapping[recipe.category] || recipe.category}</p>
      <p>זמן הכנה: ${recipe.prepTime + recipe.waitTime} דקות</p>
      <button class="edit-recipe" data-id="${recipe.id}">ערוך</button>
  `;
  container.querySelector('.edit-recipe').addEventListener('click', () => editRecipe(recipe, contentElement));
  return container;
}

function editRecipe(recipe, contentElement) {
  const editPreviewContainer = contentElement.querySelector('.edit-preview-container');
  if (!editPreviewContainer) {
      console.error('.edit-preview-container not found.');
      return;
  }
  editPreviewContainer.innerHTML = ''; // Clear previous
  const editComponent = document.createElement('edit-preview-recipe');
  editComponent.setAttribute('path-to-icon', '/img/icon/other/'); // Make sure this path is correct for SPA
  editComponent.setAttribute('recipe-id', recipe.id);
  editComponent.setAttribute('start-mode', 'edit');
  editPreviewContainer.appendChild(editComponent);
  
  // Custom elements might need a slight delay or specific method to open modal
  customElements.whenDefined('edit-preview-recipe').then(() => {
    if (typeof editComponent.openModal === 'function') {
        editComponent.openModal();
    } else {
        console.warn('edit-preview-recipe does not have an openModal method.');
    }
  });
}

function filterRecipes(allRecipes, contentElement) {
  const searchTerm = contentElement.querySelector('#recipe-search').value.toLowerCase();
  const filterValue = contentElement.querySelector('#recipe-filter').value; // This is the display name
  const filterCategoryKey = reverseCategoryMapping[filterValue] || filterValue; // Convert display name to key if needed

  const filteredRecipes = allRecipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchTerm) &&
      (filterValue === '' || recipe.category === filterCategoryKey),
  );
  updateRecipeList(filteredRecipes, contentElement);
}

function populateFilterOptions(recipes, contentElement) {
  const filterSelect = contentElement.querySelector('#recipe-filter');
  if (!filterSelect) return;
  filterSelect.innerHTML = '<option value="">כל הקטגוריות</option>'; // Reset options
  const categories = [...new Set(recipes.map((recipe) => categoryMapping[recipe.category]))].filter(Boolean);

  categories.forEach((categoryDisplayName) => {
    const option = document.createElement('option');
    option.value = categoryDisplayName; // Use display name for value, convert back in filter
    option.textContent = categoryDisplayName;
    filterSelect.appendChild(option);
  });
}

// Pending Recipes
async function loadPendingRecipes(contentElement) {
  pendingRecipeListElement = contentElement.querySelector('#pending-recipes-list');
  const noPendingMessageElement = contentElement.querySelector('#pending-recipes .no-pending-message');

  if (!pendingRecipeListElement || !noPendingMessageElement) {
      console.error('Missing elements for "Pending Recipes" section.');
      return;
  }

  try {
    const pendingRecipes = await FirestoreService.queryDocuments('recipes', { where: [['approved', '==', false]] });
    const recipeItems = pendingRecipes.map((recipe) => ({
      header: createPendingRecipeHeader(recipe),
      content: createPendingRecipeContent(recipe), // Content can be minimal or show key details
    }));
    
    noPendingMessageElement.textContent = recipeItems.length === 0 ? 'אין מתכונים הממתינים לאישור' : '';
    pendingRecipeListElement.setItems(recipeItems);

    // Listener for preview clicks within shadow DOM
    // Remove previous if exists, then add new one
    if (pendingRecipeListElement.shadowRoot && pendingRecipeListShadowClickHandler) {
        pendingRecipeListElement.shadowRoot.removeEventListener('click', pendingRecipeListShadowClickHandler);
    }
    pendingRecipeListShadowClickHandler = (event) => {
      if (event.target.classList.contains('preview-recipe')) {
        const recipeId = event.target.getAttribute('data-id');
        previewRecipe(recipeId, contentElement);
      }
    };
    // The 'scrolling-list-ready' event might only fire once when the component is first defined or upgraded.
    // If the list is reloaded, we might need to attach directly if shadowRoot is available.
    if (pendingRecipeListElement.shadowRoot) {
        pendingRecipeListElement.shadowRoot.addEventListener('click', pendingRecipeListShadowClickHandler);
    } else {
        // Fallback or if 'scrolling-list-ready' is needed
        pendingRecipeListElement.addEventListener('scrolling-list-ready', function handler() {
            this.removeEventListener('scrolling-list-ready', handler); // Self-remove
            if (this.shadowRoot) {
                this.shadowRoot.addEventListener('click', pendingRecipeListShadowClickHandler);
            }
        });
    }

  } catch (error) {
    handleError(error, contentElement);
    noPendingMessageElement.textContent = 'שגיאה בטעינת מתכונים ממתינים.';
  }
}

function createPendingRecipeHeader(recipe) {
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerHTML = `
    <span>${recipe.name} | ${categoryMapping[recipe.category] || recipe.category || 'No category'}</span>
    <button class="preview-recipe" data-id="${recipe.id}">הצג</button>
  `;
  return header;
}

function createPendingRecipeContent(recipe) {
  const content = document.createElement('div');
  // Example: content.textContent = `Submitted by: ${recipe.submittedBy || 'Unknown'}`;
  content.textContent = `פרטי המתכון המלאים יוצגו בחלון התצוגה המקדימה.`;
  return content;
}

function previewRecipe(recipeId, contentElement) {
  const previewContainer = contentElement.querySelector('.preview-recipe-container');
  if(!previewContainer) {
      console.error('.preview-recipe-container not found for recipe preview.');
      return;
  }
  previewContainer.innerHTML = ''; // Clear previous
  const previewModal = document.createElement('recipe-preview-modal');
  previewModal.id = "recipe-preview"; // If needed for styling or direct selection
  previewModal.setAttribute('recipe-id', recipeId);
  // recipe-name might be dynamic if you fetch it first, or component handles it
  previewModal.setAttribute('show-buttons', 'true');
  previewContainer.appendChild(previewModal);

  customElements.whenDefined('recipe-preview-modal').then(() => {
    if (typeof previewModal.openModal === 'function') {
      previewModal.openModal();
      // Add listeners for approval/rejection events from this modal instance
      // These listeners should be specific to *this* modal instance if possible,
      // or manage them carefully if they are general.
      const approvalHandler = (event) => {
        console.log('Recipe approved:', event.detail.recipeId);
        loadPendingRecipes(contentElement);
        loadAllRecipes(contentElement);
        previewModal.removeEventListener('recipe-approved', approvalHandler); // Clean up self
      };
      const rejectionHandler = (event) => {
        console.log('Recipe rejected:', event.detail.recipeId);
        setTimeout(() => { // Delay as in original code
          loadPendingRecipes(contentElement);
          loadAllRecipes(contentElement);
        }, 600);
        previewModal.removeEventListener('recipe-rejected', rejectionHandler); // Clean up self
      };
      previewModal.addEventListener('recipe-approved', approvalHandler);
      previewModal.addEventListener('recipe-rejected', rejectionHandler);

    } else {
        console.warn('recipe-preview-modal or its openModal method not found.');
    }
  });
}

// Pending Images
async function loadPendingImages(contentElement) {
  const pendingImagesList = contentElement.querySelector('#pending-images-list');
  const noPendingMsg = contentElement.querySelector('#pending-images .no-pending-message');
  if (!pendingImagesList || !noPendingMsg) {
      console.error('Missing elements for "Pending Images" section.');
      return;
  }
  pendingImagesList.setItems([]); // Clear previous

  try {
    const pendingRecipes = await FirestoreService.queryDocuments('recipes', { where: [['pendingImage', '!=', null]] });
    const pendingImages = pendingRecipes
        .filter(recipe => recipe.pendingImage && recipe.pendingImage.full) // Ensure pendingImage and its 'full' property exist
        .map((recipe) => ({
            recipeId: recipe.id,
            recipeName: recipe.name,
            imageUrl: recipe.pendingImage.full,
        }));
    
    const imageItems = pendingImages.map((image) => ({
      header: createPendingImageHeader(image, contentElement), // Pass contentElement
      content: createPendingImageContent(image),
    }));
    
    noPendingMsg.textContent = imageItems.length === 0 ? 'אין תמונות הממתינות לאישור' : '';
    pendingImagesList.setItems(imageItems);

  } catch (error) {
    handleError(error, contentElement);
    noPendingMsg.textContent = 'שגיאה בטעינת תמונות ממתינות.';
  }
}

function createPendingImageHeader(image, contentElement) {
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const span = document.createElement('span');
  span.innerHTML = `${image.recipeName}`;

  const previewButton = document.createElement('button');
  previewButton.classList.add('preview-image'); // For potential styling or general query
  previewButton.textContent = 'הצג';
  previewButton.addEventListener('click', function () { // No arrow function to use 'this' if needed, but not here.
    openImageApprovalModal(image.imageUrl, image.recipeId, image.recipeName, contentElement);
  });

  header.appendChild(span);
  header.appendChild(previewButton);
  return header;
}

function createPendingImageContent(image) {
  const content = document.createElement('div');
  content.textContent = `תצוגה מקדימה של התמונה תוצג בחלון האישור.`;
  return content;
}

function openImageApprovalModal(imageUrl, recipeId, recipeName, contentElement) {
  const imageData = { recipeId, imageUrl, recipeName };
  // imageApprovalComponent is already queried and stored at init
  if (imageApprovalComponent && typeof imageApprovalComponent.openModalForImage === 'function') {
    imageApprovalComponent.openModalForImage(imageData);
  } else {
    console.error('image-approval-component not found or missing openModalForImage method.');
    handleError({ message: "Image approval component not available." }, contentElement);
  }
}

function handleImageApproved(event, contentElement) {
  console.log('Image approved for recipe:', event.detail.recipeId);
  loadPendingImages(contentElement);
  loadAllRecipes(contentElement); // To reflect new image if it's for an existing recipe
  showSuccessMessage('התמונה אושרה והתעדכנה בהצלחה.', contentElement);
}

function handleImageRejected(event, contentElement) {
  console.log('Image rejected for recipe:', event.detail.recipeId);
  loadPendingImages(contentElement);
  showSuccessMessage('התמונה נדחתה והוסרה מהמתכון.', contentElement);
}


export function initManagerDashboardPage(contentElement) {
  console.log('Initializing Manager Dashboard Page...');
  if (authUnsubscribe) {
    authUnsubscribe(); // Clean up previous observer
  }
  authUnsubscribe = authService.addAuthObserver(async (state) => {
    if (state.user) {
      const isManager = await checkManagerStatus(state.user);
      if (isManager) {
        initializeDashboard(contentElement);
      } else {
        console.log('User is not a manager. Redirecting to home.');
        window.location.hash = '#/';
      }
    } else {
      console.log('User not logged in. Redirecting to home.');
      window.location.hash = '#/';
    }
  });
}

export function cleanupManagerDashboardPage(contentElement) {
  console.log('Cleaning up Manager Dashboard Page...');
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
    console.log('Auth observer removed.');
  }

  if (imageApprovalComponent) {
    if (imageApprovedHandler) {
      imageApprovalComponent.removeEventListener('image-approved', imageApprovedHandler);
      imageApprovedHandler = null;
    }
    if (imageRejectedHandler) {
      imageApprovalComponent.removeEventListener('image-rejected', imageRejectedHandler);
      imageRejectedHandler = null;
    }
    imageApprovalComponent = null; // Nullify the component reference
    console.log('Image approval component listeners removed.');
  }

  if (pendingRecipeListElement && pendingRecipeListElement.shadowRoot && pendingRecipeListShadowClickHandler) {
    pendingRecipeListElement.shadowRoot.removeEventListener('click', pendingRecipeListShadowClickHandler);
    console.log('Pending recipe list shadow DOM click listener removed.');
  }
  pendingRecipeListElement = null;
  pendingRecipeListShadowClickHandler = null;
  
  // Nullify other DOM element references if they were stored globally/module-scoped
  // For elements like searchInput, filterSelect in loadAllRecipes, if they were module-scoped:
  // searchInput = null; filterSelect = null;
  // However, the current structure attaches listeners directly or uses .oninput/.onchange,
  // which are cleaned up when contentElement.innerHTML is cleared by the router's page loader.

  console.log('Manager Dashboard cleanup finished.');
}
