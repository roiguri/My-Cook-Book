/**
 * MissingImageUpload Component
 * 
 * Purpose:
 * This custom web component provides a modal interface for uploading missing images
 * for recipes in a recipe management system. It allows users to select an image file,
 * preview it, and upload it to Firebase Storage. The component is designed to be
 * easily integrated into existing web pages and works in conjunction with Firebase
 * for storage functionality.
 * 
 * Features:
 * - Modal interface for image upload
 * - File selection with type validation (image files only)
 * - Image preview before upload
 * - Integration with Firebase Storage for image upload
 * - Error handling and user feedback
 * 
 * How to use:
 * 1. Include this script in your HTML file:
 *    <script src="path/to/missing_image_upload.js"></script>
 * 
 * 2. Add the custom element to your HTML:
 *    <missing-image-upload></missing-image-upload>
 * 
 * 3. Create buttons or links with the class 'upload-missing-image-button' and 
 *    a 'data-recipe-id' attribute (unique ID of the recipe as represented in firestore):
 *    <button class="upload-missing-image-button" data-recipe-id="123">Upload Image</button>
 * 
 * 4. Ensure Firebase is properly initialized in your project before using this component.
 * 
 * Note: This component assumes the existence of certain CSS variables for styling.
 * Make sure to define these variables in your global CSS or adjust the component's
 * internal styles as needed.
 */

