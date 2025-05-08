/**
 * ProposeRecipeComponent
 *
 * This component allows users to propose new recipes. It handles the submission of recipe data, including image uploads, and saves the data to Firestore.
 *
 * Dependencies:
 * - RecipeFormComponent: This component is responsible for displaying and handling the recipe form.
 * - Firebase: The component uses Firebase for image storage (Firebase Storage) and data persistence (Firestore).
 * - MessageModal: If you are using a modal for error handling and success messages, this component is required.
 *
 * Example Usage:
 *
 * <propose-recipe-component></propose-recipe-component>
 *
 */

import { FirestoreService } from '../../../js/services/firestore-service.js';
import { compressImage, getImageStoragePath } from '../../../js/utils/recipes/recipe-image-utils.js';
import { StorageService } from '../../../js/services/storage-service.js';
import authService from '../../../js/services/auth-service.js';

class ProposeRecipeComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const formComponent = this.shadowRoot.querySelector('recipe-form-component');
    formComponent.addEventListener('recipe-data-collected', this.handleRecipeData.bind(this));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        
      </style>
      <div class="propose-recipe-container">
        <recipe-form-component></recipe-form-component>
        <message-modal></message-modal>
      </div>
      `;
  }

  async handleRecipeData(event) {
    const recipeData = event.detail.recipeData;
    try {
      const user = authService.getCurrentUser();
      const imagesToUpload = recipeData.images || [];
      const recipeDataForFirestore = { ...recipeData };
      delete recipeDataForFirestore.images;
      recipeDataForFirestore.creationTime = new Date().toISOString();
      recipeDataForFirestore.userId = user?.uid || 'anonymous';
      // Add recipe to Firestore
      const recipeId = await FirestoreService.addDocument('recipes', recipeDataForFirestore);
      // Upload images if provided
      if (imagesToUpload.length > 0) {
        const imageUploadResults = await this.uploadRecipeImages(
          recipeId,
          imagesToUpload,
          recipeDataForFirestore.category,
          user?.uid || 'anonymous'
        );
        await FirestoreService.updateDocument('recipes', recipeId, {
          images: imageUploadResults,
          allowImageSuggestions: true,
        });
      }
      this.clearForm();
      this.showSuccessMessage('Recipe proposed successfully!');
    } catch (error) {
      this.showErrorMessage('Error proposing recipe:', error);
    }
  }

  async uploadRecipeImages(recipeId, images, category, uploader) {
    const imageUploadResults = [];
    for (const imageData of images) {
      const { file, isPrimary } = imageData;
      const fileExtension = file.name.split('.').pop();
      const fileName = isPrimary ? 'primary.jpg' : `${Date.now()}.${fileExtension}`;
      try {
        const fullPath = getImageStoragePath(recipeId, category, fileName, 'full');
        const compressedPath = getImageStoragePath(recipeId, category, fileName, 'compressed');
        await StorageService.uploadFile(file, fullPath);
        const compressedFile = await compressImage(file);
        await StorageService.uploadFile(compressedFile, compressedPath);
        imageUploadResults.push({
          full: fullPath,
          compressed: compressedPath,
          fileName,
          isPrimary,
          uploadedBy: uploader,
          access: 'public',
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
    return imageUploadResults;
  }

  showSuccessMessage(message) {
    const proposeRecipeModal = this.shadowRoot.querySelector('message-modal');
    proposeRecipeModal.show('המתכון נשלח בהצלחה!', '', 'Close');
  }

  showErrorMessage(message, error) {
    const proposeRecipeModal = this.shadowRoot.querySelector('message-modal');
    proposeRecipeModal.show(error?.message + (error?.stack || ''), message, 'Close');
  }

  clearForm() {
    const formComponent = this.shadowRoot.querySelector('recipe-form-component');
    formComponent.clearForm();
  }
}

customElements.define('propose-recipe-component', ProposeRecipeComponent);
