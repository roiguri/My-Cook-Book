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
    document.getElementById('recipe-time').textContent = `זמן הכנה: ${recipe.cookingTime} דקות`;
    document.getElementById('recipe-difficulty').textContent = `רמת קושי: ${recipe.difficulty}`;
    document.getElementById('recipe-category').textContent = `קטגוריה: ${recipe.category}`;

    // Set recipe image
    const recipeImage = document.getElementById('recipe-image');
    recipeImage.src = `../../img/recipes/${recipe.category}/${recipe.image}`;
    recipeImage.alt = recipe.name;
    // Set number of servings: 


    // Populate ingredients list
    const ingredientsList = document.getElementById('ingredients-list');
    recipe.ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="amount">${ingredient.amount}</span> <span class="unit">${ingredient.unit}</span> <span class="item">${ingredient.item}</span>`;
        ingredientsList.appendChild(li);
    });

    // Populate instructions list
    const instructionsList = document.getElementById('instructions-list');
    recipe.instructions.forEach(instruction => {
        const li = document.createElement('li');
        li.textContent = instruction;
        instructionsList.appendChild(li);
    });

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