// recipe-script.js

document.addEventListener('DOMContentLoaded', function() {
    // For now, we'll use the first recipe in the database
    const recipe = recipes[0];

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

    // Add serving size adjuster functionality
    const servingsInput = document.getElementById('servings');
    servingsInput.addEventListener('change', adjustServings);

    // Add print functionality
    const printButton = document.getElementById('print-recipe');
    printButton.addEventListener('click', printRecipe);
});

function adjustServings() {
    // Implement serving size adjustment logic here
}

function printRecipe() {
    window.print();
}