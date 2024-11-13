const featuredRecipeNames = ["מוקפץ עם סלמון וברוקולי", "בולונז", "אורז לבן פרסי"];

async function displayFeaturedRecipes() {
    const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
    featuredRecipesGrid.innerHTML = '<p>טוען מתכונים מומלצים...</p>';

    try {
        // Get most recent approved recipes
        const recipesRef = db.collection('recipes')
            .where('approved', '==', true);
            
        const snapshot = await recipesRef.get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            featuredRecipesGrid.innerHTML = '<p>לא נמצאו מתכונים מומלצים.</p>';
            return;
        }

        // Convert to array for sorting
        const recipes = [];
        snapshot.forEach(doc => {
            recipes.push(doc);
        });

        // Sort by creationTime if exists, newest first
        recipes.sort((a, b) => {
            const timeA = a.data().creationTime?.seconds || 0;
            const timeB = b.data().creationTime?.seconds || 0;
            return timeB - timeA;
        });

        // Take only first 4
        const recentRecipes = recipes.slice(0, 3);

        // Clear loading message
        featuredRecipesGrid.innerHTML = '';

        // Create recipe-card elements
        recentRecipes.forEach(doc => {
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