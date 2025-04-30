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

import { getFirestoreInstance, getAuthInstance, getStorageInstance } from '../../../js/services/firebase-service.js';
import { collection, doc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

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
        const db = getFirestoreInstance();
        const auth = getAuthInstance();
        // Store images separately
        const imagesToUpload = recipeData.images || [];
        // Create a copy of recipe data without images
        const recipeDataForFirestore = { ...recipeData };
        delete recipeDataForFirestore.images;  // Remove images array
        // Add timestamp and user info
        recipeDataForFirestore.creationTime = Timestamp.now();
        recipeDataForFirestore.userId = auth.currentUser?.uid || 'anonymous';
        // Save recipe to Firestore first to get the ID
        const recipeRef = await addDoc(collection(db, 'recipes'), recipeDataForFirestore);
        // Upload images if provided
        if (imagesToUpload.length > 0) {
          const imageUploadResults = await this.uploadRecipeImages(
            recipeRef.id, 
            imagesToUpload, 
            recipeDataForFirestore.category
          );
          // Update recipe with image array that matches RecipeComponent expectations
          await updateDoc(doc(db, 'recipes', recipeRef.id), {
            images: imageUploadResults,
            allowImageSuggestions: true // Add a flag to indicate images are present
          });
        }
        // Optionally, you can reset the form here
        this.clearForm();
        // Provide feedback to the user
        this.showSuccessMessage('Recipe proposed successfully!');
    } catch (error) {
        this.showErrorMessage('Error proposing recipe:', error);
    }
  }

  // Helper function to upload image to Firebase Storage
  async uploadRecipeImages(recipeId, images, category) {
    const storage = getStorageInstance();
    const auth = getAuthInstance();
    const imageUploadResults = [];
    for (const imageData of images) {
      const { file, isPrimary } = imageData;
      const fileExtension = file.name.split('.').pop();
      const fileName = isPrimary ? 'primary.jpg' : `${Date.now()}.${fileExtension}`;
      try {
        const fullPath = `img/recipes/full/${category}/${recipeId}/${fileName}`;
        const compressedPath = `img/recipes/compressed/${category}/${recipeId}/${fileName}`;
        // Upload full-size image
        const fullSizeRef = ref(storage, fullPath);
        await uploadBytes(fullSizeRef, file);
        // Create compressed version of the image
        const compressedFile = await this.compressImage(file);
        // Upload compressed version
        const compressedRef = ref(storage, compressedPath);
        await uploadBytes(compressedRef, compressedFile);
        // Add image metadata to results
        imageUploadResults.push({
          full: fullPath,             // Store the full storage path
          compressed: compressedPath,  // Store the compressed storage path
          fileName,
          isPrimary,
          uploadTimestamp: Timestamp.now(),
          uploadedBy: auth.currentUser?.uid || 'anonymous',
          access: 'public'
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
    return imageUploadResults;
  }

  // Helper function to compress image (replace with your actual compression logic)
  async compressImage(imageFile) {
      // TODO: ... Your image compression logic here ...
      // For now, it returns the original image
      return imageFile;
  }

  // Helper functions for showing success/error messages
  showSuccessMessage(message) {
    const proposeRecipeModal = this.shadowRoot.querySelector('message-modal');
    proposeRecipeModal.show('המתכון נשלח בהצלחה!', '', 'Close');
  }

  showErrorMessage(message, error) {
    const proposeRecipeModal = this.shadowRoot.querySelector('message-modal');
    // proposeRecipeModal.show('חלה שגיאה בהעלאת המתכון, אנא נסה שנית מאוחר יותר.', '', 'Close');
    proposeRecipeModal.show(error.message + error.stack, message, 'Close');
  }


  clearForm() {
    const formComponent = this.shadowRoot.querySelector('recipe-form-component');
    formComponent.clearForm();
  }
}

customElements.define('propose-recipe-component', ProposeRecipeComponent);