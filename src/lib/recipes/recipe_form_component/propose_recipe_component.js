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
import { uploadAndBuildImageMetadata } from '../../../js/utils/recipes/recipe-image-utils.js';
import { Timestamp } from 'firebase/firestore';
import authService from '../../../js/services/auth-service.js';

import './recipe_form_component.js';
import '../../modals/message-modal/message-modal.js';
import '../../utilities/loading-spinner/loading-spinner.js';

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
      <loading-spinner overlay>
        <div class="propose-recipe-container">
          <recipe-form-component></recipe-form-component>
          <message-modal></message-modal>
        </div>
      </loading-spinner>
      `;
  }

  async handleRecipeData(event) {
    const recipeData = event.detail.recipeData;
    const spinner = this.shadowRoot.querySelector('loading-spinner');
    try {
      spinner.setAttribute('active', '');
      const user = authService.getCurrentUser();
      const imagesToUpload = recipeData.images || [];
      const recipeDataForFirestore = { ...recipeData };
      delete recipeDataForFirestore.images;
      recipeDataForFirestore.creationTime = Timestamp.now();
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
      spinner.removeAttribute('active');
      this.dispatchEvent(new CustomEvent('recipe-proposed-success', { bubbles: true, composed: true }));
    } catch (error) {
      spinner.removeAttribute('active');
      this.showErrorMessage('Error proposing recipe:', error);
    }
  }

  async uploadRecipeImages(recipeId, images, category, uploader) {
    const imageUploadResults = [];
    for (const imageData of images) {
      const { file, isPrimary } = imageData;
      try {
        const meta = await uploadAndBuildImageMetadata({
          recipeId,
          category,
          file,
          isPrimary,
          uploadedBy: uploader,
        });
        imageUploadResults.push(meta);
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

  setFormDisabled(isDisabled) {
    const recipeFormComponent = this.shadowRoot.querySelector('recipe-form-component');
    if (recipeFormComponent && typeof recipeFormComponent.setDisabled === 'function') {
      recipeFormComponent.setDisabled(isDisabled);
    }
  }
}

customElements.define('propose-recipe-component', ProposeRecipeComponent);
