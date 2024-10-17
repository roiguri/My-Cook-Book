/**
 * Recipe Preview Modal Component
 *
 * This web component displays a recipe preview in a modal dialog. It combines the functionality 
 * of the `recipe-component` to show recipe details and the `custom-modal` for the modal structure.
 *
 * Usage:
 *
 * 1. Include the `recipe-preview-modal.js` script in your HTML file.
 *
 * 2. Add the `<recipe-preview-modal>` element to your page.
 *
 * 3. Set the following attributes on the `<recipe-preview-modal>` element:
 *    - `recipe-id`: The ID of the recipe to preview.
 *    - `recipe-name`: The name of the recipe to display in the modal title.
 *    - `show-buttons`: (Optional) Set to 'true' to show Approve/Reject buttons.
 *
 * 4.  Get a reference to the `<recipe-preview-modal>` element in your JavaScript code.
 *
 * 5.  Call the `openModal()` method on the element to open the modal.
 *
 * Example:
 *
 * ```html
 * <recipe-preview-modal id="recipe-preview" recipe-id="recipe123" recipe-name="Delicious Cake" show-buttons="true"></recipe-preview-modal>
 * <button id="preview-button">Preview Recipe</button> 
 * <script>
 *   const previewButton = document.getElementById('preview-button');
 *   const recipePreviewModal = document.getElementById('recipe-preview');
 *   previewButton.addEventListener('click', () => {
 *     recipePreviewModal.openModal(); 
 *   });
 * </script>
 * ```
 *
 * Events:
 *
 * The component dispatches the following custom events:
 *
 * - `recipe-approved`: Dispatched when the Approve button is clicked.
 * - `recipe-rejected`: Dispatched when the Reject button is clicked.
 *
 * Both events include an object with the `recipeId` in the `detail` property. You can listen 
 * for these events on the `<recipe-preview-modal>` element to handle the approval or rejection 
 * logic in your parent component.
 */

class RecipePreviewModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.recipeId = this.getAttribute('recipe-id');
    this.showButtons = this.getAttribute('show-buttons') === 'true';
    this.recipeName = this.getAttribute('recipe-name');
    this.render();
    this.modal = this.shadowRoot.querySelector('custom-modal');
    this.modal.setAttribute('modal-title', `Preview: ${this.recipeName}`);
    this.shadowRoot.querySelector('recipe-component').setAttribute('recipe-id', this.recipeId);
    this.setupButtons();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${this.styles()}
      </style>
      ${this.template()}
    `;
  }

  styles() {
    return `
      :root {
        --heading-font: 'Amatic SC', cursive;
        --body-font: 'Lora', serif;
        --nav-font: 'Source Sans Pro', sans-serif;
        --primary-color: #bb6016;
        --primary-hover: #5c4033;
        --secondary-color: #e6dfd1;
        --text-color: #3a3a3a;
        --background-color: #f5f2e9;
        --submenu-color: #4CAF50; 
        --disabled-color: #cccccc;
      }

      .recipe-preview-modal .modal-content {
        max-width: 600px;
        outline: 1px solid black;
        border-radius: 10px;
        background-color: transparent;
      }

      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
      }

      .modal-content {
        background-color: #fefefe;
        margin: 15% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
      }

      .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
      }

      .close:hover,
      .close:focus {
        color: black;
        text-decoration: none;
        cursor: pointer;
      }

      .modal-buttons {
        display: flex;
        justify-content: space-around;
        margin-top: 20px;
      }
    `;
  }

  template() {
    return `
      <div class="recipe-preview-modal">
        <custom-modal width="auto" modal-title="Recipe Preview">
          <div class="modal-content">
            <recipe-component recipe-id="${this.recipeId}"></recipe-component>
            <div class="modal-buttons" id="modal-buttons">
              <button id="approve-button">Approve</button>
              <button id="reject-button">Reject</button>
            </div>
          </div>
        </custom-modal>
      </div>
    `;
  }

  setupButtons() {
    const buttonsContainer = this.shadowRoot.getElementById('modal-buttons');
    if (!this.showButtons) {
      buttonsContainer.style.display = 'none';
    } else {
      const approveButton = this.shadowRoot.getElementById('approve-button');
      const rejectButton = this.shadowRoot.getElementById('reject-button');

      approveButton.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('recipe-approved', { detail: { recipeId: this.recipeId } }));
        this.modal.close();
      });

      rejectButton.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('recipe-rejected', { detail: { recipeId: this.recipeId } }));
        this.modal.close();
      });
    }
  }

  openModal() {
    this.modal.open();
  }

  closeModal() {
    this.modal.close();
  }
}

customElements.define('recipe-preview-modal', RecipePreviewModal);