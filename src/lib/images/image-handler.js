import { generateImageId } from '../../js/utils/recipes/recipe-image-utils.js';
import { uploadZoneStyles } from '../../styles/components/upload-zone-styles.js';
import authService from '../../js/services/auth-service.js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './image-editor.js';

class ImageHandler extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    this.images = [];
    this.maxImages = 5;
    this.draggedImage = null;
    this.removedImages = [];
    this.canEnhance = false;
  }

  static get observedAttributes() {
    return ['hide-upload'];
  }

  async connectedCallback() {
    this.render();
    this.setupEventListeners();

    // Check if user can use AI enhancement
    this.canEnhance = await authService.isApproved();
    if (this.canEnhance) {
      this.updatePreviewContainer(); // Re-render to show enhance buttons
    }

    this.boundDocumentClickHandler = this.handleDocumentClick.bind(this);
    document.addEventListener('click', this.boundDocumentClickHandler);

    this.updateUploadAreaVisibility();
  }

  disconnectedCallback() {
    if (this.boundDocumentClickHandler) {
      document.removeEventListener('click', this.boundDocumentClickHandler);
    }
  }

  attributeChangedCallback(name) {
    if (name === 'hide-upload') {
      this.updateUploadAreaVisibility();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .image-handler {
          font-family: var(--font-ui-he, sans-serif);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        ${uploadZoneStyles}

        :host([hide-upload]) .upload-zone { display: none; }

        .selected-files {
          margin-top: 10px;
          font-size: 12px;
          color: var(--ink-3, rgba(31,29,24,0.55));
        }

        .preview-container {
          position: relative;
          display: flex;
          gap: 1rem;
          margin-top: 4px;
          padding: 0.5rem 0;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
        }

        .preview-container::-webkit-scrollbar {
          height: 6px;
        }

        .preview-container::-webkit-scrollbar-track {
          background: var(--surface-2, #f0ede6);
          border-radius: var(--r-pill, 999px);
        }

        .preview-container::-webkit-scrollbar-thumb {
          background: var(--primary, #6a994e);
          border-radius: var(--r-pill, 999px);
        }

        .preview-container::-webkit-scrollbar-thumb:hover {
          background: var(--primary-dark, #386641);
        }

        .image-preview {
          position: relative;
          width: 150px;
          height: 150px;
          flex-shrink: 0;
          border-radius: var(--r-sm, 8px);
          overflow: hidden;
          border: 1px solid var(--hairline-strong, rgba(31,29,24,0.2));
          box-shadow: var(--shadow-1, 0 1px 4px rgba(31,29,24,0.08));
          cursor: move;
          transition: box-shadow var(--dur-1, 160ms), transform var(--dur-1, 160ms);
          user-select: none;
        }

        .image-preview.dragging {
          opacity: 0.5;
          transform: scale(0.95);
          box-shadow: var(--shadow-3, 0 8px 24px rgba(31,29,24,0.16));
        }

        .image-preview.primary {
          box-shadow: inset 0 0 0 3px var(--primary, #6a994e), var(--shadow-1, 0 1px 4px rgba(31,29,24,0.08));
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-preview.uploading::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.45);
        }

        .image-controls {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(31,29,24,0.55);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          opacity: 0;
          transition: opacity var(--dur-1, 160ms);
          pointer-events: none;
        }

        .image-controls.visible {
          opacity: 1;
          pointer-events: auto;
        }

        @media (hover: hover) and (pointer: fine) {
          .image-preview:hover .image-controls {
            opacity: 1;
            pointer-events: auto;
          }
        }

        .control-button {
          font-family: var(--font-ui-he, sans-serif);
          font-size: 12px;
          font-weight: 500;
          border-radius: var(--r-sm, 8px);
          padding: 5px 12px;
          cursor: pointer;
          width: 80%;
          border: 1px solid transparent;
          transition: background var(--dur-1, 160ms);
        }

        .control-button.remove-button {
          background: var(--secondary, #e05050);
          color: #fff;
        }

        .control-button.remove-button:hover {
          background: var(--secondary-dark, #bc4749);
        }

        .control-button.primary-button {
          background: rgba(255,255,255,0.15);
          color: #fff;
          border-color: rgba(255,255,255,0.5);
        }

        .control-button.primary-button:hover {
          background: rgba(255,255,255,0.25);
        }

        .control-button.edit-button, .control-button.enhance-button {
          background: rgba(255,255,255,0.15);
          color: #fff;
          border-color: rgba(255,255,255,0.5);
        }

        .control-button.edit-button:hover, .control-button.enhance-button:hover {
          background: rgba(255,255,255,0.25);
        }

        .image-preview.enhancing::after {
          content: '...משפר';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          z-index: 5;
        }

        .progress-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 4px;
          background: rgba(255,255,255,0.3);
          display: none;
        }

        .progress-bar__fill {
          height: 100%;
          background: var(--primary, #6a994e);
          width: 0%;
          transition: width 0.3s ease;
        }

        .error-message {
          display: none;
        }

        .status-message {
          margin-top: 6px;
          font-size: 12px;
          color: var(--ink-3, rgba(31,29,24,0.55));
        }

        .drop-indicator {
          position: absolute;
          width: calc(100% - 2rem);
          height: 3px;
          background: var(--primary, #6a994e);
          box-shadow: 0 0 6px rgba(106,153,78,0.5);
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
          background: var(--primary, #6a994e);
          color: #fff;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          box-shadow: var(--shadow-1, 0 1px 4px rgba(31,29,24,0.08));
        }

        .primary-label {
          position: absolute;
          top: 30px;
          right: 5px;
          background: var(--primary, #6a994e);
          color: #fff;
          padding: 2px 7px;
          border-radius: var(--r-pill, 999px);
          font-size: 10px;
          font-weight: 500;
        }

        .error-container {
          background: #faeaea;
          color: var(--secondary-dark, #bc4749);
          border: 1px solid #e8b3b3;
          padding: 10px 14px;
          border-radius: var(--r-sm, 8px);
          margin-bottom: 10px;
          font-size: 13.5px;
          font-family: var(--font-ui-he, sans-serif);
          display: none;
        }
      </style>

      <div class="image-handler">
        <div class="error-container"></div>
        <div class="upload-zone" data-disabled="false">
          גרור תמונות לכאן או לחץ להעלאה
          <div class="status-message">
            (מקסימום ${this.maxImages} תמונות, גודל מקסימלי 5MB לתמונה)
          </div>
          <div class="selected-files"></div>
        </div>
        <input type="file" class="file-input" accept="image/jpeg,image/png,image/webp" multiple>
        <div class="error-message"></div>
        <div class="preview-container"></div>
        <image-editor id="image-editor"></image-editor>
      </div>
    `;
  }

  handleDocumentClick(e) {
    const path = e.composedPath();
    if (!path.includes(this)) {
      const visibleControls = this.shadowRoot.querySelectorAll('.image-controls.visible');
      visibleControls.forEach((ctrl) => ctrl.classList.remove('visible'));
    }
  }

  setupEventListeners() {
    const uploadArea = this.shadowRoot.querySelector('.upload-zone');
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
        const files = Array.from(e.dataTransfer.files).filter((file) =>
          this.allowedTypes.includes(file.type),
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

    // Image editor events
    const imageEditor = this.shadowRoot.getElementById('image-editor');
    imageEditor.addEventListener('image-saved', (e) => {
      const { imageId, file, preview } = e.detail;
      this.updateImageData(imageId, { file, preview });
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
          id: generateImageId(),
        };

        this.addImage(imageData);

        // Dispatch event for new file
        this.dispatchEvent(
          new CustomEvent('file-added', {
            detail: { imageData },
            bubbles: true,
            composed: true,
          }),
        );
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
        error: 'סוג הקובץ לא נתמך. נא להעלות תמונות מסוג JPEG, PNG או WebP בלבד',
      };
    }

    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: 'התמונה גדולה מדי. הגודל המקסימלי המותר הוא 5MB',
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

    const fileNames = this.images
      .map((img) => (img.file ? img.file.name : img.fileName || img.id || 'תמונה קיימת'))
      .filter(Boolean);
    filesArea.textContent = `קבצים נבחרו: ${fileNames.join(', ')}`;
  }

  reorderImages(fromIndex, toIndex) {
    const image = this.images.splice(fromIndex, 1)[0];
    this.images.splice(toIndex, 0, image);
    this.updatePreviewContainer();

    this.dispatchEvent(
      new CustomEvent('images-reordered', {
        detail: { images: this.images },
        bubbles: true,
        composed: true,
      }),
    );
  }

  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  addImage(imageData) {
    this.images.push({
      ...imageData,
      isPrimary: imageData.isPrimary ?? this.images.length === 0,
    });
    this.updatePreviewContainer();
    this.updateUploadAreaState();
    this.updateSelectedFiles();
  }

  removeImage(imageId) {
    const wasOnlyImage = this.images.length === 1;
    const removedImage = this.images.find((img) => img.id === imageId);
    const wasPrimary = removedImage?.isPrimary;

    // Track removed images if they have id/full (i.e., are existing images)
    if (removedImage && (removedImage.id || removedImage.full)) {
      this.removedImages.push({
        id: removedImage.id,
        full: removedImage.full,
      });
    }

    this.images = this.images.filter((img) => img.id !== imageId);

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

    this.dispatchEvent(
      new CustomEvent('images-changed', {
        detail: { images: this.images },
        bubbles: true,
        composed: true,
      }),
    );
  }

  setPrimaryImage(imageId) {
    this.images = this.images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    this.updatePreviewContainer();

    this.dispatchEvent(
      new CustomEvent('primary-image-changed', {
        detail: { imageId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  updatePreviewContainer() {
    const container = this.shadowRoot.querySelector('.preview-container');
    if (!container) return;
    container.innerHTML = '';

    this.images.forEach((image, index) => {
      const preview = document.createElement('div');
      preview.className = `image-preview${image.isPrimary ? ' primary' : ''}${image.isEnhancing ? ' enhancing' : ''}`;
      preview.draggable = true;
      preview.setAttribute('data-id', image.id);

      preview.innerHTML = `
        <img src="${image.preview}" alt="Image preview">
        ${image.isPrimary ? '<div class="primary-label">תמונה ראשית</div>' : ''}
        <div class="progress-bar">
          <div class="progress-bar__fill"></div>
        </div>
        <div class="image-controls">
          <button class="control-button edit-button">ערוך</button>
          ${this.canEnhance ? '<button class="control-button enhance-button">שפר (AI)</button>' : ''}
          <button class="control-button remove-button">הסר</button>
          ${!image.isPrimary ? `<button class="control-button primary-button">הגדר כראשית</button>` : ''}
        </div>
      `;

      const controls = preview.querySelector('.image-controls');
      const removeButton = preview.querySelector('.remove-button');
      const primaryButton = preview.querySelector('.primary-button');
      const editButton = preview.querySelector('.edit-button');
      const enhanceButton = preview.querySelector('.enhance-button');

      // Toggle overlay visibility on click (for mobile)
      preview.addEventListener('click', (e) => {
        if (e.target.closest('.control-button')) {
          return;
        }

        e.stopPropagation();

        // Close all other overlays
        container.querySelectorAll('.image-controls.visible').forEach((ctrl) => {
          if (ctrl !== controls) {
            ctrl.classList.remove('visible');
          }
        });

        // Toggle this overlay
        controls.classList.toggle('visible');
      });

      // Button event handlers (prevent event bubbling to avoid toggle)
      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeImage(image.id);
      });

      if (primaryButton) {
        primaryButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setPrimaryImage(image.id);
        });
      }

      if (editButton) {
        editButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleEditImage(image.id);
        });
      }

      if (enhanceButton) {
        enhanceButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleEnhanceImage(image.id);
        });
      }

      container.appendChild(preview);
    });
    this.updateSelectedFiles();
  }

  handleEditImage(imageId) {
    const image = this.images.find((img) => img.id === imageId);
    if (image) {
      const editor = this.shadowRoot.getElementById('image-editor');
      editor.open(image);
    }
  }

  async handleEnhanceImage(imageId) {
    const image = this.images.find((img) => img.id === imageId);
    if (!image || image.isEnhancing) return;

    try {
      this.updateImageData(imageId, { isEnhancing: true });

      const functions = getFunctions();
      const enhanceRecipeImage = httpsCallable(functions, 'enhanceRecipeImage');

      // Convert preview (data URL) to base64 if needed, or use the file
      let base64;
      let mimeType = 'image/jpeg';

      if (image.file) {
        const reader = new FileReader();
        base64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.readAsDataURL(image.file);
        });
        mimeType = image.file.type;
      } else {
        base64 = image.preview.split(',')[1];
      }

      const result = await enhanceRecipeImage({ image: base64, mimeType });
      const enhancedBase64 = result.data.enhancedImage;

      // Create new blob from enhanced base64
      const byteCharacters = atob(enhancedBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const enhancedPreview = URL.createObjectURL(blob);
      const originalFile = image.file;
      const fileName = originalFile ? `enhanced-${originalFile.name}` : `enhanced-${imageId}.jpg`;
      const enhancedFile = new File([blob], fileName, { type: 'image/jpeg' });

      this.updateImageData(imageId, {
        file: enhancedFile,
        preview: enhancedPreview,
        isEnhancing: false
      });
    } catch (error) {
      console.error('Enhancement failed:', error);
      this.updateImageData(imageId, { isEnhancing: false });
      this.showError('שגיאה בשיפור התמונה: ' + (error.message || 'שגיאה לא ידועה'));
    }
  }

  updateImageData(imageId, newData) {
    const index = this.images.findIndex((img) => img.id === imageId);
    if (index !== -1) {
      this.images[index] = { ...this.images[index], ...newData };
      this.updatePreviewContainer();
      this.updateSelectedFiles();

      this.dispatchEvent(
        new CustomEvent('images-changed', {
          detail: { images: this.images },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  updateUploadAreaState() {
    const uploadArea = this.shadowRoot.querySelector('.upload-zone');
    uploadArea.setAttribute('data-disabled', this.images.length >= this.maxImages);
  }

  updateUploadAreaVisibility() {
    const uploadArea = this.shadowRoot?.querySelector('.upload-zone');
    if (!uploadArea) return;

    const shouldHide = this.hasAttribute('hide-upload');

    if (shouldHide) {
      uploadArea.style.display = 'none';
      uploadArea.setAttribute('data-disabled', 'true');
    } else {
      uploadArea.style.display = '';
      uploadArea.setAttribute('data-disabled', this.images.length >= this.maxImages);
    }
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
    const imageData = this.images.find((img) => img.id === imageId);
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
   * Get all removed images (for deletion)
   * @returns {Array} Array of removed image data objects
   */
  getRemovedImages() {
    return [...this.removedImages];
  }

  /**
   * Clear all images
   */
  clearImages() {
    this.images = [];
    this.removedImages = [];
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

  setDisabled(isDisabled) {
    const uploadArea = this.shadowRoot.querySelector('.upload-zone');
    uploadArea.setAttribute('data-disabled', isDisabled.toString());

    const controlButtons = this.shadowRoot.querySelectorAll('.image-preview .control-button');
    controlButtons.forEach((button) => {
      button.disabled = isDisabled;
    });

    // Additionally, disable the file input itself to prevent programmatic clicking if any
    const fileInput = this.shadowRoot.querySelector('.file-input');
    if (fileInput) {
      fileInput.disabled = isDisabled;
    }

    // Prevent drag-and-drop on previews when disabled
    const previews = this.shadowRoot.querySelectorAll('.image-preview');
    previews.forEach((preview) => {
      preview.draggable = !isDisabled;
    });
    // The main upload area click is already handled by checking data-disabled.
    // Drag-over on upload area also checks data-disabled.
  }
}

customElements.define('image-handler', ImageHandler);
