// manager-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
  // Check if the user is authenticated and has manager privileges
  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
          checkManagerStatus(user).then(function(isManager) {
              if (isManager) {
                  initializeDashboard();
              } else {
                  window.location.href = '/'; // Redirect to home if not a manager
              }
          });
      } else {
          window.location.href = '/'; // Redirect to home if not logged in
      }
  });

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
  const userList = document.getElementById('user-list');
  
  db.collection('users').get().then((snapshot) => {
      const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      
      const userItems = users.map(user => ({
          header: createHeader(user.email),
          content: createContent(user)
      }));

      userList.setItems(userItems);
  }).catch(handleError);
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
      <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
  `;
  const saveButton = document.createElement('button');
  saveButton.textContent = 'שמור';
  saveButton.addEventListener('click', () => updateUserRole(user.id, select.value));
  
  content.appendChild(select);
  content.appendChild(saveButton);
  return content;
}

function updateUserRole(userId, newRole) {
  db.collection('users').doc(userId).update({ role: newRole })
      .then(() => showSuccessMessage('תפקיד המשתמש עודכן בהצלחה'))
      .catch(handleError);
}


/**
 * All Recipes
 */
function loadAllRecipes() {
  const recipeList = document.getElementById('all-recipes-list');
  const searchInput = document.getElementById('recipe-search');
  const filterSelect = document.getElementById('recipe-filter');

  let allRecipes = [];

  db.collection('recipes').where('approved', '==', true).get().then((snapshot) => {
      allRecipes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      
      updateRecipeList(allRecipes);
      populateFilterOptions(allRecipes);
  }).catch(handleError);

  searchInput.addEventListener('input', () => filterRecipes(allRecipes));
  filterSelect.addEventListener('change', () => filterRecipes(allRecipes));
}

function updateRecipeList(recipes) {
  const recipeList = document.getElementById('all-recipes-list');
  const recipeItems = recipes.map(recipe => ({
      header: recipe.name,
      content: createRecipeContent(recipe)
  }));
  recipeList.setItems(recipeItems);
}

function createRecipeContent(recipe) {
  const container = document.createElement('div');
  container.innerHTML = `
      <p>קטגוריה: ${recipe.category}</p>
      <p>זמן הכנה: ${recipe.cookingTime} דקות</p>
      <button class="edit-recipe" data-id="${recipe.id}">ערוך</button>
  `;
  container.querySelector('.edit-recipe').addEventListener('click', () => editRecipe(recipe));
  return container;
}

function editRecipe(recipe) {
  // Implement recipe editing logic here
  console.log('Editing recipe:', recipe.id);
  // Open a modal or navigate to an edit page
}

function filterRecipes(recipes) {
  const searchTerm = document.getElementById('recipe-search').value.toLowerCase();
  const filterCategory = document.getElementById('recipe-filter').value;

  const filteredRecipes = recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchTerm) &&
      (filterCategory === '' || recipe.category === filterCategory)
  );

  updateRecipeList(filteredRecipes);
}

function populateFilterOptions(recipes) {
  const filterSelect = document.getElementById('recipe-filter');
  const categories = [...new Set(recipes.map(recipe => recipe.category))];
  
  categories.forEach(category => {
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
  const pendingRecipesList = document.getElementById('pending-recipes-list');
  console.log("loading recipes");
  db.collection('recipes').where('approved', '==', false).get().then((snapshot) => {
    const pendingRecipes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const recipeItems = pendingRecipes.map(recipe => ({
      header: createPendingRecipeHeader(recipe),
      content: createPendingRecipeContent(recipe)
    }));
    // Use the shadowRoot to access the scrolling-list's setItems method
    if (pendingRecipesList) {
      console.log(recipeItems);
    pendingRecipesList.setItems(recipeItems);
      console.log("Items set in scrolling list");
    } else {
      console.error("Cannot find scrolling list element");
    }
  }).catch(handleError);
}

function createPendingRecipeHeader(recipe) {
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.innerHTML = `
    <span>${recipe.name} | ${recipe.category || 'No category'}</span>
    <button class="preview-recipe" data-id="${recipe.id}">הצג</button>
  `;
  return header;
}

function createPendingRecipeContent(recipe) {
  const content = document.createElement('div');
  content.textContent = `Full recipe details will be shown in the preview modal.`;
  return content;
}

document.addEventListener('click', function(event) {
  if (event.target.classList.contains('preview-recipe')) {
    const recipeId = event.target.getAttribute('data-id');
    previewRecipe(recipeId);
  }
});

function previewRecipe(recipeId) {
  console.log(`Preview recipe with id: ${recipeId}`);
  // We'll implement the preview modal later
}

/**
 * Pending Images 
 */
function loadPendingImages() {
  const pendingImagesList = document.getElementById('pending-images-list');
  const storage = firebase.storage();
  const pendingImagesRef = storage.ref('pendingImages');

  pendingImagesRef.listAll()
    .then((res) => {
      const imagePromises = res.items.map(imageRef => {
        return imageRef.getDownloadURL().then(url => {
          return { name: imageRef.name, url: url };
        });
      });

      return Promise.all(imagePromises);
    })
    .then((images) => {
      // Fetch recipe names for all images
      const recipeIds = images.map(image => image.name.split('.')[0]);
      return Promise.all([
        images,
        fetchRecipeNames(recipeIds)
      ]);
    })
    .then(([images, recipeNames]) => {
      const imageItems = images.map(image => {
        const recipeId = image.name.split('.')[0];
        const recipeName = recipeNames[recipeId] || 'Unknown Recipe';
        return {
          header: createPendingImageHeader(image, recipeName),
          content: createPendingImageContent(image)
        };
      });

      if (pendingImagesList) {
        pendingImagesList.setItems(imageItems);
        console.log("Pending images set in scrolling list");
      } else {
        console.error("Cannot find pending images list element");
      }
    })
    .catch(handleError);
}

function fetchRecipeNames(recipeIds) {
  const db = firebase.firestore();
  const promises = recipeIds.map(id => 
    db.collection('recipes').doc(id).get()
      .then(doc => doc.exists ? { [id]: doc.data().name } : { [id]: 'Unknown Recipe' })
  );

  return Promise.all(promises)
    .then(results => Object.assign({}, ...results));
}

// Update the createPendingImageHeader function
function createPendingImageHeader(image, recipeName) {
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  
  const span = document.createElement('span');
  span.innerHTML = `${recipeName}`;

  const previewButton = document.createElement('button');
  previewButton.classList.add("preview-image");
  previewButton.setAttribute('data-url', `${image.url}`);
  previewButton.setAttribute('data-recipe-id', `${image.name.split('.')[0]}`);
  previewButton.textContent = 'הצג';
  previewButton.addEventListener('click', function(event) {
    event.preventDefault();
    const imageUrl = this.getAttribute('data-url');
    const recipeId = this.getAttribute('data-recipe-id');
    openImageApprovalModal(imageUrl, recipeId, recipeName);
  })

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
    recipeName: recipeName
  };
  const imageApprovalComponent = document.querySelector('image-approval-component');
  imageApprovalComponent.openModalForImage(imageData);
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
// Add this function to your auth.js file if it's not already there
function checkManagerStatus(user) {
  return db.collection('users').doc(user.uid).get().then((doc) => {
      if (doc.exists) {
          return doc.data().role === 'manager';
      }
      return false;
  });
}