/**
 * ImageApprovalComponent
 * @class
 * @extends HTMLElement
 * 
 * @description
 * A modal interface for approving or rejecting recipe images. Extends Modal component
 * functionality and integrates with Firebase for image and data management.
 * Features RTL (Right-to-Left) layout support.
 * 
 * @dependencies
 * - Requires Modal component (`custom-modal`)
 * - Firebase Storage for image operations
 * - Firebase Firestore for data management
 * 
 * @cssVariables
 * - Uses default button colors
 * - Customizable through base-button class
 * 
 * @example
 * // HTML
 * <image-approval-component></image-approval-component>
 * 
 * // JavaScript
 * const approvalModal = document.querySelector('image-approval-component');
 * 
 * // Open modal with image data
 * approvalModal.openModalForImage({
 *   imageUrl: 'path/to/image.jpg',
 *   recipeId: 'recipe123',
 *   recipeName: 'Chocolate Cake'
 * });
 * 
 * // Listen for approval/rejection events
 * approvalModal.addEventListener('image-approved', (e) => {
 *   console.log('Image approved for recipe:', e.detail.recipeId);
 * });
 * 
 * approvalModal.addEventListener('image-rejected', (e) => {
 *   console.log('Image rejected for recipe:', e.detail.recipeId);
 * });
 * 
 * @fires image-approved - When an image is approved
 * @property {Object} detail.recipeId - ID of the recipe whose image was approved
 * 
 * @fires image-rejected - When an image is rejected
 * @property {Object} detail.recipeId - ID of the recipe whose image was rejected
 * 
 * @fires modal-opened - Inherited from Modal component
 * @fires modal-closed - Inherited from Modal component
 * 
 * @property {Object} imageData - Current image data being reviewed
 * @property {string} imageData.imageUrl - URL of the image
 * @property {string} imageData.recipeId - Associated recipe ID
 * @property {string} imageData.recipeName - Name of the recipe
 * 
 * @methods
 * - openModalForImage(imageData) - Opens modal with specified image data
 * - closeModal() - Closes the modal and resets state
 */
class ImageApprovalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.imageData = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>
      <custom-modal height="auto">
        <h2>אישור תמונה</h2>
        <div id="recipe-info" class="recipe-info"></div>
        <div id="image-container" class="image-container"></div>
        <div class="buttons">
          <button id="approve-button" class="base-button approve-button">אשר</button>
          <button id="reject-button" class="base-button reject-button">דחה</button>
        </div>
      </custom-modal>
    `;
  }

  styles() {
    return `
      .image-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
      }

      h2 {
        margin: 0;
      }
      
      .image-container img {
        max-width: 100%;
        max-height: 300px;
        border-radius: 10px;
      }
      .recipe-info {
        margin-bottom: 0.5rem;
      }
      .buttons {
        display: flex;
        gap: 10px;
      }
      .base-button {
        padding: 12px;
        width: 100%;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      .approve-button {
        background-color: #4CAF50;
      }
      .approve-button:hover {
        background-color: #45a049;
      }
      .reject-button {
        background-color: #f44336;
      }
      .reject-button:hover {
        background-color: #da190b;
      }
    `;
  }

  setupEventListeners() {
    this.shadowRoot.getElementById('approve-button').addEventListener('click', () => this.handleApprove());
    this.shadowRoot.getElementById('reject-button').addEventListener('click', () => this.handleReject());
  }

  openModalForImage(imageData) {
    this.imageData = imageData;
    this.updateModalContent();
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.open();
  }

  updateModalContent() {
    if (!this.imageData) return;

    const imageContainer = this.shadowRoot.getElementById('image-container');
    imageContainer.innerHTML = `<img src="${this.imageData.imageUrl}" alt="Pending image">`;

    const recipeInfo = this.shadowRoot.getElementById('recipe-info');
    recipeInfo.innerHTML = `
      <p>שם המתכון: ${this.imageData.recipeName}</p>
    `;
  }

  async handleApprove() {
    console.log('Approve button clicked');
    try {
      // Get references to Firebase services
      const storage = firebase.storage();
      const firestore = firebase.firestore();
  
      // Get the recipe document from Firestore
      const recipeDoc = await firestore.collection('recipes').doc(this.imageData.recipeId).get();
      const recipeData = recipeDoc.data();

      const fileExtension = recipeData.pendingImage.fileExtension;
    
      // Update Firestore document to remove pendingImage and set the approved image URL
      await firestore.collection('recipes').doc(this.imageData.recipeId).update({
        image: this.imageData.recipeId + '.' + fileExtension,
        pendingImage: null // Remove the pendingImage field
      });
  
      // Dispatch a custom event
      this.dispatchEvent(new CustomEvent('image-approved', {
        bubbles: true,
        composed: true,
        detail: { recipeId: this.imageData.recipeId }
      }));
  
      // Close the modal
      this.closeModal();
    } catch (error) {
      console.error('Error approving image:', error);
      // You might want to show an error message to the user here
    }
  }

  async handleReject() {
    console.log('Reject button clicked');
    try {
      // Get references to Firebase services
      const storage = firebase.storage();
      const firestore = firebase.firestore();
  
      // Get the recipe document from Firestore
      const recipeDoc = await firestore.collection('recipes').doc(this.imageData.recipeId).get();
      const recipeData = recipeDoc.data();
  
      // Get the file extension
      const fileExtension = recipeData.pendingImage.fileExtension; 
  
      // Delete the full-size and compressed images from Firebase Storage
      const fullSizeRef = storage.ref(`img/recipes/full/${recipeData.category}/${this.imageData.recipeId}.${fileExtension}`);
      await fullSizeRef.delete();
  
      const compressedRef = storage.ref(`img/recipes/compressed/${recipeData.category}/${this.imageData.recipeId}.${fileExtension}`);
      await compressedRef.delete();
  
      // Update Firestore document to remove pendingImage 
      await firestore.collection('recipes').doc(this.imageData.recipeId).update({
        pendingImage: null // Remove the pendingImage field
      });
  
      // Dispatch a custom event
      this.dispatchEvent(new CustomEvent('image-rejected', {
        bubbles: true,
        composed: true,
        detail: { recipeId: this.imageData.recipeId }
      }));
  
      // Close the modal
      this.closeModal();
    } catch (error) {
      console.error('Error rejecting image:', error);
      // You might want to show an error message to the user here
    }
  }

  closeModal() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.close();
    this.imageData = null;
  }
}

customElements.define('image-approval-component', ImageApprovalComponent);