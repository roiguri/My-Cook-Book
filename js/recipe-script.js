// recipe-script.js

document.addEventListener('DOMContentLoaded', function() {
    // Get recipeId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    console.log('Recipe ID from URL:', recipeId);  

    // Variables to store original values 
    let originalServings;
    let amountSpans;
    let originalAmounts;
    let servingsInput;

    // Get Firestore Reference
    const db = firebase.firestore();

    db.collection('recipes').doc(recipeId).get()
        .then((doc) => {
            if (doc.exists) {
                const recipe = doc.data();
                
                // Populate recipe details
                populateRecipeDetails(recipe);
                // Set recipe image
                setRecipeImage(recipe);
                // Populate ingredients list
                populateIngredientsList(recipe);
                // Populate instructions list
                populateInstructions(recipe);
                // Populate comments list
                populateCommentList(recipe);
                // Adjust Servings
                setupServingsAdjuster(recipe);
                // Add print functionality
                setupPrintButton;


            } else {
                console.warn('No such document!');
                // Handle the case where the recipe doesn't exist (e.g., display an error message)
            }
        })
        .catch((error) => {
            console.error("Error getting recipe: ", error);
            // Handle potential errors during data fetching
        });

    const categoryMapping = {
      'appetizers': 'מנות ראשונות',
      'main-courses': 'מנות עיקריות',
      'side-dishes': 'תוספות',
      'soups-stews': 'מרקים ותבשילים',
      'salads': 'סלטים',
      'breakfast-brunch': 'ארוחות בוקר',
      'snacks': 'חטיפים',
      'beverages': 'משקאות',
      'desserts': 'קינוחים',
    };
    
    // Functions to populate Recipe Page:
    function populateRecipeDetails(recipe){
      document.title = `${recipe.name} - Our Kitchen Chronicles`;
      document.getElementById('recipe-name').textContent = recipe.name;
      document.getElementById('prep-time').textContent = `זמן הכנה: ${cookingTime(recipe.prepTime)}`;
      document.getElementById('wait-time').textContent = `זמן המתנה: ${cookingTime(recipe.waitTime)}`;
      document.getElementById('recipe-difficulty').textContent = `רמת קושי: ${recipe.difficulty}`;
      document.getElementById('recipe-category').textContent = `קטגוריה: ${categoryMapping[recipe.category]}`;
    }
    
    async function setRecipeImage(recipe) {
      const recipeImage = document.getElementById('recipe-image');
      try {
          let imagePath;
          if (recipe.pendingImage && recipe.pendingImage.full) {
              imagePath = recipe.pendingImage.full;
          } else {
              imagePath = `img/recipes/full/${recipe.category}/${recipe.image}`;
          }
          const imageRef = storage.ref().child(imagePath);
          const imageUrl = await imageRef.getDownloadURL();
          recipeImage.src = imageUrl;

      } catch (error) {
          console.error("Error fetching image URL:", error);
          const imagePath = `img/recipes/compressed/place-holder-add-new.png`;
          const imageRef = storage.ref().child(imagePath);
          const imageUrl = await imageRef.getDownloadURL();
          recipeImage.src = imageUrl;
  
          // Apply styles when image fails to load
          recipeImage.style.width = '200px';
          recipeImage.style.height = '200px'; 
          recipeImage.style.cursor = 'pointer';
  
          recipeImage.classList.add("missing-image-update")
          recipeImage.setAttribute('data-recipe-id', recipeId);
      }
      recipeImage.alt = "לחץ להצעת תמונה חדשה";
  
      // Add click event listener to missing image
      if (recipeImage.classList.contains('missing-image-update')) {
          recipeImage.addEventListener('click', (event) => {
              event.preventDefault();
              const recipeId = recipeImage.getAttribute('data-recipe-id');
              const uploadComponent = document.querySelector('missing-image-upload');
              uploadComponent.openModalForRecipe(recipeId);
          });
      }
  }

    function populateIngredientsList(recipe){
      const ingredientsList = document.getElementById('ingredients-list');
      recipe.ingredients.forEach(ingredient => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="amount">${ingredient.amount}</span> <span class="unit">${ingredient.unit}</span> <span class="item">${ingredient.item}</span>`;
          ingredientsList.appendChild(li);
      });
    }

    function populateInstructions(recipe) {
        const instructionsList = document.getElementById('instructions-list');
        instructionsList.innerHTML = ''; // Clear existing instructions

        if (recipe.stages && recipe.stages.length > 0) {
            recipe.stages.forEach((stage, index) => {
                const stageTitle = document.createElement('h3');
                stageTitle.textContent = `שלב ${index + 1}: ${stage.title}`;
                stageTitle.classList.add('stage-title');
                instructionsList.appendChild(stageTitle);

                const stageList = document.createElement('ol');
                stageList.classList.add('instruction-list');
                stage.instructions.forEach(instruction => {
                    const li = document.createElement('li');
                    li.textContent = instruction;
                    stageList.appendChild(li);
                });
                instructionsList.appendChild(stageList);
            });
        } else {
            // Fallback to the original instructions array
            const singleStageList = document.createElement('ol');
            singleStageList.classList.add('instruction-list');
            recipe.instructions.forEach(instruction => {
                const li = document.createElement('li');
                li.textContent = instruction;
                singleStageList.appendChild(li);
            });
            instructionsList.appendChild(singleStageList);
        }
    }

    function populateCommentList(recipe){
      const commentsList = document.getElementById('comments-list');
      if ("comments" in recipe){
          recipe.comments.forEach(comment => {
              const li = document.createElement('li');
              li.textContent = comment;
              commentsList.appendChild(li);
          });
      }
      else{
          commentsList.parentNode.style.display = 'none';
      }
    }

    // Adjust Servings
    function setupServingsAdjuster(recipe){
        servingsInput = document.getElementById('servings');
        servingsInput.setAttribute("value", recipe.servings);
        originalServings = parseInt(servingsInput.value);
        amountSpans = document.querySelectorAll('.amount');
        originalAmounts = Array.from(amountSpans).map(span => parseFloat(span.textContent));

        // Add serving size adjuster functionality
        servingsInput.addEventListener('change', adjustServings);
    }

    function adjustServings() {
        const newServings = parseInt(servingsInput.value);
        const scalingFactor = newServings / originalServings;
        amountSpans.forEach((span, index) => {
            const originalAmount = originalAmounts[index];
            const newAmount = originalAmount * scalingFactor;
            span.textContent = formatNumber(newAmount);
        });
    }
    

    function setupPrintButton() {
      const printButton = document.getElementById('print-recipe');
      printButton.addEventListener('click', printRecipe);
    }

    
    // Helper Functions
    function cookingTime(time) {
      let finalTime;
      if (time == 0 || time == null) {
        finalTime = 'ללא'
      }
      else if (time <= 60){
          finalTime = `${time} דקות`;
      }
      else if (time > 60 && time < 120){
          finalTime = `שעה ו-${time%60} דקות`;
      }
      else if (time == 120){
          finalTime = "שעתיים";
      }
      else if (time > 120 && time < 180){
          finalTime = `שעתיים ו-${time%60} דקות`;;
      }
      else if (time % 60 == 0) {
          finalTime = `${~~(time/60)} שעות`
      }
      else {
          finalTime = `${~~(time/60)} שעות ו-${time%60} דקות`;
      }
      return finalTime;
    }
    
    function formatNumber(number) {
        // If the number has no decimal part, return it as is
        if (Number.isInteger(number)) {
            return number.toString();
        }
        
        // Otherwise, format to a maximum of 2 decimal places
        return number.toFixed(2).replace(/\.?0+$/, '');
    }

    function printRecipe() {
      window.print();
    }
});

