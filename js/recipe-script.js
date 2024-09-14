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

    // Functions to populate Recipe Page:
    function populateRecipeDetails(recipe){
      document.title = `${recipe.name} - Our Kitchen Chronicles`;
      document.getElementById('recipe-name').textContent = recipe.name;
      document.getElementById('recipe-time').textContent = `זמן הכנה: ${cookingTime(recipe.cookingTime)}`;
      document.getElementById('recipe-difficulty').textContent = `רמת קושי: ${recipe.difficulty}`;
      document.getElementById('recipe-category').textContent = `קטגוריה: ${recipe.category}`;
    }
    
    async function setRecipeImage(recipe) {
        const recipeImage = document.getElementById('recipe-image');
        try {
            const imagePath = `img/recipes/full/${recipe.category}/${recipe.image}`;
            const imageRef = storage.ref().child(imagePath);
            const imageUrl = await imageRef.getDownloadURL();
            recipeImage.src = imageUrl;
        } catch (error) {
            console.error("Error fetching image URL:", error);
            recipeImage.src = '../img/placeholder.jpg'; // Fallback to local placeholder
        }
        recipeImage.alt = recipe.name;
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
          console.log(`comments: `, recipe.comments)
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
        console.log('Number of amount spans:', amountSpans.length);

        // Add serving size adjuster functionality
        servingsInput.addEventListener('change', adjustServings);
    }

    function adjustServings() {
        const newServings = parseInt(servingsInput.value);
        const scalingFactor = newServings / originalServings;
        console.log('Scaling factor:', scalingFactor);
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
      if (time <= 60){
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

