/**
 * RecipeMetadataFields Component
 * -----------------------------
 * Handles static metadata fields for recipe forms including:
 * - Name, Category, Times, Servings, Difficulty, Main Ingredient, Tags
 *
 * This component is focused on simple data binding without complex interactions.
 */

import styles from '../recipe_form_component.css?inline';

class RecipeMetadataFields extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupInputListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${this.template()}
    `;
  }

  template() {
    return `
      <div class="recipe-metadata-fields">
        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="name" class="recipe-form__label">שם המנה:</label>
            <input type="text" id="name" name="name" class="recipe-form__input">
          </div>
          <div class="recipe-form__group">
            <label for="dish-type" class="recipe-form__label">סוג מנה:</label>
            <select id="dish-type" name="dish-type" class="recipe-form__select">
              <option value="">בחר סוג מנה</option>
              <option value="appetizers">מנות ראשונות</option>
              <option value="main-courses">מנות עיקריות</option>
              <option value="side-dishes">תוספות</option>
              <option value="soups-stews">מרקים ותבשילים</option>
              <option value="salads">סלטים</option>
              <option value="desserts">קינוחים</option>
              <option value="breakfast-brunch">ארוחות בוקר</option>
              <option value="snacks">חטיפים</option>
              <option value="beverages">משקאות</option>
            </select>
          </div>
        </div>

        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="prep-time" class="recipe-form__label">זמן הכנה (בדקות):</label>
            <input type="number" id="prep-time" name="prep-time" class="recipe-form__input" min="0">
          </div>
          <div class="recipe-form__group">
            <label for="wait-time" class="recipe-form__label">זמן המתנה (בדקות):</label>
            <input type="number" id="wait-time" name="wait-time" class="recipe-form__input" min="0">
          </div>
        </div>

        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="servings-form" class="recipe-form__label">מספר מנות:</label>
            <input type="number" id="servings-form" name="servings" class="recipe-form__input" min="1">
          </div>
          <div class="recipe-form__group">
            <label for="difficulty" class="recipe-form__label">דרגת קושי:</label>
            <select id="difficulty" name="difficulty" class="recipe-form__select">
              <option value="">בחר דרגת קושי</option>
              <option value="קלה">קלה</option>
              <option value="בינונית">בינונית</option>
              <option value="קשה">קשה</option>
            </select>
          </div>
        </div>

        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="main-ingredient" class="recipe-form__label">מרכיב עיקרי:</label>
            <input type="text" id="main-ingredient" name="main-ingredient" class="recipe-form__input">
          </div>
          <div class="recipe-form__group">
            <label for="tags" class="recipe-form__label">תגיות:</label>
            <input type="text" id="tags" name="tags" class="recipe-form__input">
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Populates the metadata fields with recipe data
   * @param {Object} data - Recipe data object
   */
  populateFields(data) {
    if (!data) return;

    const fieldMappings = [
      { field: 'name', id: 'name' },
      { field: 'category', id: 'dish-type' },
      { field: 'prepTime', id: 'prep-time' },
      { field: 'waitTime', id: 'wait-time' },
      { field: 'servings', id: 'servings-form' },
      { field: 'difficulty', id: 'difficulty' },
      { field: 'mainIngredient', id: 'main-ingredient' },
      {
        field: 'tags',
        id: 'tags',
        transform: (tags) => (Array.isArray(tags) ? tags.join(', ') : tags),
      },
    ];

    fieldMappings.forEach(({ field, id, transform }) => {
      const element = this.shadowRoot.getElementById(id);
      if (element && data[field] !== undefined) {
        element.value = transform ? transform(data[field]) : data[field];
      }
    });
  }

  /**
   * Clears all metadata fields
   */
  clearFields() {
    const inputs = this.shadowRoot.querySelectorAll('input, select');
    inputs.forEach((input) => {
      if (input.type === 'number') {
        input.value = '';
      } else {
        input.value = '';
        if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        }
      }
      input.classList.remove('recipe-form__input--invalid');
    });
  }

  /**
   * Sets disabled state for all fields
   * @param {boolean} disabled - Whether to disable the fields
   */
  setDisabled(disabled) {
    const inputs = this.shadowRoot.querySelectorAll('input, select');
    inputs.forEach((input) => {
      input.disabled = disabled;
    });
  }

  /**
   * Gets all form data from metadata fields
   * @returns {Object} - Object containing all metadata field values
   */
  getFormData() {
    const data = {};

    const fieldMappings = [
      { field: 'name', id: 'name' },
      { field: 'category', id: 'dish-type' },
      { field: 'prepTime', id: 'prep-time', isNumeric: true },
      { field: 'waitTime', id: 'wait-time', isNumeric: true },
      { field: 'servings', id: 'servings-form', isNumeric: true },
      { field: 'difficulty', id: 'difficulty' },
      { field: 'mainIngredient', id: 'main-ingredient' },
      {
        field: 'tags',
        id: 'tags',
        transform: (value) => (value ? value.split(',').map((tag) => tag.trim()) : []),
      },
    ];

    fieldMappings.forEach(({ field, id, isNumeric, transform }) => {
      const element = this.shadowRoot.getElementById(id);
      if (element) {
        let value = element.value.trim();

        if (isNumeric) {
          value = value ? parseInt(value, 10) : 0;
        } else if (transform) {
          value = transform(value);
        } else if (field === 'mainIngredient' && value === '') {
          // Convert empty main ingredient to null for consistency
          value = null;
        }

        data[field] = value;
      }
    });

    return data;
  }

  /**
   * Sets up input event listeners to clear errors on value change
   */
  setupInputListeners() {
    const inputs = this.shadowRoot.querySelectorAll('input, select');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        // Clear error highlighting when user changes the value
        input.classList.remove('recipe-form__input--invalid');
      });
    });
  }

  /**
   * Sets validation state for specific fields
   * @param {Object} fieldErrors - Object mapping field names to error states
   */
  setValidationState(fieldErrors = {}) {
    const fieldMappings = [
      { field: 'name', id: 'name' },
      { field: 'category', id: 'dish-type' },
      { field: 'prepTime', id: 'prep-time' },
      { field: 'waitTime', id: 'wait-time' },
      { field: 'servings', id: 'servings-form' },
      { field: 'difficulty', id: 'difficulty' },
      { field: 'mainIngredient', id: 'main-ingredient' },
      { field: 'tags', id: 'tags' },
    ];

    fieldMappings.forEach(({ field, id }) => {
      const element = this.shadowRoot.getElementById(id);
      if (element) {
        if (fieldErrors[field]) {
          element.classList.add('recipe-form__input--invalid');
        } else {
          element.classList.remove('recipe-form__input--invalid');
        }
      }
    });
  }
}

customElements.define('recipe-metadata-fields', RecipeMetadataFields);
