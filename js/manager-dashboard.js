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
  loadPendingRecipes();
  loadPendingImages();
}

function loadUserList() {
  const userList = document.getElementById('user-list');
  db.collection('users').get().then((snapshot) => {
      userList.innerHTML = '';
      snapshot.forEach((doc) => {
          const userData = doc.data();
          const userElement = document.createElement('div');
          userElement.classList.add('user-item');
          userElement.innerHTML = `
              <span>${userData.email}</span>
              <select data-user-id="${doc.id}">
                  <option value="user" ${userData.role === 'user' ? 'selected' : ''}>User</option>
                  <option value="manager" ${userData.role === 'manager' ? 'selected' : ''}>Manager</option>
              </select>
          `;
          userList.appendChild(userElement);
      });
  });

  userList.addEventListener('change', function(event) {
      if (event.target.tagName === 'SELECT') {
          const userId = event.target.getAttribute('data-user-id');
          const newRole = event.target.value;
          updateUserRole(userId, newRole);
      }
  });
}

function updateUserRole(userId, newRole) {
  db.collection('users').doc(userId).update({
      role: newRole
  }).then(() => {
      console.log('User role updated successfully');
  }).catch((error) => {
      console.error('Error updating user role:', error);
  });
}

function loadPendingRecipes() {
  const pendingRecipes = document.getElementById('pending-recipes');
  db.collection('recipes').where('approved', '==', false).get().then((snapshot) => {
      pendingRecipes.innerHTML = '';
      snapshot.forEach((doc) => {
          const recipeData = doc.data();
          const recipeElement = document.createElement('div');
          recipeElement.classList.add('recipe-item');
          recipeElement.innerHTML = `
              <h3>${recipeData.name}</h3>
              <button class="approve-recipe" data-recipe-id="${doc.id}">Approve</button>
              <button class="reject-recipe" data-recipe-id="${doc.id}">Reject</button>
          `;
          pendingRecipes.appendChild(recipeElement);
      });
  });

  pendingRecipes.addEventListener('click', function(event) {
      if (event.target.classList.contains('approve-recipe')) {
          const recipeId = event.target.getAttribute('data-recipe-id');
          approveRecipe(recipeId);
      } else if (event.target.classList.contains('reject-recipe')) {
          const recipeId = event.target.getAttribute('data-recipe-id');
          rejectRecipe(recipeId);
      }
  });
}

function approveRecipe(recipeId) {
  db.collection('recipes').doc(recipeId).update({
      approved: true
  }).then(() => {
      console.log('Recipe approved successfully');
      loadPendingRecipes(); // Reload the pending recipes list
  }).catch((error) => {
      console.error('Error approving recipe:', error);
  });
}

function rejectRecipe(recipeId) {
  db.collection('recipes').doc(recipeId).delete().then(() => {
      console.log('Recipe rejected and deleted successfully');
      loadPendingRecipes(); // Reload the pending recipes list
  }).catch((error) => {
      console.error('Error rejecting recipe:', error);
  });
}

function loadPendingImages() {
  const pendingImages = document.getElementById('pending-images');
  const storageRef = firebase.storage().ref('pendingImages');
  
  storageRef.listAll().then((result) => {
      pendingImages.innerHTML = '';
      result.items.forEach((imageRef) => {
          imageRef.getDownloadURL().then((url) => {
              const imageElement = document.createElement('div');
              imageElement.classList.add('image-item');
              imageElement.innerHTML = `
                  <img src="${url}" alt="Pending image">
                  <button class="approve-image" data-image-path="${imageRef.fullPath}">Approve</button>
                  <button class="reject-image" data-image-path="${imageRef.fullPath}">Reject</button>
              `;
              pendingImages.appendChild(imageElement);
          });
      });
  });

  pendingImages.addEventListener('click', function(event) {
      if (event.target.classList.contains('approve-image')) {
          const imagePath = event.target.getAttribute('data-image-path');
          approveImage(imagePath);
      } else if (event.target.classList.contains('reject-image')) {
          const imagePath = event.target.getAttribute('data-image-path');
          rejectImage(imagePath);
      }
  });
}

function approveImage(imagePath) {
  // Implement image approval logic here
  console.log('Approving image:', imagePath);
  // Move the image to the appropriate folder and update the database
}

function rejectImage(imagePath) {
  // Implement image rejection logic here
  console.log('Rejecting image:', imagePath);
  // Delete the image from storage
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