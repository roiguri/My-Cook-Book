class ProposeRecipeComponent extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
      this.render();

      // Get the recipe form component within this component
      this.formComponent = this.shadowRoot.querySelector('recipe-form-component');

      // Listen for the 'recipe-data-collected' event dispatched by the form component
      this.formComponent.addEventListener('recipe-data-collected', this.handleRecipeData.bind(this));
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
        // Add approved: false to the recipe data
        recipeData.approved = false;

        // Remove the imageFile property before saving to Firestore
        const { imageFile, ...recipeDataWithoutImage } = recipeData; 

        // Save the recipe data to Firestore
        const recipeRef = await this.saveRecipeToFirestore(recipeDataWithoutImage);

        // Upload the image if provided
        if (recipeData.imageFile) {
            // Get the file extension
            const fileExtension = recipeData.imageFile.name.split('.').pop();
            const imageName = `${recipeRef.id}.${fileExtension}`;

            const imageUrl = await this.uploadImage(recipeData.imageFile, recipeData.category, imageName);
            recipeData.image = imageName; // Store only the image name in Firestore
            await recipeRef.update({ image: imageName }); // Update the recipe with the image name
        }

        // Optionally, you can reset the form here
        this.formComponent.clearForm();

        // Provide feedback to the user
        this.showSuccessMessage('Recipe proposed successfully!');
    } catch (error) {
        this.showErrorMessage('Error proposing recipe:', error);
    }
  }

  // Helper function to upload image to Firebase Storage
  async uploadImage(imageFile, category, imageName) {
    const storage = firebase.storage();
    
    // Upload full-size image
    const fullSizeRef = storage.ref(`img/recipes/full/${category}/${imageName}`);
    await fullSizeRef.put(imageFile);
    console.log('Uploaded full-size image to Firebase Storage');

    // Compress the image (replace with your compression logic)
    const compressedImageBlob = await this.compressImage(imageFile);

    // Upload the compressed image
    const compressedRef = storage.ref(`img/recipes/compressed/${category}/${imageName}`);
    await compressedRef.put(compressedImageBlob);
    console.log('Uploaded compressed image to Firebase Storage');
  }

  // Helper function to compress image (replace with your actual compression logic)
  async compressImage(imageFile) {
      // ... Your image compression logic here ...
      // For now, it returns the original image
      return imageFile;
  }

  // Helper function to save recipe data to Firestore
  async saveRecipeToFirestore(recipeData) {
      const db = firebase.firestore();
      const recipeRef = await db.collection('recipes').add(recipeData);
      console.log('Recipe saved to Firestore with ID:', recipeRef.id);
      return recipeRef; // Return the reference to the saved recipe
  }

  // Helper functions for showing success/error messages
  showSuccessMessage(message) {
      modal.show('המתכון נשלח בהצלחה!', '', 'Close');
  }

  showErrorMessage(message, error) {
    modal.show('חלה שגיאה בהעלאת המתכון, אנא נסה שנית מאוחר יותר.', '', 'Close');

  }
}

customElements.define('propose-recipe-component', ProposeRecipeComponent);