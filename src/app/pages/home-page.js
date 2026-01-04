import { FirestoreService } from '../../js/services/firestore-service.js';
import { AppConfig } from '../../js/config/app-config.js';
import '../../styles/pages/home-spa.css';

let templateCache = null;

export default {
  async render() {
    if (templateCache) return templateCache;

    const response = await fetch(new URL('./home-page.html', import.meta.url));
    if (!response.ok) {
      throw new Error(`Failed to load home page template: ${response.status}`);
    }
    templateCache = await response.text();
    return templateCache;
  },

  async mount() {
    await this.importComponents();
    await this.loadFeaturedRecipes();
  },

  async unmount() {
    // Nothing to clean up
  },

  getTitle() {
    return AppConfig.title;
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
        import('../../lib/utilities/recipe-scroller/recipe-scroller.js'),
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

    const recipeScroller = document.querySelector('recipe-scroller');
    const recipesContainer = recipeScroller?.querySelector('[slot="items"]');

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

      // Apply styles after all cards are added
      if (recipeScroller && typeof recipeScroller.applyItemStyles === 'function') {
        recipeScroller.applyItemStyles();
      }

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
    } catch (error) {
      console.error('Error fetching featured recipes:', error);
      messageContainer.innerHTML = 'Error loading featured recipes. Please try again later.';
    }
  },
};
