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
    const pageTitle = document.querySelector('h1');

    let currentCategory = 'appetizers';
    let currentPage = 1;
    const recipesPerPage = 4;

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
            filteredRecipes = filteredRecipes.filter(recipe => {
                console.log(`Recipe: ${recipe.name}, Difficulty: ${recipe.difficulty}, Selected: ${difficultyFilter.value}, Match: ${recipe.difficulty === difficultyFilter.value}`);
                return recipe.difficulty === difficultyFilter.value;
            });
        }
    
    
        // Apply main ingredient filter
        if (mainIngredientFilter.value) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                console.log(`Main ingredient filter: ${recipe.name}, Ingredient: ${recipe.mainIngredient}, Selected: ${mainIngredientFilter.value}`);
                return recipe.mainIngredient === mainIngredientFilter.value;
            });
        }
    
        // Apply tag filter
        if (selectedTags.length > 0) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                return selectedTags.every(tag => recipe.tags.includes(tag));
            });
        }
    
        console.log("Final filteredRecipes:", filteredRecipes);
    
        // Pagination
        const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
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

            </div>
        `).join('');
    }
    /* add the following line to above function to add tags ro recipe card:
                    <p>תגיות: ${recipe.tags.join(', ')}</p> 
    */
   
    // Function to update pagination
    function updatePagination(totalRecipes) {
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        const totalPages = Math.ceil(totalRecipes / recipesPerPage);
    
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
    
        pageInfo.textContent = `עמוד ${currentPage} מתוך ${totalPages}`;
    }

    function goToPage(page) {
        currentPage = page;
        filterAndDisplayRecipes();
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

    function populateCookingTimeFilter() {
        cookingTimeFilter.innerHTML = `
            <option value="">כל זמני הבישול</option>
            <option value="0-30">0-30 דקות</option>
            <option value="31-60">31-60 דקות</option>
            <option value="61">61+ דקות</option>
        `;
        console.log("Populated cooking time filter options");
    }

    /* tag filter */
    let allTags = [];
    let selectedTags = [];

    function populateTagFilter() {
        const currentCategoryRecipes = recipes.filter(recipe => recipe.category === currentCategory);
        allTags = [...new Set(currentCategoryRecipes.flatMap(recipe => recipe.tags))];
        allTags.sort((a, b) => a.localeCompare(b, 'he'));
        
        const tagSearchInput = document.getElementById('tag-search');
        const tagSuggestions = document.getElementById('tag-suggestions');
        const selectedTagsContainer = document.getElementById('selected-tags');

        tagSearchInput.addEventListener('input', handleTagSearch);
        tagSuggestions.addEventListener('click', handleTagSelection);
        selectedTagsContainer.addEventListener('click', handleTagRemoval);

        updateSelectedTags();
    }

    function handleTagSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const tagSuggestions = document.getElementById('tag-suggestions');
        
        if (searchTerm.length === 0) {
            tagSuggestions.style.display = 'none';
            return;
        }

        const filteredTags = allTags.filter(tag => 
            tag.toLowerCase().includes(searchTerm) && !selectedTags.includes(tag)
        );

        tagSuggestions.innerHTML = filteredTags.map(tag => `<div>${tag}</div>`).join('');
        tagSuggestions.style.display = filteredTags.length > 0 ? 'block' : 'none';
    }

    function handleTagSelection(event) {
        if (event.target.tagName === 'DIV') {
            const selectedTag = event.target.textContent;
            selectedTags.push(selectedTag);
            updateSelectedTags();
            filterAndDisplayRecipes();
            document.getElementById('tag-search').value = '';
            document.getElementById('tag-suggestions').style.display = 'none';
        }
    }

    function handleTagRemoval(event) {
        if (event.target.classList.contains('remove-tag')) {
            const tagToRemove = event.target.parentElement.textContent.slice(0, -1);
            selectedTags = selectedTags.filter(tag => tag !== tagToRemove);
            updateSelectedTags();
            filterAndDisplayRecipes();
        }
    }

    function updateSelectedTags() {
        const selectedTagsContainer = document.getElementById('selected-tags');
        selectedTagsContainer.innerHTML = selectedTags.map(tag => 
            `<div class="selected-tag">${tag}<span class="remove-tag">×</span></div>`
        ).join('');
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

    [cookingTimeFilter, difficultyFilter, mainIngredientFilter].forEach(filter => {
        if (filter) {  // Add a null check
            filter.addEventListener('change', filterAndDisplayRecipes);
        }
    });
    
    // Add event listeners for our new tag filter elements
    const tagSearchInput = document.getElementById('tag-search');
    const tagSuggestions = document.getElementById('tag-suggestions');
    const selectedTagsContainer = document.getElementById('selected-tags');
    
    if (tagSearchInput) {
        tagSearchInput.addEventListener('input', handleTagSearch);
    }
    if (tagSuggestions) {
        tagSuggestions.addEventListener('click', handleTagSelection);
    }
    if (selectedTagsContainer) {
        selectedTagsContainer.addEventListener('click', handleTagRemoval);
    }

    // Check if the page was reached from the navigation bar
    if (window.location.hash) {
        currentCategory = window.location.hash.slice(1);
    } else {
        pageTitle.textContent = "Recipes";
    }
    // pagination listeners
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(recipes.filter(recipe => recipe.category === currentCategory).length / recipesPerPage);
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    });

    // Initial setup
    
    populateMainIngredientFilter();
    populateTagFilter();
    populateDifficultyFilter();
    updateActiveTab();
    updatePageTitle();
    filterAndDisplayRecipes();
    
});