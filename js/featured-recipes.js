const featuredRecipeNames = ["מוקפץ עם סלמון וברוקולי", "בולונז", "אורז לבן פרסי"];

async function displayFeaturedRecipes() {
    const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
    featuredRecipesGrid.innerHTML = '<p>טוען מתכונים מומלצים...</p>';

    try {
        // Fetch the recipes to get their IDs
        const recipesRef = db.collection('recipes');
        const snapshot = await recipesRef.where('name', 'in', featuredRecipeNames).get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            featuredRecipesGrid.innerHTML = '<p>לא נמצאו מתכונים מומלצים.</p>';
            return;
        }

        // Clear loading message
        featuredRecipesGrid.innerHTML = '';

        // Create recipe-card elements
        snapshot.forEach(doc => {
            const recipeCard = document.createElement('recipe-card');
            recipeCard.setAttribute('recipe-id', doc.id);
            recipeCard.setAttribute('layout', 'vertical');
            featuredRecipesGrid.appendChild(recipeCard);
        });

        // Add event listener for recipe card clicks
        featuredRecipesGrid.addEventListener('recipe-card-open', (event) => {
            const recipeId = event.detail.recipeId;
            window.location.href = `pages/recipe-page.html?id=${recipeId}`;
        });

    } catch (error) {
        console.error("Error fetching featured recipes:", error);
        featuredRecipesGrid.innerHTML = '<p>Error loading featured recipes. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', displayFeaturedRecipes);