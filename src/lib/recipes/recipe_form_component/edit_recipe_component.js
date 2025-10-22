// edit-recipe-component.js
import { FirestoreService } from '../../../js/services/firestore-service.js';
import { StorageService } from '../../../js/services/storage-service.js';
import authService from '../../../js/services/auth-service.js';
import {
  compressImage,
  getImageStoragePath,
  uploadAndBuildImageMetadata,
} from '../../../js/utils/recipes/recipe-image-utils.js';

import '../../modals/message-modal/message-modal.js';
import './recipe_form_component.js';

class EditRecipeComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.recipeId = this.getAttribute('recipe-id');
    this.render();
    this.formComponent = this.shadowRoot.querySelector('recipe-form-component');

    // Listen for form submission event from the base component
    this.formComponent.addEventListener('recipe-data-collected', this.handleRecipeData.bind(this));

    // Listen for clear button click event from the base component (you'll need to add this in the base component)
    this.formComponent.addEventListener(
      'clear-button-clicked',
      this.resetFormToCurrentData.bind(this),
    );
  }

  render() {
    this.shadowRoot.innerHTML = `
          <style>
              /* Add your component-specific styles here */
          </style>
          <div class="edit-recipe-container">
              <recipe-form-component clear-button-text="איפוס" submit-button-text="שמור שינויים" recipe-id="${this.recipeId}" disable-form-protection></recipe-form-component>
              <message-modal></message-modal>
          </div>
      `;
  }

  // TODO: scroll page to top after update
  async handleRecipeData(event) {
    const recipeData = event.detail.recipeData;
    try {
      // 1. Delete images marked for removal
      if (Array.isArray(recipeData.toDelete)) {
        for (const img of recipeData.toDelete) {
          if (img.full) await StorageService.deleteFile(img.full).catch(() => {});
          if (img.compressed) await StorageService.deleteFile(img.compressed).catch(() => {});
        }
      }

      // 2. Upload new images and build the new images array
      const newImages = [];
      for (const img of recipeData.images) {
        if (img.source === 'new' && img.file) {
          const meta = await uploadAndBuildImageMetadata({
            recipeId: this.recipeId,
            category: recipeData.category,
            file: img.file,
            isPrimary: img.isPrimary,
            uploadedBy: img.uploadedBy,
          });
          newImages.push(meta);
        } else if (img.source === 'existing') {
          // Keep existing image (exclude file/source and undefined fields)
          const existingImage = {
            id: img.id,
            full: img.full,
            compressed: img.compressed,
            isPrimary: img.isPrimary,
            access: img.access,
            uploadedBy: img.uploadedBy,
          };

          // Only add optional fields if they exist
          if (img.fileName !== undefined) {
            existingImage.fileName = img.fileName;
          }
          if (img.uploadTimestamp !== undefined) {
            existingImage.uploadTimestamp = img.uploadTimestamp;
          }

          newImages.push(existingImage);
        }
      }

      const mediaInstructions = [];
      const formComponent = this.formComponent;

      const allMediaInOrder = formComponent?.getAllMediaInOrder() || [];
      let uploadedMediaMap = new Map();
      let failedCount = 0;
      let successCount = 0;

      if (formComponent && typeof formComponent.uploadPendingMediaInstructions === 'function') {
        const user = authService.getCurrentUser();
        const pendingCount = allMediaInOrder.filter((item) => item.file).length;

        const uploadedMedia = await formComponent.uploadPendingMediaInstructions(
          this.recipeId,
          user?.uid || 'anonymous',
        );

        if (uploadedMedia && Array.isArray(uploadedMedia)) {
          successCount = uploadedMedia.length;
          uploadedMedia.forEach((media) => {
            uploadedMediaMap.set(media.order, media);
          });

          // Detect partial failure
          if (pendingCount > 0 && uploadedMedia.length < pendingCount) {
            failedCount = pendingCount - uploadedMedia.length;
            console.warn(`${failedCount} of ${pendingCount} media file(s) failed to upload`);
          }
        }
      }

      // Now process all media in unified array order (preserves UI reordering)
      let finalOrder = 0;
      for (const item of allMediaInOrder) {
        if (item.file) {
          // This is a pending file - use uploaded metadata from map
          const uploaded = uploadedMediaMap.get(item.position);
          if (uploaded) {
            uploaded.order = finalOrder; // Assign sequential order
            mediaInstructions.push(uploaded);
            finalOrder++;
          } else {
            console.warn(
              `Media at position ${item.position} failed to upload, will be excluded from save`,
            );
          }
        } else {
          // Existing media - keep it with updated order
          const existingMedia = { ...item, order: finalOrder };
          delete existingMedia.position; // Remove temporary position field
          mediaInstructions.push(existingMedia);
          finalOrder++;
        }
      }

      // 3. Update the recipe data in Firestore (exclude file/source/toDelete)
      const { images, toDelete, mediaInstructions: _, ...rest } = recipeData;
      await FirestoreService.updateDocument('recipes', this.recipeId, {
        ...rest,
        images: newImages,
        mediaInstructions: mediaInstructions,
      });

      if (failedCount > 0) {
        this.showWarningMessage(
          `Recipe updated successfully!\n\n` +
            `${successCount} media file(s) were uploaded successfully.\n` +
            `${failedCount} media file(s) failed to upload and were not saved.\n\n` +
            `The failed items are still visible in the editor. You can try uploading them again by clicking "Update Recipe".`,
        );
      } else {
        this.showSuccessMessage('Recipe updated successfully!');
      }

      // 4. Reload form data to show updated recipe (including uploaded media)
      await this.formComponent.setRecipeData(this.recipeId);

      // 5. Dispatch recipe-updated event for dashboard refresh
      const event = new CustomEvent('recipe-updated', {
        detail: { recipeId: this.recipeId },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    } catch (error) {
      this.showErrorMessage(`Error updating recipe: ${error}`);
    }
  }

  async updateRecipeInFirestore(recipeId, recipeData) {
    // Remove the imageFile property before saving to Firestore
    const { imageFile, ...recipeDataWithoutImage } = recipeData;
    await FirestoreService.updateDocument('recipes', recipeId, recipeDataWithoutImage);
  }

  async uploadImage(imageFile, category, imageName, oldImageName = null) {
    // Remove old image if it exists and has changed
    if (oldImageName && oldImageName !== imageName) {
      try {
        const oldFullPath = getImageStoragePath(this.recipeId, category, oldImageName, 'full');
        const oldCompressedPath = getImageStoragePath(
          this.recipeId,
          category,
          oldImageName,
          'compressed',
        );
        await StorageService.deleteFile(oldFullPath);
        await StorageService.deleteFile(oldCompressedPath);
      } catch (error) {
        console.error('Error removing old images:', error);
      }
    }
    // Upload new image (both full and compressed)
    try {
      const fullPath = getImageStoragePath(this.recipeId, category, imageName, 'full');
      const compressedPath = getImageStoragePath(this.recipeId, category, imageName, 'compressed');
      const compressedImageBlob = await compressImage(imageFile);
      await StorageService.uploadFile(compressedImageBlob, compressedPath);
      await StorageService.uploadFile(imageFile, fullPath);
    } catch (error) {
      console.error('Error uploading new images:', error);
    }
  }

  showSuccessMessage(message) {
    // Show the success message in the modal
    const editRecipeModal = this.shadowRoot.querySelector('message-modal');
    editRecipeModal.show(message, 'Success!');
  }

  showErrorMessage(message, error) {
    // Show the error message in the modal
    const editRecipeModal = this.shadowRoot.querySelector('message-modal');
    editRecipeModal.show(message, 'Error!');
  }

  resetFormToCurrentData() {
    // Reset the form to the current recipe data
    this.formComponent.setRecipeData(this.recipeId);
  }
}

customElements.define('edit-recipe-component', EditRecipeComponent);
