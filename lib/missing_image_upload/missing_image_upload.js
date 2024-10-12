/**
 * MissingImageUpload Component
 * @class
 * @extends HTMLElement
 * 
 * @description
 * A custom web component that provides an interface for uploading missing images
 * for recipes in a recipe management system. It uses a Modal component for the UI
 * and integrates with Firebase for storage functionality.
 * 
 * @example
 * // HTML
 * <missing-image-upload></missing-image-upload>
 * <button class="upload-missing-image-button" data-recipe-id="123">Upload Image</button>
 * <script src="../lib/missing_image_upload/missing_image_upload.js"></script>
 * 
 * 
 * // JavaScript
 * document.querySelector('.upload-missing-image-button').addEventListener('click', (event) => {
 *  event.preventDefault();
 *  const recipeId = event.target.getAttribute('data-recipe-id');
 *  const uploadComponent = document.querySelector('missing-image-upload');
 *  uploadComponent.openModalForRecipe(recipeId);
 * }
 * @property {string} recipeId - The ID of the recipe for which an image is being uploaded.
 * 
 * @method openModal
 * @description Opens the modal for image upload.
 * 
 * @method closeModal
 * @description Closes the modal and clears the form.
 * 
 * @method clearFileInput
 * @description Clears the file input and image preview.
 * 
 * @method handleSubmit
 * @description Handles the form submission, including file validation and upload.
 * 
 * @fires modal-opened - When the modal is opened.
 * @fires modal-closed - When the modal is closed.
 * 
 * @requires firebase
 * @requires ./modal.js
 */

class MissingImageUpload extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.recipeId = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>
      <custom-modal height="auto">
        <h2>העלאת תמונה חדשה</h2>
        <form id="image-upload-form" class="propose-image-form">
          <div class="form-group">
            <input type="file" id="recipe-image" name="recipe-image" accept="image/*" required>
            <div id="error-message" class="error-message"></div>
          </div>
          <div id="image-preview-container" class="image-preview-container"></div>
          <div class="buttons">
            <button type="submit" class="base-button submit-button">שלח</button>
            <button type="button" id="clear-image" class="base-button clear-button">נקה</button>
          </div>
        </form>
      </custom-modal>
      <script src="../lib/modal/modal.js"></script>
    `;
  }

  styles() {
    return `
      .propose-image-form {
        background-color: var(--secondary-color, #e6dfd1);
        padding: 1rem;
        border-radius: 10px;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .buttons {
        display: flex;
        gap: 10px;
      }
      .base-button {
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
      .base-button:hover {
        background-color: var(--primary-hover, #5c4033);
      }
      input[type="file"] {
        width: auto;
        padding: 0.5rem;
        border: 1px solid var(--primary-color, #bb6016);
        border-radius: 5px;
      }
      #recipe-image {
        border: 1px solid var(--primary-color, #bb6016);
        transition: border-color 0.3s ease;
      }
      #recipe-image.invalid {
        border: 2px solid red;
      }
      .image-preview-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;

      }
      .image-preview {
        max-width: 100%; 
        max-height: 200px;
        border-radius: 20px;
      }
      .error-message {
        color: red;
        font-size: 0.8em;
        margin-top: 5px;
      }
    `;
  }

  setupEventListeners() {
    this.shadowRoot.getElementById('clear-image').addEventListener('click', () => this.clearFileInput());
    this.shadowRoot.getElementById('recipe-image').addEventListener('change', (event) => this.handleFileSelect(event));
    this.shadowRoot.getElementById('image-upload-form').addEventListener('submit', (event) => this.handleSubmit(event));

    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.addEventListener('modal-closed', () =>   setTimeout(() => {
      this.clearFileInput();
    }, 300));
  }

  get recipeId() {
    return this._recipeId;
  }

  set recipeId(value) {
    this._recipeId = value;
    console.log(`Recipe ID set to: ${value}`);
  }

  openModal() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.open();
  }

  openModalForRecipe(recipeId) {
    this.recipeId = recipeId;
    this.openModal();
  }

  closeModal() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.close();
  }

  clearFileInput() {
    const fileInput = this.shadowRoot.getElementById('recipe-image');
    fileInput.value = '';
    this.shadowRoot.getElementById('image-preview-container').innerHTML = '';
    fileInput.classList.remove('invalid');
    this.displayErrorMessage('');
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    const fileInput = event.target;
    
    if (file) {
      if (file.type.startsWith('image/')) {
        this.previewImage(file);
        fileInput.classList.remove('invalid');
        this.displayErrorMessage('');
      } else {
        this.displayErrorMessage('יש לבחור קובץ תמונה: jpg/jpeg/png');
        fileInput.classList.add('invalid');
        fileInput.value = '';
      }
    }
  }

  displayErrorMessage(message) {
    this.shadowRoot.getElementById('error-message').textContent = message;
  }

  previewImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.shadowRoot.getElementById('image-preview-container').innerHTML = `
        <img class="image-preview" src="${e.target.result}" alt="Image preview">
      `;
    };
    reader.readAsDataURL(file);
  }

  async handleSubmit(event) {
    event.preventDefault();
    const fileInput = this.shadowRoot.getElementById('recipe-image');
    const file = fileInput.files[0];

    if (!file) {
      this.displayErrorMessage('Please select an image file.');
      return;
    }

    try {
      const imageUrl = await this.uploadImageToFirebase(file);
      alert('Image uploaded successfully!');
      this.closeModal();
    } catch (error) {
      console.error('Error uploading image:', error);
      this.displayErrorMessage('העלאת התמונה נכשלה. אנא נסה שנית מאוחר יותר');
    }
  }

  async uploadImageToFirebase(file) {
    if (!this.recipeId) {
      throw new Error('Recipe ID is not set');
    }

    const storage = firebase.storage();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${this.recipeId}.${fileExtension}`;
    const imageRef = storage.ref(`pendingImages/${fileName}`);

    try {
      const snapshot = await imageRef.put(file);
      return await snapshot.ref.getDownloadURL();
    } catch (error) {
      console.error('Error uploading to Firebase Storage:', error);
      throw error;
    }
  }
}

customElements.define('missing-image-upload', MissingImageUpload);