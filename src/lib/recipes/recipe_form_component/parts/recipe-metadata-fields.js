/**
 * RecipeMetadataFields Component
 * Handles recipe detail + metadata fields:
 * name, category, description, times, servings + unit, difficulty, main ingredient, tags
 */

import styles from '../recipe_form_component.css?inline';
import { CATEGORY_MAP } from '../../../../js/utils/recipes/recipe-data-utils.js';

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

  generateCategoryOptions() {
    return Object.entries(CATEGORY_MAP)
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join('\n              ');
  }

  template() {
    return `
      <div class="recipe-metadata-fields" dir="rtl">

        <!-- Name (full width, large) -->
        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="name" class="recipe-form__label">שם המנה <span class="recipe-form__req">*</span></label>
            <input type="text" id="name" name="name" class="recipe-form__input recipe-form__input--title"
              placeholder="שם המתכון..." />
            <span class="recipe-form__hint">השם שהמשפחה קוראת לו.</span>
          </div>
        </div>

        <!-- Category + Main ingredient -->
        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="dish-type" class="recipe-form__label">קטגוריה <span class="recipe-form__req">*</span></label>
            <select id="dish-type" name="dish-type" class="recipe-form__select">
              <option value="">בחר קטגוריה</option>
              ${this.generateCategoryOptions()}
            </select>
          </div>
          <div class="recipe-form__group">
            <label for="main-ingredient" class="recipe-form__label">מרכיב עיקרי</label>
            <input type="text" id="main-ingredient" name="main-ingredient" class="recipe-form__input"
              placeholder="עוף, בצק, גבינה..." />
          </div>
        </div>

        <!-- Description -->
        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="description" class="recipe-form__label">תיאור קצר</label>
            <textarea id="description" name="description" class="recipe-form__textarea"
              style="min-height: 72px;"
              placeholder="משפט-שניים. יוצג על כרטיס המתכון."></textarea>
            <span class="recipe-form__hint">אופציונלי · מוצג על כרטיס המתכון ובדף המתכון.</span>
          </div>
        </div>

        <!-- Times -->
        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="prep-time" class="recipe-form__label">זמן הכנה פעיל (דקות) <span class="recipe-form__req">*</span></label>
            <input type="number" id="prep-time" name="prep-time" class="recipe-form__input" min="0" placeholder="45" />
          </div>
          <div class="recipe-form__group">
            <label for="wait-time" class="recipe-form__label">זמן כולל (דקות) <span class="recipe-form__req">*</span></label>
            <input type="number" id="wait-time" name="wait-time" class="recipe-form__input" min="0" placeholder="360" />
          </div>
        </div>

        <!-- Servings + unit -->
        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="servings-form" class="recipe-form__label">כמות <span class="recipe-form__req">*</span></label>
            <div class="recipe-form__yield-row">
              <input type="number" id="servings-form" name="servings" class="recipe-form__input recipe-form__input--number" min="1" placeholder="4" />
              <input type="text" id="servings-unit" name="servings-unit"
                class="recipe-form__input recipe-form__select--unit"
                placeholder="מנות, כיכרות..." />
            </div>
          </div>
          <div class="recipe-form__group">
            <label for="difficulty" class="recipe-form__label">דרגת קושי <span class="recipe-form__req">*</span></label>
            <select id="difficulty" name="difficulty" class="recipe-form__select">
              <option value="">בחר דרגת קושי</option>
              <option value="קלה">קלה</option>
              <option value="בינונית">בינונית</option>
              <option value="קשה">קשה</option>
            </select>
          </div>
        </div>

        <!-- Tags -->
        <div class="recipe-form__row">
          <div class="recipe-form__group">
            <label for="tags" class="recipe-form__label">תגיות</label>
            <input type="text" id="tags" name="tags" class="recipe-form__input"
              placeholder="פסח, שבת, טבעוני..." />
            <span class="recipe-form__hint">מופרדות בפסיק.</span>
          </div>
        </div>

      </div>
    `;
  }

  populateFields(data) {
    if (!data) return;

    const fieldMappings = [
      { field: 'name', id: 'name' },
      { field: 'category', id: 'dish-type' },
      { field: 'description', id: 'description' },
      { field: 'prepTime', id: 'prep-time' },
      { field: 'waitTime', id: 'wait-time' },
      { field: 'servings', id: 'servings-form' },
      { field: 'servingsUnit', id: 'servings-unit' },
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

  clearFields() {
    const inputs = this.shadowRoot.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.value = '';
      if (input.tagName === 'SELECT') input.selectedIndex = 0;
      input.classList.remove('recipe-form__input--invalid');
    });
  }

  setDisabled(disabled) {
    const inputs = this.shadowRoot.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.disabled = disabled;
    });
  }

  getFormData() {
    const data = {};

    const fieldMappings = [
      { field: 'name', id: 'name' },
      { field: 'category', id: 'dish-type' },
      { field: 'description', id: 'description' },
      { field: 'prepTime', id: 'prep-time', isNumeric: true },
      { field: 'waitTime', id: 'wait-time', isNumeric: true },
      { field: 'servings', id: 'servings-form', isNumeric: true },
      { field: 'servingsUnit', id: 'servings-unit' },
      { field: 'difficulty', id: 'difficulty' },
      { field: 'mainIngredient', id: 'main-ingredient' },
      {
        field: 'tags',
        id: 'tags',
        transform: (value) =>
          value
            ? value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
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
          value = null;
        } else if (field === 'description' && value === '') {
          value = null;
        }

        data[field] = value;
      }
    });

    return data;
  }

  setupInputListeners() {
    this.shadowRoot.addEventListener('input', (event) => {
      const target = event.target;
      if (target.matches('input, select, textarea')) {
        target.classList.remove('recipe-form__input--invalid');
      }
    });
  }

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
