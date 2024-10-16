// category.js

document.addEventListener('DOMContentLoaded', async function() {
    // DOM elements
    const categoryTabs = document.querySelector('.category-tabs ul');
    const categoryDropdown = document.getElementById('category-select');
    const recipeGrid = document.getElementById('recipe-grid');
    const cookingTimeFilter = document.getElementById('cooking-time');
    const difficultyFilter = document.getElementById('difficulty');
    const mainIngredientFilter = document.getElementById('main-ingredient');
    const pageTitle = document.querySelector('h1');

    let currentCategory;
    if (window.location.hash) {
        currentCategory = window.location.hash.slice(1);
    } else {
        currentCategory = 'all';
    }
    
    let currentPage = 1;
    const recipesPerPage = 4;
    let allRecipes = [];

    // Fetch approved recipes from Firestore
    async function fetchAllRecipes() {
        const recipesRef = db.collection('recipes').where('approved', '==', true);
        const snapshot = await recipesRef.get();
        allRecipes = snapshot.docs.map(doc => ({ FirestoreID: doc.id, ...doc.data() }));
    }

    // Function to switch categories
    function switchCategory(category) {
        currentCategory = category;
        currentPage = 1;
        updateActiveTab();
        updatePageTitle();
        populateMainIngredientFilter();
        populateTagFilter();
        syncCategoryDropdown();
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
        const categoryName = currentCategory === 'all' ? 'All Recipes' : currentCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        pageTitle.textContent = categoryName;
    }

    // Function to filter and display recipes
    async function filterAndDisplayRecipes() {
        let filteredRecipes = allRecipes;

        // Apply category filter (if not 'all')
        if (currentCategory !== 'all') {
            filteredRecipes = filteredRecipes.filter(recipe => recipe.category === currentCategory);
        }   

        // Apply cooking time filter
        if (cookingTimeFilter.value) {
            let min, max;
            if (cookingTimeFilter.value.endsWith('+')) {
                min = parseInt(cookingTimeFilter.value);
                max = Infinity;
            } else {
                [min, max] = cookingTimeFilter.value.split('-').map(Number);
            }
            
            filteredRecipes = filteredRecipes.filter(recipe => 
                recipe.cookingTime >= min && (max === Infinity || recipe.cookingTime <= max)
            );
        }
    
        // Apply difficulty filter
        if (difficultyFilter.value) {
            filteredRecipes = filteredRecipes.filter(recipe => recipe.difficulty === difficultyFilter.value);
        }
    
        // Apply main ingredient filter
        if (mainIngredientFilter.value) {
            filteredRecipes = filteredRecipes.filter(recipe => recipe.mainIngredient === mainIngredientFilter.value);
        }
    
        // Apply tag filter
        if (selectedTags.length > 0) {
            filteredRecipes = filteredRecipes.filter(recipe => 
                selectedTags.every(tag => recipe.tags.includes(tag))
            );
        }
    
        // Pagination
        const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
        const startIndex = (currentPage - 1) * recipesPerPage;
        const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + recipesPerPage);    
        
        await displayRecipes(paginatedRecipes);
        updatePagination(filteredRecipes.length);
    }

    // Function to display recipes
    async function displayRecipes(recipes) {
        const recipeCards = await Promise.all(recipes.map(async (recipe) => {
            const imageUrl = await getImageUrl(recipe);
            return `
                <a href="./recipe-page.html?id=${recipe.FirestoreID}" class="recipe-card-link">
                    <div class="recipe-card recipe-card-base">
                        <img src="${imageUrl}" alt="${recipe.name}" onerror="this.src='../img/placeholder.jpg';">
                        <h3>${recipe.name}</h3>
                        <p>זמן בישול: ${cookingTime(recipe.cookingTime)}</p>
                        <p>רמת קושי: ${recipe.difficulty}</p>
                    </div>
                </a>
            `;
        }));
        recipeGrid.innerHTML = recipeCards.join('');
    }
    // Function to get image URL from Firebase Storage
    async function getImageUrl(recipe) {
      try {
          let imagePath;
          if (recipe.pendingImage && recipe.pendingImage.compressed) {
              imagePath = recipe.pendingImage.compressed;
          } else {
              imagePath = `img/recipes/compressed/${recipe.category}/${recipe.image}`;
          }
          const imageRef = storage.ref().child(imagePath);
          return await imageRef.getDownloadURL();
      } catch (error) {
          const imagePath = `img/recipes/compressed/place-holder-missing.png`;
          const imageRef = storage.ref().child(imagePath);
          return await imageRef.getDownloadURL();
      }
    }

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
   
    // Function to update pagination
    function updatePagination(totalRecipes) {
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        const totalPages = Math.ceil(totalRecipes / recipesPerPage);
    
        currentPage = Math.max(1, Math.min(currentPage, totalPages));

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
    
        pageInfo.textContent = totalPages > 0 ? 
            `עמוד ${currentPage} מתוך ${totalPages}` : 
            'אין תוצאות';
    }

    function goToPage(page) {
        const totalRecipes = currentCategory === 'all' ? 
            allRecipes.length : 
            allRecipes.filter(recipe => recipe.category === currentCategory).length;
        const totalPages = Math.ceil(totalRecipes / recipesPerPage);
    
        if (page > 0 && page <= totalPages) {
            currentPage = page;
            filterAndDisplayRecipes();
        } else {
            console.warn(`Attempted to go to invalid page: ${page}. Total pages: ${totalPages}`);
        }
    }

    function populateMainIngredientFilter() {
        const relevantRecipes = currentCategory === 'all' ? allRecipes : allRecipes.filter(recipe => recipe.category === currentCategory);
        const mainIngredients = [...new Set(relevantRecipes.map(recipe => recipe.mainIngredient))];
        
        mainIngredientFilter.innerHTML = '<option value="">All</option>' + 
            mainIngredients.map(ingredient => `
                <option value="${ingredient}">${ingredient}</option>
            `).join('');
    }

    function populateDifficultyFilter() {
        const difficulties = ["קלה", "בינונית", "קשה"];
        
        difficultyFilter.innerHTML = '<option value="">All</option>' + 
            difficulties.map(difficulty => `
                <option value="${difficulty}">${difficulty}</option>
            `).join('');
    }

    function populateCookingTimeFilter() {
        cookingTimeFilter.innerHTML = `
            <option value="">כל זמני הבישול</option>
            <option value="0-30">0-30 דקות</option>
            <option value="31-60">31-60 דקות</option>
            <option value="61">61+ דקות</option>
        `;
    }

    /* tag filter */
    let allTags = [];
    let selectedTags = [];

    function populateTagFilter() {
        const relevantRecipes = currentCategory === 'all' ? allRecipes : allRecipes.filter(recipe => recipe.category === currentCategory);
        allTags = [...new Set(relevantRecipes.flatMap(recipe => recipe.tags))];
        allTags.sort((a, b) => a.localeCompare(b, 'he'));
        
        const tagSearchInput = document.getElementById('tag-filter');
        const tagSuggestions = document.getElementById('tag-suggestions');
        const selectedTagsContainer = document.getElementById('selected-tags');
    
        // Clear existing tags
        selectedTags = [];
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
            document.getElementById('tag-filter').value = '';
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

    function syncCategoryDropdown() {
        const dropdown = document.getElementById('category-select');
        if (dropdown) {
            dropdown.value = currentCategory;
        }
    }

    // Event listeners
    categoryTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            switchCategory(e.target.getAttribute('href').slice(1));
        }
    });

    if (categoryDropdown) {
        categoryDropdown.addEventListener('change', (e) => {
            switchCategory(e.target.value);
        });
    }

    categoryDropdown.addEventListener('change', (e) => {
        switchCategory(e.target.value);
    });

    [cookingTimeFilter, difficultyFilter, mainIngredientFilter].forEach(filter => {
        if (filter) {  // Add a null check
            filter.addEventListener('change', filterAndDisplayRecipes);
        }
    });
    
    // Add event listeners for our new tag filter elements
    const tagSearchInput = document.getElementById('tag-filter');
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
        goToPage(currentPage - 1);
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        goToPage(currentPage + 1);
    });

    // Initial setup
    await fetchAllRecipes();
    populateMainIngredientFilter();
    populateTagFilter();
    populateDifficultyFilter();
    updateActiveTab();
    updatePageTitle();
    syncCategoryDropdown();
    await filterAndDisplayRecipes();
});