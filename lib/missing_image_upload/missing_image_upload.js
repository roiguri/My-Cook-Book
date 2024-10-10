class MissingImageUpload extends HTMLElement {
  /**
   * Set Up
   *  */ 
  constructor(cssPath = 'css/missing-image-upload.css') {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      ${this.getTemplate()}
    `;

    // Event LIsteners:
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
          button.addEventListener('click', () => this.openModal());
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
  openModal() {
    console.log('Opening modal');
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

}

customElements.define('missing-image-upload', MissingImageUpload);



// Test code
document.addEventListener('DOMContentLoaded', () => {
  const testComponent = document.createElement('missing-image-upload');
  document.body.appendChild(testComponent);
  console.log('Styles in shadow DOM:', !!testComponent.shadowRoot.querySelector('style'));
  console.log('Style content:', testComponent.shadowRoot.querySelector('style').textContent);
});