// edit-recipe-component.js
import { FirestoreService } from '../../../js/services/firestore-service.js';
import { StorageService } from '../../../js/services/storage-service.js';
import authService from '../../../js/services/auth-service.js';
import {
  getImageStoragePath,
  uploadAndBuildImageMetadata,
  migrateImageToCategory,
  deleteImageFiles,
} from '../../../js/utils/recipes/recipe-image-utils.js';

import '../../modals/message-modal/message-modal.js';
import '../../utilities/loading-spinner/loading-spinner.js';
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
          <loading-spinner overlay border-radius="10px">
            <div class="edit-recipe-container">
                <recipe-form-component clear-button-text="איפוס" submit-button-text="שמור שינויים" recipe-id="${this.recipeId}" disable-form-protection ${this.hasAttribute('hide-form-actions') ? 'hide-actions' : ''}></recipe-form-component>
                <message-modal width="400px" height="auto"></message-modal>
            </div>
          </loading-spinner>
      `;
  }

  // TODO: scroll page to top after update
  async handleRecipeData(event) {
    const recipeData = event.detail.recipeData;
    const spinner = this.shadowRoot.querySelector('loading-spinner');
    try {
      spinner.setAttribute('active', '');
      const originalRecipe = await FirestoreService.getDocument('recipes', this.recipeId);
      const categoryChanged = originalRecipe.category !== recipeData.category;

      if (Array.isArray(recipeData.toDelete)) {
        for (const img of recipeData.toDelete) {
          if (img.full) await deleteImageFiles(img).catch(() => {});
        }
      }

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
          let existingImage = {
            id: img.id,
            full: img.full,
            isPrimary: img.isPrimary,
            access: img.access,
            uploadedBy: img.uploadedBy,
          };

          if (img.fileName !== undefined) {
            existingImage.fileName = img.fileName;
          }
          if (img.uploadTimestamp !== undefined) {
            existingImage.uploadTimestamp = img.uploadTimestamp;
          }

          if (categoryChanged) {
            try {
              existingImage = await migrateImageToCategory(
                existingImage,
                this.recipeId,
                originalRecipe.category,
                recipeData.category,
              );
            } catch (error) {
              console.error(`Failed to migrate image ${img.id}:`, error);
              this.showWarningMessage(
                `אזהרה: לא ניתן להעביר תמונה ${img.id} לתיקיית קטגוריה חדשה. התמונה תישאר בתיקייה הישנה.`,
              );
            }
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

      const { images, toDelete, mediaInstructions: _, ...rest } = recipeData;
      await FirestoreService.updateDocument('recipes', this.recipeId, {
        ...rest,
        images: newImages,
        mediaInstructions: mediaInstructions,
      });

      if (failedCount > 0) {
        this.showWarningMessage(
          `המתכון עודכן בהצלחה!\n\n` +
            `${successCount} קבצי מדיה הועלו בהצלחה.\n` +
            `${failedCount} קבצי מדיה נכשלו בהעלאה.\n\n` +
            `הקבצים שנכשלו עדיין נראים בעורך. תוכל לנסות להעלות אותם שוב על ידי לחיצה על "עדכן מתכון".`,
        );
      } else {
        this.showSuccessMessage('המתכון עודכן בהצלחה!');
      }
      spinner.removeAttribute('active');

      // Dispatch recipe-updated event for dashboard refresh
      const event = new CustomEvent('recipe-updated', {
        detail: { recipeId: this.recipeId },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    } catch (error) {
      spinner.removeAttribute('active');
      this.showErrorMessage(`שגיאה בעדכון המתכון: ${error}`);
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
        // Catch deletion of compressed path in case it doesn't exist (legacy)
        await StorageService.deleteFile(oldCompressedPath).catch(() => {});
      } catch (error) {
        console.error('Error removing old images:', error);
      }
    }
    // Upload new image (full only)
    try {
      const fullPath = getImageStoragePath(this.recipeId, category, imageName, 'full');
      await StorageService.uploadFile(imageFile, fullPath);
    } catch (error) {
      console.error('Error uploading new image:', error);
    }
  }

  showSuccessMessage(message) {
    const editRecipeModal = this.shadowRoot.querySelector('message-modal');

    editRecipeModal.addEventListener(
      'modal-closed',
      () => {
        const event = new CustomEvent('edit-success-modal-closed', {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
      },
      { once: true },
    );

    editRecipeModal.show(message);
  }

  showWarningMessage(message) {
    const editRecipeModal = this.shadowRoot.querySelector('message-modal');
    editRecipeModal.show(message);
  }

  showErrorMessage(message, error) {
    const editRecipeModal = this.shadowRoot.querySelector('message-modal');
    editRecipeModal.show(message);
  }

  resetFormToCurrentData() {
    // Reset the form to the current recipe data
    this.formComponent.setRecipeData(this.recipeId);
  }
}

customElements.define('edit-recipe-component', EditRecipeComponent);
