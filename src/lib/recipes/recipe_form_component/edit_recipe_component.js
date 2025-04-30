// edit-recipe-component.js
import { getFirestoreInstance, getStorageInstance } from '../../../js/services/firebase-service.js';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import '../../modals/message-modal/message-modal.js'

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
      this.formComponent.addEventListener('clear-button-clicked', this.resetFormToCurrentData.bind(this)); 
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

  async handleRecipeData(event) {
      const recipeData = event.detail.recipeData;
      try {
          // Update the recipe data in Firestore
          await this.updateRecipeInFirestore(this.recipeId, recipeData);

          // Handle image update if a new image is provided
          if (recipeData.imageFile) {
              const fileExtension = recipeData.imageFile.name.split('.').pop();
              const imageName = `${this.recipeId}.${fileExtension}`;
              const imageUrl = await this.uploadImage(recipeData.imageFile, recipeData.category, imageName);
              recipeData.image = imageName;
              await this.updateRecipeInFirestore(this.recipeId, { image: imageName });
          }

          this.showSuccessMessage('Recipe updated successfully!');
      } catch (error) {
          this.showErrorMessage(`Error updating recipe: ${error}`);
      }
  }

  // FIXME: currently can't edit recipes with images
  async updateRecipeInFirestore(recipeId, recipeData) {
    const db = getFirestoreInstance();
    // Remove the imageFile property before saving to Firestore
    const { imageFile, ...recipeDataWithoutImage } = recipeData;
    await updateDoc(doc(db, 'recipes', recipeId), recipeDataWithoutImage);
    console.log('Recipe updated in Firestore with ID:', recipeId);
  }

  async uploadImage(imageFile, category, imageName, oldImageName = null) {
    const storage = getStorageInstance();
    // Remove old image if it exists and has changed
    if (oldImageName && oldImageName !== imageName) {
      try {
        await deleteObject(ref(storage, `img/recipes/full/${category}/${oldImageName}`));
        await deleteObject(ref(storage, `img/recipes/compressed/${category}/${oldImageName}`));
        console.log('Removed old images from Firebase Storage');
      } catch (error) {
        console.error('Error removing old images:', error);
      }
    }
    // Upload new image (both full and compressed)
    try {
      const compressedImageRef = ref(storage, `img/recipes/compressed/${category}/${imageName}`);
      const fullImageRef = ref(storage, `img/recipes/full/${category}/${imageName}`);
      // Compress the image (replace with your compression logic)
      const compressedImageBlob = await this.compressImage(imageFile);
      // Upload the compressed image
      await uploadBytes(compressedImageRef, compressedImageBlob);
      console.log('Uploaded compressed image to Firebase Storage');
      // Upload the full-size image
      await uploadBytes(fullImageRef, imageFile);
      console.log('Uploaded full-size image to Firebase Storage');
      // No need to return download URL for now
    } catch (error) {
      console.error('Error uploading new images:', error);
    }
  }
  
  // Helper function to compress image (replace with your actual compression logic)
  async compressImage(imageFile) {
    // ... Your image compression logic here ...
    // For now, it returns the original image
    return imageFile;
  }

  showSuccessMessage(message) {
    // Show the success message in the modal
    const editRecipeModal = this.shadowRoot.querySelector('message-modal');
    editRecipeModal.show(message, "Success!");
  }

  showErrorMessage(message, error) {
      // Show the error message in the modal
      const editRecipeModal = this.shadowRoot.querySelector('message-modal');
      editRecipeModal.show(message, "Error!");
  }

  resetFormToCurrentData() {
      // Reset the form to the current recipe data
      this.formComponent.setRecipeData(this.recipeId);
  }
}

customElements.define('edit-recipe-component', EditRecipeComponent);