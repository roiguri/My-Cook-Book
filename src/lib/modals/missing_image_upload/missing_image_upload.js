// TODO: test before re-use
import { Modal } from '../../utilities/modal/modal.js';
import { getFirestoreInstance } from '../../../js/services/firebase-service.js';
import { StorageService } from '../../../js/services/storage-service.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * MissingImageUpload Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * A modal interface for uploading missing recipe images with Firebase integration.
 * Features image preview, file validation, and automatic image processing.
 * Supports RTL (Right-to-Left) layout by default.
 *
 * @dependencies
 * - Requires Modal component (`custom-modal`)
 * - Firebase Storage for image upload
 * - Firebase Firestore for data management
 *
 * @cssVariables
 * - --primary-color: Used for buttons and borders
 * - --primary-hover: Hover state for buttons
 * - --secondary-color: Used for form background
 *
 * @example
 * // HTML
 * <missing-image-upload></missing-image-upload>
 *
 * // JavaScript
 * const uploader = document.querySelector('missing-image-upload');
 * uploader.openModalForRecipe('recipe-123');
 *
 * @property {string} recipeId - ID of the recipe for image upload
 *
 * @method openModalForRecipe
 * @param {string} recipeId - ID of the recipe
 *
 * @fires modal-opened - When modal opens
 * @fires modal-closed - When modal closes
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
    this.shadowRoot
      .getElementById('clear-image')
      .addEventListener('click', () => this.clearFileInput());
    this.shadowRoot
      .getElementById('recipe-image')
      .addEventListener('change', (event) => this.handleFileSelect(event));
    this.shadowRoot
      .getElementById('image-upload-form')
      .addEventListener('submit', (event) => this.handleSubmit(event));

    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.addEventListener('modal-closed', () =>
      setTimeout(() => {
        this.clearFileInput();
      }, 300),
    );
  }

  get recipeId() {
    return this._recipeId;
  }

  set recipeId(value) {
    this._recipeId = value;
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
      await this.uploadImageToFirebase(file);
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
    const db = getFirestoreInstance();
    try {
      // Fetch the recipe document to get the category
      const recipeDocSnap = await getDoc(doc(db, 'recipes', this.recipeId));
      if (!recipeDocSnap.exists()) {
        throw new Error('Recipe not found');
      }
      const category = recipeDocSnap.data().category;
      if (!category) {
        throw new Error('Recipe category not found');
      }
      const fileExtension = file.name.split('.').pop();
      const fileName = `${this.recipeId}.${fileExtension}`;
      // Upload full-size image
      const fullSizePath = `img/recipes/full/${category}/${fileName}`;
      await StorageService.uploadFile(file, fullSizePath);
      const fullSizeUrl = await StorageService.getFileUrl(fullSizePath);
      // TODO: Implement image compression
      // For now, upload the same image to the compressed location
      const compressedPath = `img/recipes/compressed/${category}/${fileName}`;
      await StorageService.uploadFile(file, compressedPath);
      const compressedUrl = await StorageService.getFileUrl(compressedPath);
      // Update Firestore document
      await updateDoc(doc(db, 'recipes', this.recipeId), {
        pendingImage: {
          full: fullSizeUrl,
          compressed: compressedUrl,
          timestamp: serverTimestamp(),
          fileExtension: fileExtension,
        },
      });
      // TODO: Display a success message to the user indicating the image is pending approval
      return { fullSizeUrl, compressedUrl };
    } catch (error) {
      console.error('Error uploading to Firebase Storage:', error);
      throw error;
    }
  }
}

customElements.define('missing-image-upload', MissingImageUpload);
