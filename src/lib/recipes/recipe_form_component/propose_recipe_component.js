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
import { logError } from '../../../js/utils/error-handler.js';
import { showToast } from '../../notifications/toast-notification/toast-notification.js';

import './recipe_form_component.js';
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
          <recipe-form-component hide-actions></recipe-form-component>
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
      delete recipeDataForFirestore.mediaInstructions;
      delete recipeDataForFirestore.toDelete;
      recipeDataForFirestore.creationTime = Timestamp.now();
      recipeDataForFirestore.userId = user?.uid || 'anonymous';
      recipeDataForFirestore.approved = false;

      Object.keys(recipeDataForFirestore).forEach((key) => {
        const value = recipeDataForFirestore[key];
        if (value === undefined) {
          delete recipeDataForFirestore[key];
        } else if (Array.isArray(value)) {
          recipeDataForFirestore[key] = value.filter((item) => item !== undefined);
        }
      });

      // Add recipe to Firestore — race against a timeout because Firestore buffers writes
      // when offline instead of rejecting, which would leave the spinner frozen forever
      const recipeId = await Promise.race([
        FirestoreService.addDocument('recipes', recipeDataForFirestore),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('אין חיבור לאינטרנט. אנא בדוק את החיבור ונסה שוב.')),
            15000,
          ),
        ),
      ]);

      // Upload images if provided
      if (imagesToUpload.length > 0) {
        const imageUploadResults = await this.uploadRecipeImages(
          recipeId,
          imagesToUpload,
          recipeDataForFirestore.category,
          user?.uid || 'anonymous',
        );
        await FirestoreService.updateDocument('recipes', recipeId, {
          images: imageUploadResults,
          allowImageSuggestions: true,
        });
      }

      // Upload pending media instructions if any
      const formComponent = this.shadowRoot.querySelector('recipe-form-component');
      let hasPartialFailure = false;
      let successCount = 0;
      let failedCount = 0;

      if (formComponent && typeof formComponent.uploadPendingMediaInstructions === 'function') {
        const allMedia = formComponent.getAllMediaInOrder();
        const pendingCount = allMedia.filter((item) => item.file).length;

        const uploadedMedia = await formComponent.uploadPendingMediaInstructions(
          recipeId,
          user?.uid || 'anonymous',
        );

        if (uploadedMedia && uploadedMedia.length > 0) {
          successCount = uploadedMedia.length;
          await FirestoreService.updateDocument('recipes', recipeId, {
            mediaInstructions: uploadedMedia,
          });

          // Detect partial failure
          if (pendingCount > 0 && uploadedMedia.length < pendingCount) {
            hasPartialFailure = true;
            failedCount = pendingCount - uploadedMedia.length;
            console.warn(`${failedCount} of ${pendingCount} media file(s) failed to upload`);
          }
        }
      }

      this.clearForm();

      if (hasPartialFailure) {
        showToast(
          `המתכון נשלח בהצלחה!\n\n` +
            `${successCount} קבצי מדיה הועלו בהצלחה.\n` +
            `${failedCount} קבצי מדיה נכשלו.\n\n` +
            `ניתן לראות את המתכון בלוח הבקרה ולערוך אותו כדי לנסות שוב.`,
          'warn',
          0,
        );
      } else {
        this.showSuccessMessage();
      }
      spinner.removeAttribute('active');
      this.dispatchEvent(
        new CustomEvent('recipe-proposed-success', { bubbles: true, composed: true }),
      );
    } catch (error) {
      spinner.removeAttribute('active');
      this.showErrorMessage(error);
    }
  }

  async uploadRecipeImages(recipeId, images, category, uploader) {
    try {
      // Upload all images in parallel for better performance
      const uploadPromises = images.map(({ file, isPrimary }) =>
        uploadAndBuildImageMetadata({
          recipeId,
          category,
          file,
          isPrimary,
          uploadedBy: uploader,
        }),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }

  showSuccessMessage() {
    showToast('המתכון נשלח בהצלחה!', 'success');
  }

  showErrorMessage(error) {
    logError(error, 'Recipe proposal');
    showToast(error.message || 'אירעה שגיאה. אנא נסה שוב.', 'error', 5000);
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

  submitForm() {
    const formComponent = this.shadowRoot.querySelector('recipe-form-component');
    if (formComponent) formComponent.submitForm();
  }

  requestClear() {
    const formComponent = this.shadowRoot.querySelector('recipe-form-component');
    if (formComponent) formComponent.requestClear();
  }

  openImportModal() {
    const formComponent = this.shadowRoot.querySelector('recipe-form-component');
    if (formComponent) formComponent.openImportModal();
  }
}

customElements.define('propose-recipe-component', ProposeRecipeComponent);
