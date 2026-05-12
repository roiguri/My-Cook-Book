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
import {
  uploadAndBuildImageMetadata,
  deleteImageFiles,
} from '../../../js/utils/recipes/recipe-image-utils.js';
import { Timestamp } from 'firebase/firestore';
import authService from '../../../js/services/auth-service.js';
import { logError, getErrorMessage } from '../../../js/utils/error-handler.js';
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
    let uploadedFilesToCleanup = [];
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

      // Generate ID before uploading so we can use it for storage paths
      const recipeId = FirestoreService.generateId('recipes');

      // Upload images if provided. If any image fails, abort the whole submission —
      // a recipe without its primary image is not useful.
      if (imagesToUpload.length > 0) {
        let imageUploadResults;
        try {
          imageUploadResults = await this.uploadRecipeImages(
            recipeId,
            imagesToUpload,
            recipeDataForFirestore.category,
            user?.uid || 'anonymous',
          );
        } catch (uploadError) {
          // Surface the real Firebase error code in the image-handler so the user sees
          // a meaningful message right next to the upload area (not just a fleeting toast).
          this.showImageUploadError(uploadError);
          throw uploadError;
        }
        recipeDataForFirestore.images = imageUploadResults;
        recipeDataForFirestore.allowImageSuggestions = true;
        uploadedFilesToCleanup.push(...imageUploadResults);
      }

      // Upload pending media instructions if any
      const formComponent = this.shadowRoot.querySelector('recipe-form-component');
      let hasPartialFailure = false;
      let successCount = 0;
      let failedCount = 0;
      let pendingCount = 0;

      if (formComponent && typeof formComponent.uploadPendingMediaInstructions === 'function') {
        const allMedia = formComponent.getAllMediaInOrder();
        pendingCount = allMedia.filter((item) => item.file).length;

        if (pendingCount > 0) {
          const uploadedMedia = await formComponent.uploadPendingMediaInstructions(
            recipeId,
            user?.uid || 'anonymous',
          );

          if (uploadedMedia && uploadedMedia.length > 0) {
            successCount = uploadedMedia.length;
            recipeDataForFirestore.mediaInstructions = uploadedMedia;
            uploadedFilesToCleanup.push(...uploadedMedia);

            // Detect partial failure
            if (uploadedMedia.length < pendingCount) {
              hasPartialFailure = true;
              failedCount = pendingCount - uploadedMedia.length;
              console.warn(`${failedCount} of ${pendingCount} media file(s) failed to upload`);
            }
          } else {
            // All media failed — the inline editor already shows per-file errors.
            // Abort submission so the user can retry instead of getting a recipe
            // missing all its step media silently.
            const err = new Error(
              `כל ${pendingCount} קבצי המדיה נכשלו בהעלאה. אנא בדוק את החיבור ונסה שוב.`,
            );
            err.code = 'upload/media-all-failed';
            throw err;
          }
        }
      }

      // Add recipe to Firestore — race against a timeout because Firestore buffers writes
      // when offline instead of rejecting, which would leave the spinner frozen forever
      await Promise.race([
        FirestoreService.setDocument('recipes', recipeId, recipeDataForFirestore),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('אין חיבור לאינטרנט. אנא בדוק את החיבור ונסה שוב.')),
            15000,
          ),
        ),
      ]);

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
      // Cleanup any successfully uploaded files to avoid orphans
      if (uploadedFilesToCleanup.length > 0) {
        uploadedFilesToCleanup.forEach((img) => {
          deleteImageFiles(img).catch((e) => console.warn('Failed to cleanup file on error:', e));
        });
      }
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
    showToast(getErrorMessage(error), 'error', 5000);
  }

  showImageUploadError(error) {
    // Surface the real Firebase error inline on the image-handler so the user sees
    // the failure right next to the upload area rather than a brief toast.
    const formComponent = this.shadowRoot.querySelector('recipe-form-component');
    const imageHandler = formComponent?.shadowRoot?.getElementById('recipe-images');
    if (imageHandler && typeof imageHandler.showError === 'function') {
      // 0 = sticky; the user needs to see the failure long enough to act on it.
      imageHandler.showError(getErrorMessage(error), 0);
    }
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
