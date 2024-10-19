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

class EditPreviewRecipe extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.recipeId = this.getAttribute('recipe-id');
    this.showButtons = false;
    this.recipeName = this.getAttribute('recipe-name');
    this.mode = this.getAttribute('start-mode') || 'preview'; // Get start mode or default to 'preview'
    this.path = this.getAttribute('path-to-icon') || 'My-Cook-Book/img/icon/other/'
    this.render();
    this.modal = this.shadowRoot.querySelector('custom-modal');
    this.setupModeToggle()

    // Initial check on page load
    this.handleResize();
    // Listen for window resize events
    window.addEventListener('resize', this.handleResize);
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
        outline: 1px solid black;
        border-radius: 10px;
        background-color: transparent;
        overflow-y: auto; /* Add vertical scroll to the modal content */
        margin-bottom: 20px;
      }

      .modal {
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
        width: 90%;
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

      .mode-toggle {
        position: absolute;
        top: 10px; /* Adjust as needed */
        left: 10px; /* Adjust as needed */
        background: none; /* Remove button background */
        border: none; /* Remove button border */
        padding: 5px; /* Adjust as needed */
        cursor: pointer; /* Show pointer cursor on hover */
      }

      .toggle-icon {
        height: 20px;
        width: 20px;
      }
    `;
  }

  template() {
    return `
      <div class="recipe-preview-modal">
        <custom-modal height="90vh" width="60vw">
          <button class="mode-toggle">
            ${this.mode === 'preview' ? 
              `<img src="${this.path}pencil.png" class="toggle-icon">` : 
              `<img src="${this.path}eye.png" class="toggle-icon">`
            } 
          </button>
          <h3> Recipe Preview </h3>
          <div class="modal-content">
            ${this.mode === 'preview' ? 
              `<recipe-component recipe-id="${this.recipeId}"></recipe-component>` : 
              `<edit-recipe-component recipe-id="${this.recipeId}"></edit-recipe-component>`
            }          
          </div>
        </custom-modal>
      </div>
    `;
  }

  setupModeToggle() {
    const modeToggleButton = this.shadowRoot.querySelector('.mode-toggle');
    const modalContent = this.shadowRoot.querySelector('.modal-content'); // Get the container
    const toggleImage = this.shadowRoot.querySelector('.toggle-icon');
    modeToggleButton.addEventListener('click', (event) => {
      console.log("another click")
      if (this.mode === 'preview') {
        this.mode = 'edit';
  
        // Remove recipe-component
        const recipeComponent = modalContent.querySelector('recipe-component');
        if (recipeComponent) modalContent.removeChild(recipeComponent);
  
        // Add edit-recipe-component
        const editRecipeComponent = document.createElement('edit-recipe-component');
        editRecipeComponent.setAttribute('recipe-id', this.recipeId);
        modalContent.appendChild(editRecipeComponent);
        
        toggleImage.src = this.path + "eye.png"
      } else {
        this.mode = 'preview';
  
        // Remove edit-recipe-component
        const editRecipeComponent = modalContent.querySelector('edit-recipe-component');
        if (editRecipeComponent) modalContent.removeChild(editRecipeComponent);
  
        // Add recipe-component
        const recipeComponent = document.createElement('recipe-component');
        recipeComponent.setAttribute('recipe-id', this.recipeId);
        modalContent.appendChild(recipeComponent);

        toggleImage.src = this.path + "pencil.png"
      }
    });
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

  // Handle recipe preview size for different layouts
  handleResize() {
    const element = this.shadowRoot.querySelector('custom-modal'); // Replace with your element ID
    if (window.innerWidth < 768) { // Adjust breakpoint as needed
      this.modal.setHeight('100vh');
      this.modal.setWidth('100vh');
    } else {
      this.modal.setHeight('90vh');
      this.modal.setWidth('60vh');
    }
  }
  }

customElements.define('edit-preview-recipe', EditPreviewRecipe);