// recipe-script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Get the hash from the URL, remove the '#' symbol, and parse it as an integer
    const recipeId = window.location.hash.slice(1);
    console.log('Recipe ID from URL:', recipeId);

    // Ensure recipes are loaded
    if (typeof recipes === 'undefined' || recipes.length === 0) {
        console.error('Recipes not loaded. Check if recipe-data.js is included before recipe-script.js');
        return;
    }

    // Find the recipe with the matching id
    const recipe = recipes.find(r => r.id.toString() === recipeId);
    console.log('Found recipe:', recipe);

    // If no matching recipe is found, default to the first recipe
    if (!recipe) {
        console.warn('No matching recipe found, defaulting to first recipe');
        recipe = recipes[0];
    }  

    // Populate recipe details
    document.title = `${recipe.name} - Our Kitchen Chronicles`;
    document.getElementById('recipe-name').textContent = recipe.name;
    document.getElementById('recipe-time').textContent = `זמן הכנה: ${cookingTime(recipe.cookingTime)}`;
    document.getElementById('recipe-difficulty').textContent = `רמת קושי: ${recipe.difficulty}`;
    document.getElementById('recipe-category').textContent = `קטגוריה: ${recipe.category}`;

    // Set recipe image
    const recipeImage = document.getElementById('recipe-image');
    recipeImage.src = `../img/recipes/full/${recipe.category}/${recipe.image}`;
    recipeImage.alt = recipe.name;
    // Set number of servings: 


    // Populate ingredients list
    const ingredientsList = document.getElementById('ingredients-list');
    recipe.ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="amount">${ingredient.amount}</span> <span class="unit">${ingredient.unit}</span> <span class="item">${ingredient.item}</span>`;
        ingredientsList.appendChild(li);
    });
    
    // Create a time string:
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
            finalTime = `${time/60} שעות`
        }
        else {
            finalTime = `${~~(time/60)} שעות ו-${time%60} דקות`;
        }
        return finalTime;
    }

    // Populate instructions list
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
                stage.instructions.forEach(instruction => {
                    const li = document.createElement('li');
                    li.textContent = instruction;
                    stageList.appendChild(li);
                });
                instructionsList.appendChild(stageList);
            });
        } else {
            // Fallback to the original instructions array
            recipe.instructions.forEach(instruction => {
                const li = document.createElement('li');
                li.textContent = instruction;
                instructionsList.appendChild(li);
            });
        }
    }
    populateInstructions(recipe);

    // Populate comments list
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


    // Adjust Servings
    const servingsInput = document.getElementById('servings');
    servingsInput.setAttribute("value", recipe.servings);

    const originalServings = parseInt(servingsInput.value);
    const amountSpans = document.querySelectorAll('.amount');
    const originalAmounts = Array.from(amountSpans).map(span => parseFloat(span.textContent));
    console.log('Number of amount spans:', amountSpans.length);

    // Add serving size adjuster functionality
    servingsInput.addEventListener('change', adjustServings);

    function adjustServings() {
        const newServings = parseInt(servingsInput.value);
        const scalingFactor = newServings / originalServings;
        console.log(scalingFactor)
        amountSpans.forEach((span, index) => {
            const originalAmount = originalAmounts[index];
            const newAmount = originalAmount * scalingFactor;
            span.textContent = formatNumber(newAmount);
        });
    }

    function formatNumber(number) {
        // If the number has no decimal part, return it as is
        if (Number.isInteger(number)) {
            return number.toString();
        }
        
        // Otherwise, format to a maximum of 2 decimal places
        return number.toFixed(2).replace(/\.?0+$/, '');
    }

    // Add print functionality
    const printButton = document.getElementById('print-recipe');
    printButton.addEventListener('click', printRecipe);
});

function printRecipe() {
    window.print();
}