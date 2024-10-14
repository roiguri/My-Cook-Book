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
  // loadPendingImages();
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
 * Pending
 */
function loadPendingRecipes() {
  const recipeList = document.getElementById('all-recipes-list');

  let allRecipes = [];

  db.collection('recipes').where('approved', '==', false).get().then((snapshot) => {
      allRecipes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      
      updatePendingRecipeList(allRecipes);
  }).catch(handleError);
}

function updatePendingRecipeList(recipes) {
  const recipeList = document.getElementById('pending-recipes-list');
  const recipeItems = recipes.map(recipe => ({
      header: recipe.name,
      content: createPendingRecipeHeader(recipe)
  }));
  console.log("start pending");
  recipeList.setItems(recipeItems);
}

function loadPendingImages() {

}

function createPendingRecipeHeader(recipe) {
  const container = document.createElement('div');
  container.innerHTML = `
      שם: ${recipe.name}
      <button class="preview-recipe" data-id="${recipe.id}">הצג</button>
  `;
  container.querySelector('.preview-recipe').addEventListener('click', () => previewImage('להציג', () => previewImage(recipe.id)));
  return container;
}

function createPendingImageHeader() {

}

/**
 * Pending Recipes
 */
/*
function loadPendingRecipes() {
  const pendingRecipesList = document.getElementById('pending-recipes-list');
  db.collection('recipes').where('approved', '==', false).get().then((snapshot) => {
      const pendingRecipes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      
      const recipeItems = pendingRecipes.map(recipe => ({
          header: recipe.name,
          content: createPendingRecipeContent(recipe)
      }));

      pendingRecipesList.setItems(recipeItems);
  }).catch(handleError);
}

function createPendingRecipeContent(recipe) {
  const container = document.createElement('div');
  container.innerHTML = `
      <p>קטגוריה: ${recipe.category}</p>
      <p>זמן הכנה: ${recipe.cookingTime} דקות</p>
      <button class="approve-recipe" data-id="${recipe.id}">אשר</button>
      <button class="reject-recipe" data-id="${recipe.id}">דחה</button>
  `;
  container.querySelector('.approve-recipe').addEventListener('click', () => confirmAction('לאשר', () => approveRecipe(recipe.id)));
  container.querySelector('.reject-recipe').addEventListener('click', () => confirmAction('לדחות', () => rejectRecipe(recipe.id)));
  return container;
}

function approveRecipe(recipeId) {
  db.collection('recipes').doc(recipeId).update({ approved: true })
      .then(() => {
          showSuccessMessage('המתכון אושר בהצלחה');
          loadPendingRecipes();
      })
      .catch(handleError);
}

function rejectRecipe(recipeId) {
  db.collection('recipes').doc(recipeId).delete()
      .then(() => {
          showSuccessMessage('המתכון נדחה ונמחק בהצלחה');
          loadPendingRecipes();
      })
      .catch(handleError);
}
*/

/**
 * Pending Images
 */
/*
function loadPendingImages() {
  const pendingImagesList = document.getElementById('pending-images-list');
  const storageRef = firebase.storage().ref('pendingImages');
  
  storageRef.listAll().then((result) => {
      Promise.all(result.items.map(imageRef => 
          imageRef.getDownloadURL().then(url => ({ ref: imageRef, url }))
      )).then(images => {
          const imageItems = images.map(image => ({
              header: image.ref.name,
              content: createPendingImageContent(image)
          }));
          pendingImagesList.setItems(imageItems);
      });
  }).catch(handleError);
}

function createPendingImageContent(image) {
  const container = document.createElement('div');
  container.innerHTML = `
      <img src="${image.url}" alt="Pending image" style="max-width: 200px; max-height: 200px;">
      <button class="approve-image" data-path="${image.ref.fullPath}">אשר</button>
      <button class="reject-image" data-path="${image.ref.fullPath}">דחה</button>
  `;
  container.querySelector('.approve-image').addEventListener('click', () => confirmAction('לאשר', () => approveImage(image.ref.fullPath)));
  container.querySelector('.reject-image').addEventListener('click', () => confirmAction('לדחות', () => rejectImage(image.ref.fullPath)));
  return container;
}

function approveImage(imagePath) {
  // Implement image approval logic here
  console.log('Approving image:', imagePath);
  // Move the image to the appropriate folder and update the database
  showSuccessMessage('התמונה אושרה בהצלחה');
  loadPendingImages();
}

function rejectImage(imagePath) {
  // Implement image rejection logic here
  console.log('Rejecting image:', imagePath);
  // Delete the image from storage
  showSuccessMessage('התמונה נדחתה ונמחקה בהצלחה');
  loadPendingImages();
}

function confirmAction(action, callback) {
  if (confirm(`האם אתה בטוח שברצונך ${action} פריט זה?`)) {
      callback();
  }
}
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