class MissingImageUpload extends HTMLElement {
  /**
   * ##Set-Up
   *  */ 
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      ${this.getTemplate()}
    `;

    // Get the recipe ID from the custom attribute
    this.recipeId = null;

    // Event Listeners:
    this.shadowRoot.getElementById('clear-image').addEventListener('click', () => this.clearFileInput());
    
    console.log('MissingImageUpload component constructed');
  }

  connectedCallback() {
    console.log('MissingImageUpload component connected to DOM');
  
    
    // Set up event listener for closing the modal
    const closeButton = this.shadowRoot.getElementById('modal-close');
    closeButton.addEventListener('click', () => this.closeModal());
  
    // Initially hide the modal
    this.shadowRoot.querySelector('.modal').style.display = 'none';

    // Add event listeners to existing buttons with a specific class
    const existingButtons = document.querySelectorAll('.upload-missing-image-button');
    console.log('Found buttons:', existingButtons);
    if (existingButtons.length > 0) {
      existingButtons.forEach(button => {
        if (button instanceof HTMLElement) {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            const recipeId = button.getAttribute('data-recipe-id');
            this.openModal(recipeId);
          });
          console.log('Event listener added to button:', button);
        }
      });
    } else {
      console.warn('No buttons with class "upload-missing-image-button" found');
    }

    // Add event listener to close modal when clicking outside
    const modal = this.shadowRoot.querySelector('.modal');
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeModal();
      }
    });

    // Add event listener for file selection
    const fileInput = this.shadowRoot.getElementById('recipe-image');
    fileInput.addEventListener('change', (event) => this.handleFileSelect(event));

    // Add event listener for form submission
    const form = this.shadowRoot.getElementById('image-upload-form');
    form.addEventListener('submit', (event) => this.handleSubmit(event));
  }

  /**
   * ##CSS - styles
   *  */ 
  getStyles() {
    return `
      .modal {
        display: block;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.4);
      }
      .modal-content {
        background-color: var(--background-color, #f5f2e9);
        margin: 15% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 300px;
        max-width: 80%;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .close {
        background-color: var(--secondary-color, #e6dfd1);
        border: none;
        padding: 10px;
        cursor: pointer;
        flex-grow: 1;

        font-size: 18px;
        font-weight: bold;
        
        align-self: start;
        position: relative;
        top: -20px;
        right: -20px;
        width: 30px;
        border-bottom-left-radius: 10px;
        border-top-right-radius: 10px;
        margin-bottom: -20px;
        text-align: center;
      }
      .close:hover {
        color: white;
        background-color: var(--primary-color, #bb6016);
      }

      .propose-image-form {
        background-color: var(--secondary-color, #e6dfd1);
        padding: 1rem;
        border-radius: 10px;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
        color: var(--primary-color, #bb6016);
      }
      input[type="file"] {
        width: auto;
        padding: 0.5rem;
        border: 1px solid var(--primary-color, #bb6016);
        border-radius: 5px;
      }

      .buttons {
        display: flex;
        gap: 10px;
      }
      
      .base-button {
        padding: 12px;
        width: 100%;
        padding: 0.75rem;
        background-color: var(--primary-color, #bb6016);
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-family: var(--body-font, 'Lora', serif);
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      .base-button:hover {
        background-color: var(--primary-hover, #5c4033);
      }

      #recipe-image {
        border: 1px solid var(--primary-color, #bb6016);
        transition: border-color 0.3s ease;
      }

      #recipe-image.invalid {
        border: 2px solid red;
      }

      #image-preview-container {
        display: flex;
        justify-content: center;
        margin-top: -10px;
        margin-bottom: 10px;
      }

      .image-preview {
        max-width: 100%; 
        max-height: 200px;
        border-radius: 20px;
      }

      .invalid {
        border: 2px solid red !important;
      }

      .error-message {
        color: red;
        font-size: 0.8em;
        margin-top: 5px;
      }
    `;
  }

  /**
   * ##HTML Template
   *  */ 
  getTemplate() {
    return `
      <div dir="rtl" class="modal">
        <div class="modal-content">
          <button class="close" id="modal-close">&times;</button>
          <h2>העלאת תמונה חדשה</h2>
          <form id="image-upload-form" class="propose-image-form">
            <div class="form-group">
              <input type="file" id="recipe-image" name="recipe-image" accept="image/*" required>
              <div id="error-message" class="error-message"></div>
            </div>
            <div id="image-preview-container"></div>
            <div class="buttons">
              <button type="submit" class="base-button submit-button">שלח</button>
              <button type="button" id="clear-image" class="base-button clear-button">נקה</button>
            </div>
            </form>
        </div>
      </div>
    `;
  }

  /**
   * ##Functionality
   *  */ 
  openModal(recipeID) {
    console.log('Opening modal');
    console.log(`the id is: ${recipeID}`);
    this.recipeID = recipeID;
    const modal = this.shadowRoot.querySelector('.modal');
    modal.style.display = 'block';
  }

  closeModal() {
    console.log('Closing modal');
    const modal = this.shadowRoot.querySelector('.modal');
    modal.style.display = 'none';
  }

  clearFileInput() {
    const fileInput = this.shadowRoot.getElementById('recipe-image');
    fileInput.value = '';
  
    const previewContainer = this.shadowRoot.getElementById('image-preview-container');
    previewContainer.innerHTML = '';
    
    // Remove any error styling and hide error message
    fileInput.classList.remove('invalid');
    this.displayErrorMessage('');
    
    console.log('File input cleared');
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    const fileInput = event.target;
    
    if (file) {
      console.log('File selected:', file.name);
      
      // Check if the file is an image
      if (file.type.startsWith('image/')) {
        console.log('Valid image file selected');
        this.previewImage(file);
        
        // Remove any previous error styling and hide error message
        fileInput.classList.remove('invalid');
        this.displayErrorMessage('');
      } else {
        console.error('Invalid file type. Please select an image.');
        this.displayErrorMessage('יש לבחור קובץ תמונה: jpg/jpeg/png');


        fileInput.classList.add('invalid');
        fileInput.value = '';
      }
    }
  }

  displayErrorMessage(message) {
    const errorMessageElement = this.shadowRoot.getElementById('error-message');
    errorMessageElement.textContent = message;
  }

  clearError() {
    const fileInput = this.shadowRoot.getElementById('recipe-image');
    const errorMessageElement = this.shadowRoot.getElementById('error-message');
    
    errorMessageElement.textContent = '';
  }

  previewImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewContainer = this.shadowRoot.getElementById('image-preview-container');
      previewContainer.innerHTML = `<img class="image-preview" src="${e.target.result}" alt="Image preview">`;
    };
    reader.readAsDataURL(file);
  }

  async handleSubmit(event) {
    event.preventDefault();

    const fileInput = this.shadowRoot.getElementById('recipe-image');
    const file = fileInput.files[0];

    // 1. Check if a file was uploaded
    if (!file) {
      this.displayErrorMessage('Please select an image file.');
      return;
    }

    try {
      // 2. Save the image in Firebase Storage
      const imageUrl = await this.uploadImageToFirebase(file);

      // 3. Show success alert
      alert('Image uploaded successfully!');

      // Close the modal
      this.closeModal();
      console.log('Form submitted');
    } catch (error) {
      console.error('Error uploading image:', error);
      this.displayErrorMessage('העלאת התמונה נכשלה. אנא נסה שנית מאוחר יותר');
    }
  }

  async uploadImageToFirebase(file) {
    console.log(this.recipeID);
    if (!this.recipeID) {
      throw new Error('Recipe ID is not set');
    }

    const storage = firebase.storage();
    const fileExtension = file.name.split('.').pop();
    console.log(fileExtension);
    const fileName = `${this.recipeID}.${fileExtension}`;
    const imageRef = storage.ref(`pendingImages/${fileName}`);

    try {
      const snapshot = await imageRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Error uploading to Firebase Storage:', error);
      throw error;
    }
  }
}

customElements.define('missing-image-upload', MissingImageUpload);