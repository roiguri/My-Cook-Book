// recipe-filter-demo.js
class RecipeFilterDemo {
  constructor() {
      this.filter = document.getElementById('demo-filter');
      this.openDefaultButton = document.querySelector('.open-filter-default');
      this.openCustomButton = document.querySelector('.open-filter-custom');
      this.customizationControls = {
          category: document.getElementById('filter-category'),
          cookingTimeEnabled: document.getElementById('cooking-time-enabled'),
          difficultyEnabled: document.getElementById('difficulty-enabled'),
          ingredientEnabled: document.getElementById('ingredient-enabled'),
          tagsEnabled: document.getElementById('tags-enabled'),
          favoritesOnly: document.getElementById('favorites-only')
      };
      
      this.initializeDemo();
  }

  initializeDemo() {
      // Setup default filter open button
      if (this.openDefaultButton && this.filter) {
          this.openDefaultButton.addEventListener('click', () => {
              this.filter.open();
          });
      }

      // Setup custom filter open button
      if (this.openCustomButton && this.filter) {
          this.openCustomButton.addEventListener('click', () => {
              // Apply some preset filters before opening
              this.filter.setAttribute('category', 'main-courses');
              this.filter.open();
          });
      }

      // Setup customization controls
      const applyButton = document.querySelector('.customization-sidebar .apply-customization');
      if (applyButton) {
          applyButton.addEventListener('click', () => this.applyCustomizations());
      }

      // Setup event logging
      this.setupEventLogging();
      
      // Initial code snippet update
      this.updateCodeSnippet();
  }

  applyCustomizations() {
      if (!this.filter) return;
      
      const { 
          category,
          cookingTimeEnabled,
          difficultyEnabled,
          ingredientEnabled,
          tagsEnabled,
          favoritesOnly
      } = this.customizationControls;

      // Apply attributes based on customization controls
      if (category.value) {
          this.filter.setAttribute('category', category.value);
      } else {
          this.filter.removeAttribute('category');
      }

      this.filter.setAttribute('cooking-time-filter', cookingTimeEnabled.checked);
      this.filter.setAttribute('difficulty-filter', difficultyEnabled.checked);
      this.filter.setAttribute('ingredient-filter', ingredientEnabled.checked);
      this.filter.setAttribute('tags-filter', tagsEnabled.checked);

      if (favoritesOnly.checked) {
          this.filter.setAttribute('favorites-only', '');
      } else {
          this.filter.removeAttribute('favorites-only');
      }

      this.updateCodeSnippet();
      
      // Open the filter to show changes
      this.filter.open();
  }

  updateCodeSnippet() {
      const { 
          category,
          cookingTimeEnabled,
          difficultyEnabled,
          ingredientEnabled,
          tagsEnabled,
          favoritesOnly
      } = this.customizationControls;

      const attributes = [];
      
      if (category.value) {
          attributes.push(`category="${category.value}"`);
      }
      if (cookingTimeEnabled.checked) {
          attributes.push('cooking-time-filter="true"');
      }
      if (difficultyEnabled.checked) {
          attributes.push('difficulty-filter="true"');
      }
      if (ingredientEnabled.checked) {
          attributes.push('ingredient-filter="true"');
      }
      if (tagsEnabled.checked) {
          attributes.push('tags-filter="true"');
      }
      if (favoritesOnly.checked) {
          attributes.push('favorites-only');
      }

      const code = `
<recipe-filter-component
  ${attributes.join('\n    ')}>
</recipe-filter-component>

<script>
const filter = document.querySelector('recipe-filter-component');

// Open filter modal
filter.open();

// Handle filter events
filter.addEventListener('filter-applied', (e) => {
  const { recipes, filters } = e.detail;
  console.log('Filtered recipes:', recipes);
  console.log('Applied filters:', filters);
});

filter.addEventListener('filter-reset', (e) => {
  const { category } = e.detail;
  console.log('Filters reset for category:', category);
});
</script>`.trim();

      window.gallery.updateCodeSnippet('recipe-filter', code);
  }

  setupEventLogging() {
      const eventLog = document.getElementById('filter-event-log');
      
      // Monitor all relevant events
      ['filter-applied', 'filter-reset', 'modal-opened', 'modal-closed'].forEach(eventName => {
          this.filter.addEventListener(eventName, (e) => {
              const timestamp = new Date().toLocaleTimeString();
              const eventEntry = document.createElement('div');
              eventEntry.className = 'event-entry';
              
              let detailText = '';
              if (e.detail) {
                  if (e.detail.recipes) {
                      detailText = ` (${e.detail.recipes.length} recipes matched)`;
                  } else if (e.detail.category) {
                      detailText = ` (category: ${e.detail.category || 'all'})`;
                  }
              }
              
              eventEntry.textContent = `${timestamp}: ${eventName}${detailText}`;
              
              const emptyMessage = eventLog.querySelector('.event-log-empty');
              if (emptyMessage) {
                  eventLog.removeChild(emptyMessage);
              }
              
              eventLog.insertBefore(eventEntry, eventLog.firstChild);
          });
      });
  }
}

// Initialize demo when script loads
new RecipeFilterDemo();