class ImageHandler extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    this.images = [];
    this.maxImages = 5;
    this.draggedImage = null;   
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .image-handler {
          font-family: var(--body-font);
          width: 100%;
        }

        .upload-area {
          border: 2px dashed var(--primary-color, #bb6016);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .upload-area.drag-over {
          background-color: rgba(187, 96, 22, 0.1);
        }

        .upload-area[data-disabled="true"] {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .selected-files {
          margin-top: 10px;
          font-size: 0.9em;
          color: #666;
        }

        .file-input {
          display: none;
        }

        .preview-container {
          position: relative;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
          padding: 0.5rem 0;
        }

        .image-preview {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid var(--primary-color, #bb6016);
          cursor: move;
          transition: all 0.2s ease;
          user-select: none;
        }

        .image-preview.dragging {
          opacity: 0.5;
          transform: scale(0.95);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .image-preview.primary {
          border-color: var(--secondary);
          box-shadow: 0 0 10px rgba(var(--secondary), 0.5);
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-preview.uploading::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .image-preview:hover .image-controls {
          opacity: 1;
        }

        .image-controls {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .control-button {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 2px;
          cursor: pointer;
          font-size: 0.8em;
          color: #333;
          width: 80%;
        }

        .control-button:hover {
          background: white;
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          display: none;
        }

        .progress-bar__fill {
          height: 100%;
          background: var(--primary-color, #bb6016);
          width: 0%;
          transition: width 0.3s ease;
        }

        .error-message {
          color: red;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        .status-message {
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        .drop-indicator {
          position: absolute;
          width: calc(100% - 2rem); /* Account for container padding */
          height: 3px;
          background-color: var(--primary-color, #bb6016);
          box-shadow: 0 0 5px rgba(187, 96, 22, 0.5);
          transition: transform 0.2s ease;
          pointer-events: none;
          display: none;
          z-index: 1000;
          margin: 0 1rem;
        }

        .image-preview.primary::after {
          content: '✓';
          position: absolute;
          top: 5px;
          right: 5px;
          background: var(--secondary);
          color: black;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .primary-label {
          position: absolute;
          top: 30px;
          right: 5px;
          background: var(--secondary);
          opacity: 0.9;
          color: black;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }

        .error-container {
          background-color: #ffebee;
          color: #c62828;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 10px;
          font-size: 0.9em;
          display: none;
        }
      </style>

      <div class="image-handler">
        <div class="error-container"></div>
        <div class="upload-area" data-disabled="false">
          גרור תמונות לכאן או לחץ להעלאה
          <div class="status-message">
            (מקסימום ${this.maxImages} תמונות, גודל מקסימלי 5MB לתמונה)
          </div>
          <div class="selected-files"></div>
        </div>
        <input type="file" class="file-input" accept="image/jpeg,image/png,image/webp" multiple>
        <div class="error-message"></div>
        <div class="preview-container"></div>
      </div>
    `;
  }

  setupEventListeners() {
    const uploadArea = this.shadowRoot.querySelector('.upload-area');
    const fileInput = this.shadowRoot.querySelector('.file-input');

    // Click to upload
    uploadArea.addEventListener('click', () => {
      if (uploadArea.getAttribute('data-disabled') !== 'true') {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
      fileInput.value = ''; // Reset input
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (uploadArea.getAttribute('data-disabled') !== 'true') {
        uploadArea.classList.add('drag-over');
      }
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      
      if (uploadArea.getAttribute('data-disabled') !== 'true') {
        const files = Array.from(e.dataTransfer.files).filter(file => 
          this.allowedTypes.includes(file.type)
        );
        this.handleFiles(files);
      }
    });

    // Drag and drop reordering
    const previewContainer = this.shadowRoot.querySelector('.preview-container');
    const dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    previewContainer.appendChild(dropIndicator);
    
    previewContainer.addEventListener('dragstart', (e) => {
      const preview = e.target.closest('.image-preview');
      if (preview) {
        this.draggedImage = preview;
        preview.classList.add('dragging');
        // Set dragged element data
        e.dataTransfer.setData('text/plain', preview.getAttribute('data-id'));
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    previewContainer.addEventListener('dragend', (e) => {
      const preview = e.target.closest('.image-preview');
      if (preview) {
        preview.classList.remove('dragging');
        this.draggedImage = null;
        dropIndicator.style.display = 'none';
      }
    });

    previewContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target.closest('.image-preview');
      
      if (target && this.draggedImage && target !== this.draggedImage) {
        e.dataTransfer.dropEffect = 'move';
        
        const allPreviews = [...previewContainer.querySelectorAll('.image-preview')];
        const targetIndex = allPreviews.indexOf(target);
        const draggedIndex = allPreviews.indexOf(this.draggedImage);
        
        dropIndicator.style.display = 'block';
        const targetRect = target.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        
        // Calculate position for drop indicator
        if (targetIndex > draggedIndex) {
          dropIndicator.style.transform = `translateY(${targetRect.bottom - containerRect.top}px)`;
        } else {
          dropIndicator.style.transform = `translateY(${targetRect.top - containerRect.top}px)`;
        }
      }
    });

    previewContainer.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });

    previewContainer.addEventListener('dragleave', (e) => {
      if (!e.target.closest('.image-preview')) {
        dropIndicator.style.display = 'none';
      }
    });

    previewContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      dropIndicator.style.display = 'none';
      
      const target = e.target.closest('.image-preview');
      if (!target || !this.draggedImage || target === this.draggedImage) return;
      
      const allPreviews = [...previewContainer.querySelectorAll('.image-preview')];
      const fromIndex = allPreviews.indexOf(this.draggedImage);
      const toIndex = allPreviews.indexOf(target);
      
      // Perform the reorder
      this.reorderImages(fromIndex, toIndex);
    });
  }

  async handleFiles(files) {
    const remainingSlots = this.maxImages - this.images.length;
    
    if (remainingSlots <= 0) {
      this.showError(`לא ניתן להעלות יותר מ-${this.maxImages} תמונות`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    
    for (const file of filesToProcess) {
      const validation = this.validateFile(file);
      
      if (!validation.valid) {
        this.showError(validation.error);
        continue;
      }

      try {
        const preview = await this.createImagePreview(file);
        const imageData = {
          file,
          preview,
          id: Math.random().toString(36).substr(2, 9)
        };
        
        this.addImage(imageData);
        
        // Dispatch event for new file
        this.dispatchEvent(new CustomEvent('file-added', {
          detail: { imageData },
          bubbles: true,
          composed: true
        }));
      } catch (error) {
        this.showError('שגיאה בטעינת התמונה');
      }
    }

    this.updateUploadAreaState();
  }

  validateFile(file) {
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'סוג הקובץ לא נתמך. נא להעלות תמונות מסוג JPEG, PNG או WebP בלבד'
      };
    }

    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: 'התמונה גדולה מדי. הגודל המקסימלי המותר הוא 5MB'
      };
    }

    return { valid: true };
  }

  updateSelectedFiles() {
    const filesArea = this.shadowRoot.querySelector('.selected-files');
    if (this.images.length === 0) {
      filesArea.textContent = '';
      return;
    }

    const fileNames = this.images.map(img => img.file.name);
    filesArea.textContent = `קבצים נבחרו: ${fileNames.join(', ')}`;
  }

  reorderImages(fromIndex, toIndex) {
    const image = this.images.splice(fromIndex, 1)[0];
    this.images.splice(toIndex, 0, image);
    this.updatePreviewContainer();
    
    this.dispatchEvent(new CustomEvent('images-reordered', {
      detail: { images: this.images },
      bubbles: true,
      composed: true
    }));
  }

  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  addImage(imageData) {
    this.images.push({
      ...imageData,
      isPrimary: this.images.length === 0 // First image is primary by default
    });
    this.updatePreviewContainer();
    this.updateUploadAreaState();
    this.updateSelectedFiles();
  }

  removeImage(imageId) {
    const wasOnlyImage = this.images.length === 1;
    const removedImage = this.images.find(img => img.id === imageId);
    const wasPrimary = removedImage?.isPrimary;
    
    this.images = this.images.filter(img => img.id !== imageId);
    
    // If we removed the primary image and there are other images, make the first one primary
    if (wasPrimary && this.images.length > 0) {
      this.images[0].isPrimary = true;
    }
    
    this.updatePreviewContainer();
    this.updateUploadAreaState();
    
    // Clear the selected files if no images remain
    if (wasOnlyImage) {
      this.updateSelectedFiles();
    }

    this.dispatchEvent(new CustomEvent('images-changed', {
      detail: { images: this.images },
      bubbles: true,
      composed: true
    }));
  }

  setPrimaryImage(imageId) {
    this.images = this.images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    this.updatePreviewContainer();
    
    this.dispatchEvent(new CustomEvent('primary-image-changed', {
      detail: { imageId },
      bubbles: true,
      composed: true
    }));
  }

  updatePreviewContainer() {
    const container = this.shadowRoot.querySelector('.preview-container');
    container.innerHTML = '';

    this.images.forEach((image, index) => {
      const preview = document.createElement('div');
      preview.className = `image-preview${image.isPrimary ? ' primary' : ''}`;
      preview.draggable = true;
      preview.setAttribute('data-id', image.id);
      
      preview.innerHTML = `
        <img src="${image.preview}" alt="Image preview">
        ${image.isPrimary ? '<div class="primary-label">תמונה ראשית</div>' : ''}
        <div class="progress-bar">
          <div class="progress-bar__fill"></div>
        </div>
        <div class="image-controls">
          <button class="control-button remove-button">הסר</button>
          ${!image.isPrimary ? `<button class="control-button primary-button">הגדר כראשית</button>` : ''}
        </div>
      `;

      preview.querySelector('.remove-button').addEventListener('click', () => {
        this.removeImage(image.id);
      });

      if (!image.isPrimary) {
        preview.querySelector('.primary-button').addEventListener('click', () => {
          this.setPrimaryImage(image.id);
        });
      }

      container.appendChild(preview);
    });
    this.updateSelectedFiles();
  }

  updateUploadAreaState() {
    const uploadArea = this.shadowRoot.querySelector('.upload-area');
    uploadArea.setAttribute('data-disabled', this.images.length >= this.maxImages);
  }

  showError(message) {
    const errorContainer = this.shadowRoot.querySelector('.error-container');
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }

  // Public API Methods

  /**
   * Set upload progress for a specific image
   * @param {string} imageId - The ID of the image
   * @param {number} progress - Progress percentage (0-100)
   */
  setImageProgress(imageId, progress) {
    const imageEl = this.shadowRoot.querySelector(`.image-preview[data-id="${imageId}"]`);
    if (imageEl) {
      const progressBar = imageEl.querySelector('.progress-bar__fill');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    }
  }

  /**
   * Mark an image as uploading
   * @param {string} imageId - The ID of the image
   * @param {boolean} isUploading - Whether the image is currently uploading
   */
  setImageUploading(imageId, isUploading) {
    const imageEl = this.shadowRoot.querySelector(`.image-preview[data-id="${imageId}"]`);
    if (imageEl) {
      imageEl.classList.toggle('uploading', isUploading);
      const progressBar = imageEl.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.display = isUploading ? 'block' : 'none';
      }
    }
  }

  /**
   * Mark an image as uploaded successfully
   * @param {string} imageId - The ID of the image
   * @param {string} uploadedUrl - The URL of the uploaded image
   */
  setImageUploaded(imageId, uploadedUrl) {
    const imageData = this.images.find(img => img.id === imageId);
    if (imageData) {
      imageData.uploadedUrl = uploadedUrl;
      this.setImageUploading(imageId, false);
    }
  }

  /**
   * Show error for a specific image
   * @param {string} imageId - The ID of the image
   * @param {string} error - Error message
   */
  setImageError(imageId, error) {
    const imageEl = this.shadowRoot.querySelector(`.image-preview[data-id="${imageId}"]`);
    if (imageEl) {
      this.setImageUploading(imageId, false);
      imageEl.classList.add('error');
      this.showError(error);
    }
  }

  /**
   * Get all selected images
   * @returns {Array} Array of image data objects
   */
  getImages() {
    return [...this.images];
  }

  /**
   * Clear all images
   */
  clearImages() {
    this.images = [];
    this.updatePreviewContainer();
    this.updateUploadAreaState();
    this.dispatchEvent(new CustomEvent('images-cleared'));
  }

  /**
   * Set maximum number of images allowed
   * @param {number} count - Maximum number of images
   */
  setMaxImages(count) {
    this.maxImages = count;
    this.shadowRoot.querySelector('.status-message').textContent = 
      `(מקסימום ${this.maxImages} תמונות, גודל מקסימלי 5MB לתמונה)`;
    this.updateUploadAreaState();
  }
}

customElements.define('image-handler', ImageHandler);