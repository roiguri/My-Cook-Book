import { getAuthInstance, getFirestoreInstance } from '../js/services/firebase-service.js';
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', function () {
  // Check if the user is authenticated and has manager privileges
  const auth = getAuthInstance();
  const db = getFirestoreInstance();
  onAuthStateChanged(auth, function (user) {
    const baseUrl = window.location.pathname.includes('My-Cook-Book') ? '/My-Cook-Book/' : '/';
    if (user) {
      checkManagerStatus(db, user).then(function (isManager) {
        if (isManager) {
          initializeDashboard();
        } else {
          window.location.href = baseUrl; // Redirect to home if not a manager
        }
      });
    } else {
      window.location.href = baseUrl; // Redirect to home if not logged in
    }
  });
  const imageApprovalComponent = document.querySelector('image-approval-component');
  imageApprovalComponent.addEventListener('image-approved', handleImageApproved);
  imageApprovalComponent.addEventListener('image-rejected', handleImageRejected);
});

function initializeDashboard() {
  loadUserList();
  loadAllRecipes();
  loadPendingRecipes();
  loadPendingImages();
}

/**
 * User Management
 *  */
function loadUserList() {
  const db = getFirestoreInstance();
  const userList = document.getElementById('user-list');
  getDocs(collection(db, 'users'))
    .then((snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const userItems = users.map((user) => ({
        header: createHeader(user.email),
        content: createContent(user),
      }));
      userList.setItems(userItems);
    })
    .catch(handleError);
}

function createHeader(email) {
  const header = document.createElement('div');
  header.textContent = email;
  return header;
}

function createContent(user) {
  const content = document.createElement('div');
  const select = document.createElement('select');
  select.innerHTML = `
      <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
      <option value="approved" ${user.role === 'approved' ? 'selected' : ''}>approved</option>
      <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
  `;
  const saveButton = document.createElement('button');
  saveButton.textContent = 'שמור';
  saveButton.addEventListener('click', () => updateUserRole(user.id, select.value));

  const space = document.createElement('div');
  space.style.width = '20px';

  content.appendChild(select);
  content.appendChild(space);
  content.appendChild(saveButton);
  return content;
}

function updateUserRole(userId, newRole) {
  const db = getFirestoreInstance();
  const userDocRef = doc(db, 'users', userId);
  updateDoc(userDocRef, { role: newRole })
    .then(() => showSuccessMessage('תפקיד המשתמש עודכן בהצלחה'))
    .catch(handleError);
}

/**
 * All Recipes
 */
function loadAllRecipes() {
  const db = getFirestoreInstance();
  const recipeList = document.getElementById('all-recipes-list');
  recipeList.setItems([]);

  const searchInput = document.getElementById('recipe-search');
  const filterSelect = document.getElementById('recipe-filter');

  let allRecipes = [];

  getDocs(query(collection(db, 'recipes'), where('approved', '==', true)))
    .then((snapshot) => {
      allRecipes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      updateRecipeList(allRecipes);
      populateFilterOptions(allRecipes);
    })
    .catch(handleError);

  searchInput.addEventListener('input', () => filterRecipes(allRecipes));
  filterSelect.addEventListener('change', () => filterRecipes(allRecipes));
}

function updateRecipeList(recipes) {
  const recipeList = document.getElementById('all-recipes-list');
  const recipeItems = recipes.map((recipe) => ({
    header: recipe.name,
    content: createRecipeContent(recipe),
  }));
  recipeList.setItems(recipeItems);
}

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
  Object.entries(categoryMapping).map(([key, value]) => [value, key]),
);

function createRecipeContent(recipe) {
  const container = document.createElement('div');
  container.innerHTML = `
      <p>קטגוריה: ${categoryMapping[recipe.category]}</p>
      <p>זמן הכנה: ${recipe.prepTime + recipe.waitTime} דקות</p>
      <button class="edit-recipe" data-id="${recipe.id}">ערוך</button>
  `;
  container.querySelector('.edit-recipe').addEventListener('click', () => editRecipe(recipe));
  return container;
}

