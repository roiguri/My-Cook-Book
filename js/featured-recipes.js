const featuredRecipeNames = ["מוקפץ עם סלמון וברוקולי", "בולונז", "אורז לבן פרסי"];

async function getImageUrl(recipe) {
    try {
        const imagePath = `img/recipes/compressed/${recipe.category}/${recipe.image}`;
        const imageRef = storage.ref().child(imagePath);
        return await imageRef.getDownloadURL();
    } catch (error) {
        console.error("Error fetching image URL:", error);
        return 'img/placeholder.jpg'; // Fallback to local placeholder
    }
}

async function createFeaturedRecipeCard(recipe) {
    const imageUrl = await getImageUrl(recipe);
    return `
        <a href="pages/recipe-page.html?id=${recipe.docId}" class="favorites-card-link">
            <div class="favorites-card recipe-card-base">
                <div class="image-container">
                    <img src="${imageUrl}" alt="${recipe.name}" onerror="this.src='img/placeholder.jpg';">
                </div>    
                <div class="info-container">
                    <h3>${recipe.name}</h3>
                    <div class="favorites-info">
                        זמן בישול: ${recipe.cookingTime} דקות<br>
                        רמת קושי: ${recipe.difficulty}
                    </div>
                </div>
            </div>
        </a>
    `;
}

async function displayFeaturedRecipes() {
    const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
    featuredRecipesGrid.innerHTML = '<p>טוען מתכונים מומלצים...</p>';

    try {
        const recipesRef = db.collection('recipes');
        const snapshot = await recipesRef.where('name', 'in', featuredRecipeNames).get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            featuredRecipesGrid.innerHTML = '<p>לא נמצאו מתכונים מומלצים.</p>';
            return;
        }

        const featuredRecipes = [];
        snapshot.forEach(doc => {
            featuredRecipes.push({ docId: doc.id, ...doc.data() });
        });

        const recipeCards = await Promise.all(featuredRecipes.map(createFeaturedRecipeCard));
        featuredRecipesGrid.innerHTML = recipeCards.join('');
    } catch (error) {
        console.error("Error fetching featured recipes:", error);
        featuredRecipesGrid.innerHTML = '<p>Error loading featured recipes. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', displayFeaturedRecipes);