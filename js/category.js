// category.js
// Assuming recipes is a global variable defined in recipeData.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const categoryTabs = document.querySelector('.category-tabs ul');
    const categoryDropdown = document.getElementById('category-select');
    const recipeGrid = document.getElementById('recipe-grid');
    const cookingTimeFilter = document.getElementById('cooking-time');
    const difficultyFilter = document.getElementById('difficulty');
    const mainIngredientFilter = document.getElementById('main-ingredient');
    const tagsFilter = document.getElementById('tags');
    const pageTitle = document.querySelector('h1');

    let currentCategory = 'appetizers';
    let currentPage = 1;
    const recipesPerPage = 8;

    // Function to switch categories
    function switchCategory(category) {
        currentCategory = category;
        currentPage = 1;
        updateActiveTab();
        updatePageTitle();
        populateMainIngredientFilter();
        populateTagFilter(); // Add this line to update tags when category changes
        filterAndDisplayRecipes();
    }

    // Function to update active tab
    function updateActiveTab() {
        categoryTabs.querySelectorAll('a').forEach(tab => {
            if (tab.getAttribute('href').slice(1) === currentCategory) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        categoryDropdown.value = currentCategory;
    }

    // Function to update page title
    function updatePageTitle() {
        const categoryName = currentCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        pageTitle.textContent = categoryName;
    }

    // Function to filter and diaplay recipes
    function filterAndDisplayRecipes() {
        console.log("Starting filteredRecipes:", recipes.filter(recipe => recipe.category === currentCategory));
        
        let filteredRecipes = recipes.filter(recipe => recipe.category === currentCategory);
    
        // Apply cooking time filter
        if (cookingTimeFilter.value) {
            console.log("Applying cooking time filter:", cookingTimeFilter.value);
            
            let min, max;
            if (cookingTimeFilter.value.endsWith('+')) {
                min = parseInt(cookingTimeFilter.value);
                max = Infinity;
            } else {
                [min, max] = cookingTimeFilter.value.split('-').map(Number);
            }
            
            console.log("Min:", min, "Max:", max);
            
            filteredRecipes = filteredRecipes.filter(recipe => {
                console.log(`Recipe: ${recipe.name}, Cooking Time: ${recipe.cookingTime}`);
                let keep = recipe.cookingTime >= min && (max === Infinity || recipe.cookingTime <= max);
                console.log(`Keep recipe? ${keep}`);
                return keep;
            });
        }
    
        // Apply difficulty filter
        if (difficultyFilter.value) {
            console.log("Applying difficulty filter, selected value:", difficultyFilter.value);
            filteredRecipes = filteredRecipes.filter(recipe => {
                console.log(`Recipe: ${recipe.name}, Difficulty: ${recipe.difficulty}, Selected: ${difficultyFilter.value}, Match: ${recipe.difficulty === difficultyFilter.value}`);
                return recipe.difficulty === difficultyFilter.value;
            });
        }
    
        console.log("Filtered recipes after difficulty filter:", filteredRecipes);
    
        // Apply main ingredient filter
        if (mainIngredientFilter.value) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                console.log(`Main ingredient filter: ${recipe.name}, Ingredient: ${recipe.mainIngredient}, Selected: ${mainIngredientFilter.value}`);
                return recipe.mainIngredient === mainIngredientFilter.value;
            });
        }
    
        // Apply tag filter
        const selectedTags = Array.from(tagsFilter.selectedOptions).map(option => option.value);
        if (selectedTags.length > 0) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                console.log(`Tag filter: ${recipe.name}, Tags: ${recipe.tags.join(', ')}, Selected: ${selectedTags.join(', ')}`);
                return selectedTags.every(tag => recipe.tags.includes(tag));
            });
        }
    
        console.log("Final filteredRecipes:", filteredRecipes);
    
        // Pagination
        const startIndex = (currentPage - 1) * recipesPerPage;
        const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + recipesPerPage);
    
        displayRecipes(paginatedRecipes);
        updatePagination(filteredRecipes.length);
    }

    // Function to display recipes
    function displayRecipes(recipes) {
        recipeGrid.innerHTML = recipes.map(recipe => `
            <div class="recipe-card">
                <img src="../../img/recipes/${recipe.category}/${recipe.image}" alt="${recipe.name}">
                <h3>${recipe.name}</h3>
                <p>זמן בישול: ${recipe.cookingTime} דקות</p>
                <p>רמת קושי: ${recipe.difficulty}</p>
                <p>תגיות: ${recipe.tags.join(', ')}</p>
            </div>
        `).join('');
    }

    // Function to update pagination
    function updatePagination(totalRecipes) {
        const totalPages = Math.ceil(totalRecipes / recipesPerPage);
        // Implement pagination UI update here
    }

    function populateMainIngredientFilter() {
        const currentRecipes = recipes.filter(recipe => recipe.category === currentCategory);
        const mainIngredients = [...new Set(currentRecipes.map(recipe => recipe.mainIngredient))];
        
        mainIngredientFilter.innerHTML = '<option value="">All</option>' + 
            mainIngredients.map(ingredient => `
                <option value="${ingredient}">${ingredient}</option>
            `).join('');
        console.log("Populated main ingredients:", mainIngredients);
    }

    function populateDifficultyFilter() {
        const difficulties = ["קלה", "בינונית", "קשה"];
        
        difficultyFilter.innerHTML = '<option value="">All</option>' + 
            difficulties.map(difficulty => `
                <option value="${difficulty}">${difficulty}</option>
            `).join('');
        
        console.log("Populated difficulties:", difficulties);
        console.log("Difficulty filter HTML:", difficultyFilter.innerHTML);
    }

    function populateTagFilter() {
        // Filter recipes for the current category
        const currentCategoryRecipes = recipes.filter(recipe => recipe.category === currentCategory);
        
        // Get unique tags from the current category recipes
        const categoryTags = [...new Set(currentCategoryRecipes.flatMap(recipe => recipe.tags))];
        
        // Sort tags alphabetically
        categoryTags.sort((a, b) => a.localeCompare(b, 'he'));
    
        // Populate the tag filter dropdown
        tagsFilter.innerHTML = categoryTags.map(tag => `
            <option value="${tag}">${tag}</option>
        `).join('');
        
        console.log(`Populated tags for category '${currentCategory}':`, categoryTags);
    }

    function populateCookingTimeFilter() {
        cookingTimeFilter.innerHTML = `
            <option value="">כל זמני הבישול</option>
            <option value="0-30">0-30 דקות</option>
            <option value="31-60">31-60 דקות</option>
            <option value="61">61+ דקות</option>
        `;
        console.log("Populated cooking time filter options");
    }

    // Event listeners
    categoryTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            switchCategory(e.target.getAttribute('href').slice(1));
        }
    });

    categoryDropdown.addEventListener('change', (e) => {
        switchCategory(e.target.value);
    });

    [cookingTimeFilter, difficultyFilter, mainIngredientFilter, tagsFilter].forEach(filter => {
        filter.addEventListener('change', filterAndDisplayRecipes);
    });

    // Check if the page was reached from the navigation bar
    if (window.location.hash) {
        currentCategory = window.location.hash.slice(1);
    } else {
        pageTitle.textContent = "Recipes";
    }

    // Initial setup
    
    populateMainIngredientFilter();
    populateTagFilter();
    populateDifficultyFilter();
    updateActiveTab();
    updatePageTitle();
    filterAndDisplayRecipes();
    
});