import { FirestoreService } from '../../js/services/firestore-service.js';

export default {
  async render(params) {
    const response = await fetch('/src/app/pages/home-page.html');
    if (!response.ok) {
      throw new Error(`Failed to load home page template: ${response.status}`);
    }
    return await response.text();
  },

  async mount(container) {
    console.log('Home page: mount() called');
    
    // Import required components
    await this.importComponents();
    
    // Load featured recipes
    await this.loadFeaturedRecipes();
    
    // Setup category navigation (already using hash links)
    this.setupCategoryNavigation();
  },

  async unmount() {
    console.log('Home page: unmount() called');
    // Cleanup any event listeners or timers if needed
    this.cleanup();
  },

  getTitle() {
    return 'Our Kitchen Chronicles';
  },

  getMeta() {
    return {
      description: 'Discover homemade goodness in every bite. Explore our collection of recipes across all categories.',
      keywords: 'recipes, cooking, homemade, kitchen, food'
    };
  },

  // Import required components
  async importComponents() {
    try {
      await Promise.all([
        import('../../lib/recipes/recipe-card/recipe-card.js'),
        import('../../lib/utilities/element-scroller/element-scroller.js')
      ]);
    } catch (error) {
      console.error('Error importing home page components:', error);
    }
  },

  // Load featured recipes
  async loadFeaturedRecipes() {
    const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
    if (!featuredRecipesGrid) {
      console.warn('Featured recipes grid not found');
      return;
    }

    // Create message container
    const sectionContainer = document.querySelector('.featured-recipes');
    const messageContainer = document.createElement('p');
    messageContainer.dir = 'rtl';
    messageContainer.style.fontSize = 'var(--size-header2)';
    sectionContainer.insertBefore(messageContainer, featuredRecipesGrid);
    
    // Add loading message
    messageContainer.innerHTML = 'טוען את המתכונים הכי חדשים...';

    // Get the recipes container
    const elementScroller = document.querySelector('element-scroller');
    const recipesContainer = elementScroller?.querySelector('[slot="items"]');
    
    if (!recipesContainer) {
      console.warn('Recipes container not found');
      messageContainer.innerHTML = 'Error loading featured recipes.';
      return;
    }

    try {
      // Get most recent approved recipes
      const queryParams = { where: [['approved', '==', true]] };
      const recipes = await FirestoreService.queryDocuments('recipes', queryParams);
      
      if (!recipes.length) {
        console.log('No matching documents.');
        messageContainer.innerHTML = 'לא נמצאו מתכונים מומלצים.';
        return;
      }

      // Sort by creationTime, newest first
      recipes.sort((a, b) => {
        const timeA = a.creationTime?.seconds || 0;
        const timeB = b.creationTime?.seconds || 0;
        return timeB - timeA;
      });

      // Take only first 3
      const recentRecipes = recipes.slice(0, 3);
      
      // Remove loading message
      messageContainer.remove();

      // Create recipe-card elements
      recentRecipes.forEach((doc) => {
        const recipeCard = document.createElement('recipe-card');
        recipeCard.setAttribute('recipe-id', doc.id);
        recipeCard.setAttribute('layout', 'vertical');
        recipeCard.setAttribute('card-width', '200px');
        recipeCard.setAttribute('card-height', '300px');
        recipesContainer.appendChild(recipeCard);
      });

      // Add event listener for recipe card clicks (SPA navigation)
      featuredRecipesGrid.addEventListener('recipe-card-open', (event) => {
        const recipeId = event.detail.recipeId;
        // Use SPA navigation instead of window.location
        if (window.spa?.router) {
          window.spa.router.navigate(`/recipe/${recipeId}`);
        } else {
          // Fallback to traditional navigation
          window.location.href = `${import.meta.env.BASE_URL}pages/recipe-page.html?id=${recipeId}`;
        }
      });

      // Initialize the element-scroller after content is loaded
      const scroller = document.querySelector('element-scroller');
      if (scroller) {
        scroller.setAttribute('item-width', '200');
        scroller.setAttribute('padding', '20');
        setTimeout(() => {
          scroller.handleResize();
        }, 100);
      }

    } catch (error) {
      console.error('Error fetching featured recipes:', error);
      messageContainer.innerHTML = 'Error loading featured recipes. Please try again later.';
    }
  },

  // Setup category navigation (links already use hash routing)
  setupCategoryNavigation() {
    // Category links are already set up with hash routing in the render method
    // No additional setup needed since they use #/categories?category=...
    console.log('Category navigation setup complete (using hash routing)');
  },

  // Cleanup method
  cleanup() {
    // Remove any global event listeners if we had any
    // For now, nothing specific to clean up
  }
};