function editRecipe(recipe) {
  const editPreviewContainer = document.querySelector('.edit-preview-container');
  // Open a modal or navigate to an edit page
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
}

function filterRecipes(recipes) {
  const searchTerm = document.getElementById('recipe-search').value.toLowerCase();
  const filterCategory = document.getElementById('recipe-filter').value;

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchTerm) &&
      (filterCategory === '' || recipe.category === reverseCategoryMapping[filterCategory]),
  );

  updateRecipeList(filteredRecipes);
}

function populateFilterOptions(recipes) {
  const filterSelect = document.getElementById('recipe-filter');
  const categories = [...new Set(recipes.map((recipe) => categoryMapping[recipe.category]))];

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filterSelect.appendChild(option);
  });
}

/**
 * Pending Recipes
 */
function loadPendingRecipes() {
  const db = getFirestoreInstance();
  const pendingRecipesList = document.getElementById('pending-recipes-list');
  console.log('loading recipes');
  getDocs(query(collection(db, 'recipes'), where('approved', '==', false)))
    .then((snapshot) => {
      const pendingRecipes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const recipeItems = pendingRecipes.map((recipe) => ({
        header: createPendingRecipeHeader(recipe),
        content: createPendingRecipeContent(recipe),
      }));
      if (recipeItems.length == 0) {
        const pendingRecipeSection = document.getElementById('pending-recipes');
        pendingRecipeSection.querySelector('.no-pending-message').textContent =
          'אין מתכונים הממתינים לאישור';
      }
      // Use the shadowRoot to access the scrolling-list's setItems method
      if (pendingRecipesList) {
        console.log(recipeItems);
        pendingRecipesList.setItems(recipeItems);
        console.log('Items set in scrolling list');
      } else {
        console.error('Cannot find scrolling list element');
      }
    })
    .catch(handleError);
}

function createPendingRecipeHeader(recipe) {
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerHTML = `
    <span>${recipe.name} | ${categoryMapping[recipe.category] || 'No category'}</span>
    <button class="preview-recipe" data-id="${recipe.id}">הצג</button>
  `;

  return header;
}

function createPendingRecipeContent(recipe) {
  const content = document.createElement('div');
  content.textContent = `Full recipe details will be shown in the preview modal.`;
  return content;
}

const pendingRecipeList = document.getElementById('pending-recipes-list');
pendingRecipeList.addEventListener('scrolling-list-ready', () => {
  const shadowRoot = pendingRecipeList.shadowRoot;
  if (shadowRoot) {
    shadowRoot.addEventListener('click', (event) => {
      if (event.target.classList.contains('preview-recipe')) {
        const recipeId = event.target.getAttribute('data-id');
        previewRecipe(recipeId);
      }
    });
  } else {
    console.error('Shadow root not found!');
  }
});

/**
 * Preview Recipe
 */
function previewRecipe(recipeId) {
  console.log(`Preview recipe with id: ${recipeId}`);
  const previewContainer = document.querySelector('.preview-recipe-container');
  previewContainer.innerHTML = `
  <recipe-preview-modal id="recipe-preview" recipe-id="${recipeId}" recipe-name="Delicious Cake" show-buttons="true">
  `;

  customElements.whenDefined('recipe-preview-modal').then(() => {
    const previewRecipeModal = document.querySelector('recipe-preview-modal');
    previewRecipeModal.openModal();

    previewRecipeModal.addEventListener('recipe-approved', (event) => {
      // TODO: Implement user message for successful approval
      console.log('Recipe approved:', event.detail.recipeId);
      // Refresh the recipe dashboards
      loadPendingRecipes();
      loadAllRecipes();
    });

    previewRecipeModal.addEventListener('recipe-rejected', (event) => {
      // TODO: Implement user message for successful rejection
      console.log('Recipe rejected:', event.detail.recipeId);
      // Refresh the recipe dashboards
      setTimeout(() => {
        loadPendingRecipes();
        loadAllRecipes();
      }, 600);
    });
  });
}

