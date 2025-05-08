// edit-recipe-component.js
import { FirestoreService } from '../../../js/services/firestore-service.js';
import { StorageService } from '../../../js/services/storage-service.js';
import { compressImage, getImageStoragePath, uploadAndBuildImageMetadata } from '../../../js/utils/recipes/recipe-image-utils.js';
import '../../modals/message-modal/message-modal.js';

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
              <recipe-form-component clear-button-text="איפוס" submit-button-text="שמור שינויים" recipe-id="${this.recipeId}"></recipe-form-component>
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
          // Keep existing image (exclude file/source)
          newImages.push({
            id: img.id,
            full: img.full,
            compressed: img.compressed,
            isPrimary: img.isPrimary,
            access: img.access,
            uploadedBy: img.uploadedBy,
            fileName: img.fileName,
            uploadTimestamp: img.uploadTimestamp,
          });
        }
      }

      // 3. Update the recipe data in Firestore (exclude file/source/toDelete)
      const { images, toDelete, ...rest } = recipeData;
      console.log('Images to upload:', newImages);
      console.log('Uploading recipe:', { ...rest, images: newImages });
      await FirestoreService.updateDocument('recipes', this.recipeId, {
        ...rest,
        images: newImages,
      });

      this.showSuccessMessage('Recipe updated successfully!');
    } catch (error) {
      this.showErrorMessage(`Error updating recipe: ${error}`);
    }
  }

  async updateRecipeInFirestore(recipeId, recipeData) {
    // Remove the imageFile property before saving to Firestore
    const { imageFile, ...recipeDataWithoutImage } = recipeData;
    await FirestoreService.updateDocument('recipes', recipeId, recipeDataWithoutImage);
    console.log('Recipe updated in Firestore with ID:', recipeId);
  }

  async uploadImage(imageFile, category, imageName, oldImageName = null) {
    // Remove old image if it exists and has changed
    if (oldImageName && oldImageName !== imageName) {
      try {
        const oldFullPath = getImageStoragePath(this.recipeId, category, oldImageName, 'full');
        const oldCompressedPath = getImageStoragePath(this.recipeId, category, oldImageName, 'compressed');
        await StorageService.deleteFile(oldFullPath);
        await StorageService.deleteFile(oldCompressedPath);
        console.log('Removed old images from Firebase Storage');
      } catch (error) {
        console.error('Error removing old images:', error);
      }
    }
    // Upload new image (both full and compressed)
    try {
      const fullPath = getImageStoragePath(this.recipeId, category, imageName, 'full');
      const compressedPath = getImageStoragePath(this.recipeId, category, imageName, 'compressed');
      // Compress the image using shared utility
      const compressedImageBlob = await compressImage(imageFile);
      // Upload the compressed image
      await StorageService.uploadFile(compressedImageBlob, compressedPath);
      console.log('Uploaded compressed image to Firebase Storage');
      // Upload the full-size image
      await StorageService.uploadFile(imageFile, fullPath);
      console.log('Uploaded full-size image to Firebase Storage');
      // No need to return download URL for now
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
