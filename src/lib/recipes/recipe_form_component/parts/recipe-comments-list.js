/**
 * RecipeCommentsList Component
 * ----------------------------
 * Specialized dynamic list component for managing recipe comments.
 * Extends DynamicListComponent to provide single-field comments.
 */

import { DynamicListComponent } from './dynamic-list-component.js';

class RecipeCommentsList extends DynamicListComponent {
  constructor() {
    super();
    this.listTitle = this.getAttribute('title') || 'הערות משפחה:';
    this.containerClass = 'recipe-form__comments-list';
    this.itemClass = 'recipe-form__comment-entry';
    this.addButtonClass = 'recipe-form__button--add-comment';
    this.removeButtonClass = 'recipe-form__button--remove-comment';

    this.itemFields = [
      {
        placeholder: 'טיפ, תחליף, זיכרון...',
        className: 'recipe-form__input--comment',
        name: 'comment',
      },
    ];
  }

  /**
   * Creates a new list item with the specified fields.
   * Overridden to match the button order (minus then plus) of ingredients.
   * @param {boolean} includeRemoveButton - Whether to include remove button
   */
  createListItem(includeRemoveButton = true) {
    const fieldsHTML = this.itemFields
      .map(
        (field) =>
          `<input type="text" class="recipe-form__input ${field.className || ''}" 
              placeholder="${field.placeholder}" name="${field.name || ''}">`,
      )
      .join('');

    const removeButtonHTML = `<button type="button" class="recipe-form__button ${this.removeButtonClass}"${!includeRemoveButton ? ' style="visibility:hidden;pointer-events:none"' : ''}>-</button>`;

    return `
      <div class="${this.itemClass}">
        ${fieldsHTML}
        ${removeButtonHTML}
        <button type="button" class="recipe-form__button ${this.addButtonClass}">+</button>
      </div>
    `;
  }

  createInitialItem() {
    return this.createListItem(false);
  }

  /**
   * Gets all non-empty comments from the list
   * @returns {string[]} Array of strings
   */
  getData() {
    const container = this.shadowRoot.querySelector('.list-items-container');
    const items = container.querySelectorAll(`.${this.itemClass}`);
    const data = [];

    items.forEach((item) => {
      const input = item.querySelector('input');
      if (input && input.value.trim()) {
        data.push(input.value.trim());
      }
    });

    return data;
  }

  /**
   * Populates the list with comments
   * @param {string[]} comments - Array of comment strings
   */
  populateData(comments) {
    if (!Array.isArray(comments) || comments.length === 0) {
      this.clearList();
      return;
    }

    const container = this.shadowRoot.querySelector('.list-items-container');
    container.innerHTML = '';

    comments.forEach((comment, index) => {
      const includeRemove = index > 0 || comments.length > 1;
      const itemHTML = this.createListItem(includeRemove);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = itemHTML;
      const itemElement = tempDiv.firstElementChild;

      const input = itemElement.querySelector('input');
      if (input) {
        input.value = typeof comment === 'string' ? comment : '';
      }

      container.appendChild(itemElement);
    });
  }

  /**
   * Updates the first item's remove button based on total count.
   * Overridden to maintain button order (minus then plus).
   */
  updateFirstItemRemoveButton() {
    const container = this.shadowRoot.querySelector('.list-items-container');
    const items = container.querySelectorAll(`.${this.itemClass}`);
    if (items.length === 0) return;

    const firstItem = items[0];
    const removeButton = firstItem.querySelector(`.${this.removeButtonClass}`);

    if (items.length === 1) {
      if (removeButton) {
        removeButton.style.visibility = 'hidden';
        removeButton.style.pointerEvents = 'none';
      }
    } else if (items.length > 1) {
      if (removeButton) {
        removeButton.style.visibility = '';
        removeButton.style.pointerEvents = '';
      }
    }
  }

  /**
   * Sets validation state for the comments list
   * @param {Object} errors - Validation errors
   */
  setValidationState(errors) {
    const inputs = this.shadowRoot.querySelectorAll('input');
    inputs.forEach((input) => {
      input.classList.remove('recipe-form__input--invalid');
    });

    if (errors && errors.comments) {
      inputs.forEach((input) => {
        input.classList.add('recipe-form__input--invalid');
      });
    }
  }
}

customElements.define('recipe-comments-list', RecipeCommentsList);

export { RecipeCommentsList };