/**
 * Pending Images
 */
async function loadPendingImages() {
  const pendingImagesList = document.getElementById('pending-images-list');
  pendingImagesList.setItems([]);

  try {
    const recipesSnapshot = await getDocs(
      query(collection(getFirestoreInstance(), 'recipes'), where('pendingImage', '!=', null)),
    );
    const pendingImages = [];

    // Extract relevant data from each recipe with a pending image
    recipesSnapshot.forEach((doc) => {
      const recipe = doc.data();
      pendingImages.push({
        recipeId: doc.id,
        recipeName: recipe.name,
        imageUrl: recipe.pendingImage.full, // Assuming you want to display the full-size image
      });
    });

    // Create list items for the scrolling list
    const imageItems = pendingImages.map((image) => ({
      header: createPendingImageHeader(image),
      content: createPendingImageContent(image),
    }));

    if (imageItems.length == 0) {
      const pendingRecipeSection = document.getElementById('pending-images');
      pendingRecipeSection.querySelector('.no-pending-message').textContent =
        'אין תמונות הממתינות לאישור';
    }

    // Populate the scrolling list
    if (pendingImagesList) {
      pendingImagesList.setItems(imageItems);
      console.log('Pending images set in scrolling list');
    } else {
      console.error('Cannot find pending images list element');
    }
  } catch (error) {
    handleError(error);
  }
}

function fetchRecipeNames(recipeIds) {
  const db = getFirestoreInstance();
  const promises = recipeIds.map((id) =>
    getDoc(doc(db, 'recipes', id)).then((doc) =>
      doc.exists ? { [id]: doc.data().name } : { [id]: 'Unknown Recipe' },
    ),
  );

  return Promise.all(promises).then((results) => Object.assign({}, ...results));
}

// Update the createPendingImageHeader function
function createPendingImageHeader(image) {
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
  previewButton.addEventListener('click', function (event) {
    event.preventDefault();
    const imageUrl = this.getAttribute('data-url');
    const recipeId = this.getAttribute('data-recipe-id');
    openImageApprovalModal(imageUrl, recipeId, image.recipeName);
  });

  header.appendChild(span);
  header.appendChild(previewButton);

  return header;
}

function createPendingImageContent(image) {
  const content = document.createElement('div');
  content.textContent = `Image preview will be shown in the modal.`;
  return content;
}

/**
 * Preview Image
 */
function openImageApprovalModal(imageUrl, recipeId, recipeName) {
  const imageData = {
    recipeId: recipeId,
    imageUrl: imageUrl,
    recipeName: recipeName,
  };
  const imageApprovalComponent = document.querySelector('image-approval-component');
  imageApprovalComponent.openModalForImage(imageData);
}

function handleImageApproved(event) {
  console.log('Image approved for recipe:', event.detail.recipeId);
  // Refresh both pending images and all recipes lists
  loadPendingImages();
  loadAllRecipes();

  // TODO: Add a user message
}

function handleImageRejected(event) {
  console.log('Image rejected for recipe:', event.detail.recipeId);
  // Only refresh the pending images list
  loadPendingImages();

  // TODO: Add a user message
}

/**
 * Helper functions
 */
function showSuccessMessage(message) {
  alert(message); // Replace with a more user-friendly notification system
}

function handleError(error) {
  console.error('Error:', error);
  alert('אירעה שגיאה. אנא נסה שנית.'); // Replace with a more user-friendly error handling system
}

function checkManagerStatus(db, user) {
  const userDocRef = doc(db, 'users', user.uid);
  return getDoc(userDocRef).then((docSnap) => {
    if (docSnap.exists()) {
      return docSnap.data().role === 'manager';
    }
    return false;
  });
}
