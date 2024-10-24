// documents.js

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication first
  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
          checkUserAccess(user);
      } else {
          showError('יש להתחבר כדי לצפות במסמך זה');
          redirectToHome();
      }
  });
});

// Check if user has access
async function checkUserAccess(user) {
  try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
          showError('משתמש לא נמצא');
          return;
      }

      const userRole = userDoc.data().role;
      if (userRole === 'approved' || userRole === 'manager') {
          await initializeSearch(); // Initialize search first
          loadPDF();
      } else {
          showError('אין לך הרשאה לצפות במסמך זה');
      }
  } catch (error) {
      console.error('Error checking user access:', error);
      showError('אירעה שגיאה בבדיקת ההרשאות');
  }
}

// Initialize search functionality
async function initializeSearch() {
  try {
      // Create search container with category selector
      const searchContainer = document.querySelector(".recipe-search")

      // Insert search before the PDF viewer
      const pdfViewer = document.getElementById('pdf-viewer');
      pdfViewer.insertBefore(searchContainer, pdfViewer.firstChild);

      // Get recipes data from Firebase
      const recipesDoc = await db.collection('cookbook').doc('recipes').get();
      const recipesData = recipesDoc.data();

      if (!recipesData) {
          console.error('No recipes data found');
          return;
      }

      const allRecipes = recipesData.recipes;
      const categories = recipesData.categories;

      // Setup category change handler
      const categorySelect = document.getElementById('category-select');
      const recipeList = document.getElementById('recipe-list');
      const searchInput = document.getElementById('recipe-search');

      categorySelect.addEventListener('change', () => {
          updateRecipeList(categorySelect.value);
      });

      function updateRecipeList(category) {
          recipeList.innerHTML = '';
          searchInput.value = '';

          let filteredRecipes = allRecipes;
          if (category !== 'all') {
              const range = categories[category];
              filteredRecipes = Object.entries(allRecipes)
                  .filter(([_, page]) => page >= range.startPage && page <= range.endPage)
                  .reduce((acc, [name, page]) => {
                      acc[name] = page;
                      return acc;
                  }, {});
          }

          Object.keys(filteredRecipes).forEach(recipeName => {
              const option = document.createElement('option');
              option.value = recipeName;
              recipeList.appendChild(option);
          });
      }

      // Initial population of recipe list
      updateRecipeList('all');

      // Add search functionality
      const searchButton = document.getElementById('search-button');

      async function performSearch() {
        try {
              const searchTerm = searchInput.value.trim();
              
              if (!searchTerm) {
                  return;
              }

              const page = allRecipes[searchTerm];
              
              if (page) {
                  const iframe = document.getElementById('pdf-iframe');
                  // Store the base URL without hash
                  let baseUrl = iframe.src;
                  if (baseUrl.includes('#')) {
                      baseUrl = baseUrl.split('#')[0];
                  }
                  
                  // Force reload with new page number

                  const newIframe = document.createElement('iframe');
                  newIframe.id = 'pdf-iframe';
                  newIframe.style.display = 'block';
                  newIframe.src = baseUrl + '#page=' + page + '&view=FitH&pagemode=none&toolbar=0';
                  iframe.parentNode.replaceChild(newIframe, iframe);
                  
              } else {
                  alert('מתכון לא נמצא');
              }
          } catch (error) {
              console.error('Error performing search:', error);
              alert('אירעה שגיאה בחיפוש');
          }
      }

      searchButton.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              performSearch();
          }
      });

      searchButton.onclick = () => {
        console.log('Search button clicked');
        console.log('Current search value:', searchInput.value);
        console.log('Available recipes:', allRecipes);
        performSearch();
    };

  } catch (error) {
      console.error('Error initializing search:', error);
  }
}

// Load PDF from Firebase Storage
async function loadPDF() {
  try {
      const storageRef = firebase.storage().ref();
      const pdfRef = storageRef.child('documents/grandma_cook_book.pdf');
      const url = await pdfRef.getDownloadURL();
      
      // Hide loading message and show PDF
      document.getElementById('loading-message').style.display = 'none';
      const iframe = document.getElementById('pdf-iframe');
      iframe.src = `${url}#page=1&view=FitH&pagemode=none&toolbar=0`;
      iframe.style.display = 'block';
      
  } catch (error) {
      console.error('Error loading PDF:', error);
      showError('אירעה שגיאה בטעינת המסמך');
  }
}

// Utility functions remain the same
function showError(message) {
  const errorElement = document.getElementById('error-message');
  const loadingElement = document.getElementById('loading-message');
  const viewerElement = document.getElementById('pdf-viewer');
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  loadingElement.style.display = 'none';
  viewerElement.style.display = 'none';
}

function redirectToHome() {
  setTimeout(() => {
      window.location.href = '../index.html';
  }, 3000);
}