const featuredRecipeNames = ["מוקפץ עם סלמון וברוקולי", "בולונז","אורז לבן פרסי"];

function createFeaturedRecipeCard(recipe) {
    return `
        <a href="pages/recipe-page.html#${recipe.id}" class="favorites-card-link">
            <div class="favorites-card recipe-card-base">
                <div class="image-container">
                    <img src="img/recipes/compressed/${recipe.category}/${recipe.image}" alt="${recipe.name}">
                </div>    
                <div class="info-container">
                    <h3>${recipe.name}</h3>
                    <div class="favorites-info">
                        זמן בישול: ${recipe.cookingTime} דקות<br>
                        רמת קושי: ${recipe.difficulty}
                    </div>
                </div>
            </div>
    `;
}

function displayFeaturedRecipes() {
    const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
    const featuredRecipes = recipes.filter(recipe => featuredRecipeNames.includes(recipe.name));
    
    featuredRecipesGrid.innerHTML = featuredRecipes.map(createFeaturedRecipeCard).join('');
}

document.addEventListener('DOMContentLoaded', displayFeaturedRecipes);