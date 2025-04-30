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
 * 
 * Dependencies:
 * - This component relies on the `custom-modal` and `recipe-component` components.
 * - This component relies on firebase-storage-utils.js for the `deleteRecipeImages` function.
 */

import { deleteRecipeImages } from '../../../js/utilities/firebase-storage-utils';

class RecipePreviewModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isLoading = false;
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
      .recipe-preview-modal .modal-content {
        max-width: 600px;
        outline: 1px solid black;
        border-radius: 10px;
        background-color: transparent;
        overflow-y: auto; /* Add vertical scroll to the modal content */
        margin-bottom: 20px;
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
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
        flex-grow: 1;
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
        margin-top: 10px;
        margin-bottom: 10px;
        gap: 10px;
      }

      .modal-buttons button { 
        padding: 12px;
        width: 100%;
        background-color: var(--primary-color, #bb6016);
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      .modal-buttons button:hover {
        background-color: var(--primary-hover, #5c4033);
      }

      .modal-buttons button#approve-button {
        background-color: var(--success-color, #4CAF50); /* Green for Approve */
      }

      .modal-buttons button#approve-button:hover {
        background-color: var(--success-hover, #45a049); /* Darker green on hover */
      }

      .modal-buttons button#reject-button {
        background-color: var(--error-color, #f44336); /* Red for Reject */
      }

      .modal-buttons button#reject-button:hover {
        background-color: var(--error-hover, #d32f2f); /* Darker red on hover */
      }

      .loading-overlay {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .loading-overlay.active {
        display: flex;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error-message {
        color: var(--error-color, #f44336);
        margin: 10px 0;
        text-align: center;
        display: none;
      }
    `;
  }

  template() {
    return `
      <div class="recipe-preview-modal">
        <custom-modal height="90vh" width="60vw">
          <div class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
          <div class="error-message"></div
          <h3> Recipe Preview </h3>
          <div class="modal-content">
            <recipe-component recipe-id="${this.recipeId}"></recipe-component>
          </div>
          <div class="modal-buttons" id="modal-buttons">
            <button id="reject-button">דחה</button>
            <button id="approve-button">אשר</button>
          </div>
        </custom-modal>
      </div>
    `;
  }

  setupButtons() {
    const buttonsContainer = this.shadowRoot.getElementById('modal-buttons');
    if (!this.showButtons) {
      buttonsContainer.style.display = 'none';
      return;
    }

    const approveButton = this.shadowRoot.getElementById('approve-button');
    const rejectButton = this.shadowRoot.getElementById('reject-button');

    approveButton.addEventListener('click', () => this.handleApproveClick());
    rejectButton.addEventListener('click', () => this.handleRejectClick());
  }

  setLoading(loading) {
    this.isLoading = loading;
    const overlay = this.shadowRoot.querySelector('.loading-overlay');
    const approveButton = this.shadowRoot.getElementById('approve-button');
    const rejectButton = this.shadowRoot.getElementById('reject-button');

    if (loading) {
      overlay.classList.add('active');
      approveButton?.setAttribute('disabled', 'true');
      rejectButton?.setAttribute('disabled', 'true');
    } else {
      overlay.classList.remove('active');
      approveButton?.removeAttribute('disabled');
      rejectButton?.removeAttribute('disabled');
    }
  }

  showError(message) {
    const errorElement = this.shadowRoot.querySelector('.error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  async handleApproveClick() {
    if (this.isLoading) return;

    try {
      this.setLoading(true);
      await this.handleRecipeApproval(this.recipeId);
      this.dispatchEvent(new CustomEvent('recipe-approved', {
        detail: { recipeId: this.recipeId },
        bubbles: true,
        composed: true
      }));
      this.modal.close();
    } catch (error) {
      console.error('Error approving recipe:', error);
      this.showError('אירעה שגיאה באישור המתכון. אנא נסה שנית.');
      this.setLoading(false);
    }
  }

  async handleRejectClick() {
    if (this.isLoading) return;

    try {
      this.setLoading(true);
      await this.handleRecipeRejection(this.recipeId);
      this.dispatchEvent(new CustomEvent('recipe-rejected', {
        detail: { recipeId: this.recipeId },
        bubbles: true,
        composed: true
      }));
      this.modal.close();
    } catch (error) {
      console.error('Error rejecting recipe:', error);
      this.showError('אירעה שגיאה בדחיית המתכון. אנא נסה שנית.');
      this.setLoading(false);
    }
  }

  openModal() {
    this.modal.open();
  }

  closeModal() {
    this.modal.close();
  }

  async handleRecipeApproval(recipeId) {
    await firebase.firestore().collection('recipes').doc(recipeId).update({ approved: true });
  }

  async handleRecipeRejection(recipeId) {
    try {
      // First delete all associated images
      await deleteRecipeImages(recipeId);
      
      // Then delete the recipe document
      await firebase.firestore().collection('recipes').doc(recipeId).delete();
      
    } catch (error) {
      console.error('Error in handleRecipeRejection:', error);
      throw new Error('Failed to reject recipe: ' + error.message);
    }
  }
}

customElements.define('recipe-preview-modal', RecipePreviewModal);