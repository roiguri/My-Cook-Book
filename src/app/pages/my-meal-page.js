import authService from '../../js/services/auth-service.js';
import { firestoreService } from '../../js/services/firestore-service.js';
import { getRecipeById, calculateTotalTime, scaleIngredientSections } from '../../js/utils/recipes/recipe-data-utils.js';
import { formatIngredientAmount, scaleIngredients } from '../../js/utils/recipes/recipe-ingredients-utils.js';
import { onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '../../js/services/firebase-service.js';
import { AppConfig } from '../../js/config/app-config.js';
import '../../styles/pages/my-meal-page.css';

export default {
  async render() {
    const response = await fetch(new URL('./my-meal-page.html', import.meta.url));
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  },

  async mount(container) {
    this.container = container;
    this.currentUser = authService.getCurrentUser();

    if (!this.currentUser) {
      // Redirect to home or login if not authenticated
      // For now, let's show a message
      container.innerHTML = '<div class="error-message">יש להתחבר כדי להשתמש בארוחה שלי</div>';
      return;
    }

    this.state = {
      meal: null,
      recipes: {}, // Cache for recipe data
      activeTabId: null,
      drawerOpen: false,
      ingredientsView: 'all' // 'all' or 'current'
    };

    await this.initializeRecipeComponent();
    this.setupIngredientsDrawer();
    this.subscribeToMealData();
  },

  async initializeRecipeComponent() {
    await import('../../lib/recipes/recipe_component/recipe_component.js');
  },

  subscribeToMealData() {
    const db = getFirestoreInstance();
    const docRef = doc(db, 'active_meals', this.currentUser.uid);

    this.unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const mealData = docSnap.data();
        await this.updateMealState(mealData);
      } else {
        // No active meal, create one or show empty state
        this.renderEmptyState();
      }
    });
  },

  async updateMealState(mealData) {
    this.state.meal = mealData;

    // Fetch missing recipes
    const recipeIds = mealData.recipeIds || [];
    const missingIds = recipeIds.filter(id => !this.state.recipes[id]);

    if (missingIds.length > 0) {
      await Promise.all(missingIds.map(async (id) => {
        try {
          const recipe = await getRecipeById(id);
          if (recipe) {
            this.state.recipes[id] = recipe;
          }
        } catch (error) {
          console.error(`Failed to fetch recipe ${id}`, error);
        }
      }));
    }

    // Determine active recipe
    const activeRecipeId = mealData.activeRecipeId || (recipeIds.length > 0 ? recipeIds[0] : null);

    // Render tabs
    this.renderTabs(recipeIds, activeRecipeId);

    // Render active recipe
    if (activeRecipeId && activeRecipeId !== this.state.activeTabId) {
       this.renderActiveRecipe(activeRecipeId);
    } else if (activeRecipeId) {
       // Just update attributes if needed (e.g. if updated from another device)
       // But we need to be careful not to override local interaction if it's lagging
       // For now, let's assume RecipeComponent handles its own internal state unless we explicitly change activeRecipeId
       // Actually, we should sync servings and step if they changed externally
       this.syncActiveRecipeState(activeRecipeId);
    }

    // Update ingredients list if drawer is open
    if (this.state.drawerOpen) {
      this.renderIngredientsList();
    }
  },

  renderTabs(recipeIds, activeId) {
    const tabList = this.container.querySelector('.kitchen-switcher');
    tabList.innerHTML = '';

    recipeIds.forEach(id => {
      const recipe = this.state.recipes[id];
      if (!recipe) return;

      const totalTime = calculateTotalTime(recipe);
      const timeClass = this.getTimeClass(totalTime);
      const isActive = id === activeId;

      const tab = document.createElement('button');
      tab.className = `recipe-tab ${isActive ? 'active' : ''} ${timeClass}`;

      const tabName = document.createElement('span');
      tabName.className = 'tab-name';
      tabName.textContent = recipe.name;

      const tabTime = document.createElement('span');
      tabTime.className = 'tab-time';
      tabTime.textContent = this.formatDuration(totalTime);

      tab.appendChild(tabName);
      tab.appendChild(tabTime);

      tab.addEventListener('click', () => this.switchRecipe(id));
      tabList.appendChild(tab);
    });

    if (recipeIds.length === 0) {
      this.renderEmptyState();
    }
  },

  getTimeClass(minutes) {
    if (minutes <= 30) return 'quick';
    if (minutes <= 60) return 'medium';
    return 'long';
  },

  formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} ש' ${m > 0 ? `${m} ד'` : ''}`;
    return `${m} ד'`;
  },

  async switchRecipe(recipeId) {
    if (this.state.activeTabId === recipeId) return;

    // Save current state is handled by event listeners on the component

    // Update active recipe in Firestore
    try {
      await firestoreService.updateDocument('active_meals', this.currentUser.uid, {
        activeRecipeId: recipeId,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error switching recipe:', error);
    }
  },

  renderActiveRecipe(recipeId) {
    this.state.activeTabId = recipeId;
    const container = this.container.querySelector('#recipe-container');
    container.innerHTML = '';

    const recipeState = this.state.meal.recipeStates?.[recipeId] || {};

    const component = document.createElement('recipe-component');
    component.setAttribute('recipe-id', recipeId);

    if (recipeState.servings) {
        component.setAttribute('initial-servings', recipeState.servings);
    }

    if (recipeState.currentStepIndex !== undefined) {
        component.setAttribute('active-step', recipeState.currentStepIndex);
    }

    // Listen for state changes
    component.addEventListener('active-step-changed', (e) => {
        this.updateRecipeState(recipeId, { currentStepIndex: e.detail.stepIndex });
    });

    component.addEventListener('servings-changed', (e) => {
        this.updateRecipeState(recipeId, { servings: e.detail.servings });
        if (this.state.drawerOpen) this.renderIngredientsList();
    });

    container.appendChild(component);
  },

  syncActiveRecipeState(recipeId) {
      const container = this.container.querySelector('#recipe-container');
      const component = container.querySelector('recipe-component');
      if (!component || component.getAttribute('recipe-id') !== recipeId) return;

      const recipeState = this.state.meal.recipeStates?.[recipeId] || {};

      // Update attributes if they differ from current (this might cause re-renders or updates in component)
      // We check if the attribute is different to avoid unnecessary updates
      if (recipeState.servings && component.getAttribute('initial-servings') != recipeState.servings) {
          component.setAttribute('initial-servings', recipeState.servings);
      }

      if (recipeState.currentStepIndex !== undefined && component.getAttribute('active-step') != recipeState.currentStepIndex) {
          component.setAttribute('active-step', recipeState.currentStepIndex);
      }
  },

  async updateRecipeState(recipeId, updates) {
    const currentStates = this.state.meal.recipeStates || {};
    const currentState = currentStates[recipeId] || {};

    const newState = {
        ...currentStates,
        [recipeId]: {
            ...currentState,
            ...updates
        }
    };

    try {
        // Debounce could be added here if needed
        await firestoreService.updateDocument('active_meals', this.currentUser.uid, {
            recipeStates: newState,
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating recipe state:', error);
    }
  },

  setupIngredientsDrawer() {
    const drawer = this.container.querySelector('#ingredients-drawer');
    const backdrop = this.container.querySelector('#drawer-backdrop');
    const toggleBtn = this.container.querySelector('#toggle-ingredients-btn');
    const closeBtn = this.container.querySelector('#close-drawer-btn');
    const viewAllBtn = this.container.querySelector('#view-all-ingredients');
    const viewRecipeBtn = this.container.querySelector('#view-recipe-ingredients');

    const toggleDrawer = () => {
      this.state.drawerOpen = !this.state.drawerOpen;
      if (this.state.drawerOpen) {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        this.renderIngredientsList();
      } else {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
      }
    };

    toggleBtn.addEventListener('click', toggleDrawer);
    closeBtn.addEventListener('click', toggleDrawer);
    backdrop.addEventListener('click', toggleDrawer);

    viewAllBtn.addEventListener('click', () => {
        this.state.ingredientsView = 'all';
        viewAllBtn.classList.add('active');
        viewRecipeBtn.classList.remove('active');
        this.renderIngredientsList();
    });

    viewRecipeBtn.addEventListener('click', () => {
        this.state.ingredientsView = 'current';
        viewRecipeBtn.classList.add('active');
        viewAllBtn.classList.remove('active');
        this.renderIngredientsList();
    });
  },

  renderIngredientsList() {
    const listContainer = this.container.querySelector('#ingredients-list-container');
    listContainer.innerHTML = '';

    const recipeIds = this.state.ingredientsView === 'current'
        ? (this.state.activeTabId ? [this.state.activeTabId] : [])
        : (this.state.meal?.recipeIds || []);

    const allIngredients = [];

    recipeIds.forEach(id => {
        const recipe = this.state.recipes[id];
        const state = this.state.meal.recipeStates?.[id];

        if (!recipe) return;

        const servings = state?.servings || recipe.servings;
        const originalIngredients = recipe.ingredientSections || recipe.ingredients;

        let scaledIngredients;
        if (recipe.ingredientSections) {
             scaledIngredients = scaleIngredientSections(originalIngredients, recipe.servings, servings);
             scaledIngredients.forEach(section => {
                 section.items.forEach(item => {
                     allIngredients.push({ ...item, recipeName: recipe.name });
                 });
            });
        } else {
             scaledIngredients = scaleIngredients(originalIngredients, recipe.servings, servings);
             scaledIngredients.forEach(item => {
                allIngredients.push({ ...item, recipeName: recipe.name });
            });
        }
    });

    // Consolidate ingredients (optional, simple list for now)
    // To properly consolidate, we need to normalize units and names, which might be complex.
    // For now, let's list them grouped by recipe if viewing all, or just list them.

    // Group by recipe for clarity when viewing "All"
    if (this.state.ingredientsView === 'all') {
        recipeIds.forEach(id => {
            const recipe = this.state.recipes[id];
            if (!recipe) return;

            const recipeHeader = document.createElement('h3');
            recipeHeader.textContent = recipe.name;
            listContainer.appendChild(recipeHeader);

            const ul = document.createElement('ul');
            const state = this.state.meal.recipeStates?.[id];
            const servings = state?.servings || recipe.servings;
            const originalIngredients = recipe.ingredientSections || recipe.ingredients;

            let scaledIngredients;
            if (recipe.ingredientSections) {
                scaledIngredients = scaleIngredientSections(originalIngredients, recipe.servings, servings);
            } else {
                scaledIngredients = scaleIngredients(originalIngredients, recipe.servings, servings);
            }

             const renderItems = (items) => {
                 items.forEach(item => {
                    const li = document.createElement('li');

                    const amountSpan = document.createElement('span');
                    amountSpan.className = 'amount';
                    amountSpan.textContent = formatIngredientAmount(item.amount);

                    const unitSpan = document.createElement('span');
                    unitSpan.className = 'unit';
                    unitSpan.textContent = item.unit;

                    const itemSpan = document.createElement('span');
                    itemSpan.className = 'item';
                    itemSpan.textContent = item.item;

                    li.appendChild(amountSpan);
                    li.appendChild(document.createTextNode(' '));
                    li.appendChild(unitSpan);
                    li.appendChild(document.createTextNode(' '));
                    li.appendChild(itemSpan);

                    ul.appendChild(li);
                 });
             };

             if (recipe.ingredientSections) {
                 scaledIngredients.forEach(section => {
                     if (section.title) {
                         const sectionTitle = document.createElement('li');
                         sectionTitle.className = 'section-title';
                         sectionTitle.textContent = section.title;
                         ul.appendChild(sectionTitle);
                     }
                     renderItems(section.items);
                 });
             } else {
                 renderItems(scaledIngredients);
             }
             listContainer.appendChild(ul);
        });
    } else {
        // Single recipe view
        if (recipeIds.length > 0) {
            const recipe = this.state.recipes[recipeIds[0]];
            const state = this.state.meal.recipeStates?.[recipeIds[0]];
            const servings = state?.servings || recipe.servings;
            const originalIngredients = recipe.ingredientSections || recipe.ingredients;

            let scaledIngredients;
            if (recipe.ingredientSections) {
                scaledIngredients = scaleIngredientSections(originalIngredients, recipe.servings, servings);
            } else {
                scaledIngredients = scaleIngredients(originalIngredients, recipe.servings, servings);
            }

             const ul = document.createElement('ul');

             const renderItems = (items) => {
                 items.forEach(item => {
                    const li = document.createElement('li');

                    const amountSpan = document.createElement('span');
                    amountSpan.className = 'amount';
                    amountSpan.textContent = formatIngredientAmount(item.amount);

                    const unitSpan = document.createElement('span');
                    unitSpan.className = 'unit';
                    unitSpan.textContent = item.unit;

                    const itemSpan = document.createElement('span');
                    itemSpan.className = 'item';
                    itemSpan.textContent = item.item;

                    li.appendChild(amountSpan);
                    li.appendChild(document.createTextNode(' '));
                    li.appendChild(unitSpan);
                    li.appendChild(document.createTextNode(' '));
                    li.appendChild(itemSpan);

                    ul.appendChild(li);
                 });
             };

             if (recipe.ingredientSections) {
                 scaledIngredients.forEach(section => {
                     if (section.title) {
                         const sectionTitle = document.createElement('li');
                         sectionTitle.className = 'section-title';
                         sectionTitle.textContent = section.title;
                         ul.appendChild(sectionTitle);
                     }
                     renderItems(section.items);
                 });
             } else {
                 renderItems(scaledIngredients);
             }
             listContainer.appendChild(ul);
        }
    }
  },

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-utensils fa-3x"></i>
        <h2>אין ארוחה פעילה</h2>
        <p>התחל להוסיף מתכונים לארוחה שלך כדי לראות אותם כאן.</p>
        <a href="/categories" class="btn-primary">חפש מתכונים</a>
      </div>
    `;
  },

  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },

  getTitle() {
    return AppConfig.getPageTitle('הארוחה שלי');
  },

  getMeta() {
      return {
          description: 'Manage your cooking session',
          keywords: 'cooking, meal, recipes'
      };
  }
};
