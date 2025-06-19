import { FirestoreService } from '../../js/services/firestore-service.js';

export default {
  stylePath: new URL('../../styles/pages/home-spa.css', import.meta.url).href,

  async render() {
    const response = await fetch(new URL('./home-page.html', import.meta.url));
    if (!response.ok) {
      throw new Error(`Failed to load home page template: ${response.status}`);
    }
    return await response.text();
  },

  async mount() {
    await this.importComponents();
    await this.loadFeaturedRecipes();
  },

  async unmount() {
    // Nothing to clean up
  },

  getTitle() {
    return 'Our Kitchen Chronicles';
  },

  getMeta() {
    return {
      description:
        'Discover homemade goodness in every bite. Explore our collection of recipes across all categories.',
      keywords: 'recipes, cooking, homemade, kitchen, food',
    };
  },

  async importComponents() {
    try {
      await Promise.all([
        import('../../lib/recipes/recipe-card/recipe-card.js'),
        import('../../lib/utilities/element-scroller/element-scroller.js'),
      ]);
    } catch (error) {
      console.error('Error importing home page components:', error);
    }
  },

  async loadFeaturedRecipes() {
    const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
    if (!featuredRecipesGrid) {
      console.warn('Featured recipes grid not found');
      return;
    }

    const sectionContainer = document.querySelector('.featured-recipes');
    const messageContainer = document.createElement('p');
    messageContainer.dir = 'rtl';
    messageContainer.style.fontSize = 'var(--size-header2)';
    sectionContainer.insertBefore(messageContainer, featuredRecipesGrid);

    messageContainer.innerHTML = 'טוען את המתכונים הכי חדשים...';

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
        messageContainer.innerHTML = 'לא נמצאו מתכונים מומלצים.';
        return;
      }

      // Sort by creationTime, newest first
      recipes.sort((a, b) => {
        const timeA = a.creationTime?.seconds || 0;
        const timeB = b.creationTime?.seconds || 0;
        return timeB - timeA;
      });

      // Take only first 3 recipes
      const recentRecipes = recipes.slice(0, 3);

      messageContainer.remove();

      recentRecipes.forEach((doc) => {
        const recipeCard = document.createElement('recipe-card');
        recipeCard.setAttribute('recipe-id', doc.id);
        recipeCard.setAttribute('layout', 'vertical');
        recipesContainer.appendChild(recipeCard);
      });

      featuredRecipesGrid.addEventListener('recipe-card-open', (event) => {
        const recipeId = event.detail.recipeId;
        if (window.spa?.router) {
          window.spa.router.navigate(`/recipe/${recipeId}`);
          setTimeout(() => {
            if (typeof window.updateActiveNavigation === 'function') {
              window.updateActiveNavigation();
            }
          }, 100);
        } else {
          window.location.href = `${import.meta.env.BASE_URL}recipe/${recipeId}`;
        }
      });

      const scroller = document.querySelector('element-scroller');
      if (scroller) {
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
};
