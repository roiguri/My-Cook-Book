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
    `;
  }

  template() {
    return `
      <div class="recipe-preview-modal">
        <custom-modal height="90vh" width="60vw">
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
    } else {
      const approveButton = this.shadowRoot.getElementById('approve-button');
      const rejectButton = this.shadowRoot.getElementById('reject-button');

      approveButton.addEventListener('click', (event) => {
        this.handleRecipeApproval(this.recipeId); // Call the approval function
        // Allow the event to propagate up the DOM tree
        this.dispatchEvent(new CustomEvent('recipe-approved', { 
          detail: { recipeId: this.recipeId }, 
          bubbles: true, // Ensure the event bubbles
          composed: true // Allow the event to cross shadow DOM boundaries
        }));
        this.modal.close();
      });
      
      rejectButton.addEventListener('click', (event) => {
        this.handleRecipeRejection(this.recipeId); // Call the rejection function
        // Allow the event to propagate up the DOM tree
        this.dispatchEvent(new CustomEvent('recipe-rejected', { 
          detail: { recipeId: this.recipeId }, 
          bubbles: true, 
          composed: true 
        }));
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

  async handleRecipeApproval(recipeId) {
    try {
      await db.collection('recipes').doc(recipeId).update({ approved: true });
      // You may want to add a success message here (e.g., an alert)
      console.log('Recipe approved:', recipeId);
    } catch (error) {
      this.handleError(error); // You already have this error handling function
    }
  }

  async handleRecipeRejection(recipeId) {
    try {
      // 1. Remove images from Firebase Storage (if they exist)
      const recipeRef = db.collection('recipes').doc(recipeId);
      const recipeSnapshot = await recipeRef.get();
      const recipeData = recipeSnapshot.data();
  
      const imageName = recipeData.image; // Get the image name from the recipe data
      
      // Construct the full paths
      const compressedImagePath = `img/recipes/compressed/${recipeData.category}/${imageName}`;
      const fullImagePath = `img/recipes/full/${recipeData.category}/${imageName}`;
  
      try {
        // Attempt to delete the images
        await storage.ref(compressedImagePath).delete();
        await storage.ref(fullImagePath).delete();
      } catch (imageError) {
        // Log the error, but don't stop the recipe rejection
        console.error('Error deleting images:', imageError); 
      }
  
      // 2. Remove the recipe from Firestore
      await recipeRef.delete();
  
      // You may want to add a success message here
      console.log('Recipe rejected:', recipeId);
    } catch (error) {
      handleError(error);
    }
  }
  
  handleError(error) {
    // TODO: add error handling
    return
  }
}

customElements.define('recipe-preview-modal', RecipePreviewModal);