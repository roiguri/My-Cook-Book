1. switchCategory(category)
   What it does: 
   - Updates the current category
   - Resets the current page to 1
   - Updates the active tab in the UI
   - Updates the page title
   - Filters and displays recipes for the new category

   How it's activated:
   - When a user clicks on a category tab
   - When a user selects a category from the dropdown
   - Indirectly when the page loads with a specific category in the URL

2. updateActiveTab()
   What it does:
   - Updates the visual state of the category tabs to show which one is active
   - Updates the selected option in the category dropdown

   How it's activated:
   - Called by switchCategory()
   - Called during initial page setup

3. updatePageTitle()
   What it does:
   - Changes the page title (h1 element) to reflect the current category

   How it's activated:
   - Called by switchCategory()
   - Called during initial page setup

4. filterAndDisplayRecipes()
   What it does:
   - Filters recipes based on the current category
   - Applies additional filters (cooking time, difficulty, main ingredient, tags)
   - Handles pagination of the filtered results
   - Calls displayRecipes() to show the filtered and paginated recipes
   - Calls updatePagination() to update the pagination UI

   How it's activated:
   - Called by switchCategory()
   - Called when any filter is changed
   - Called during initial page setup

5. displayRecipes(recipes)
   What it does:
   - Generates HTML for recipe cards based on the provided recipes
   - Updates the recipe grid in the UI with the new recipe cards

   How it's activated:
   - Called by filterAndDisplayRecipes()

6. updatePagination(totalRecipes)
   What it does:
   - Calculates the total number of pages based on the total recipes and recipes per page
   - (Implementation for updating pagination UI is left as a TODO)

   How it's activated:
   - Called by filterAndDisplayRecipes()

7. populateTagFilter()
   What it does:
   - Collects all unique tags from all recipes
   - Populates the tag filter dropdown with these tags

   How it's activated:
   - Called during initial page setup

Event Listeners:
1. Category Tabs Click Listener
   What it does:
   - Prevents default link behavior
   - Calls switchCategory() with the clicked category

   How it's activated:
   - When a user clicks on a category tab

2. Category Dropdown Change Listener
   What it does:
   - Calls switchCategory() with the selected category

   How it's activated:
   - When a user selects a category from the dropdown

3. Filter Change Listeners
   What it does:
   - Calls filterAndDisplayRecipes() to apply the new filter

   How it's activated:
   - When a user changes any filter (cooking time, difficulty, main ingredient, tags)

Initial Setup:
- Checks if a category is specified in the URL hash
- Calls populateTagFilter()
- Calls updateActiveTab()
- Calls updatePageTitle()
- Calls filterAndDisplayRecipes()

This setup runs when the DOM content is loaded, setting the initial state of the page.
