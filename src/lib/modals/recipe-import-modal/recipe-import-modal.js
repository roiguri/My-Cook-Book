import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from '../../../js/services/firebase-service.js';
import styles from './recipe-import-modal.css?inline';
import Cropper from 'cropperjs';

class RecipeImportModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.images = []; // Array of { file, preview, cropped }
    this.activeCropIndex = -1;
    this.cropper = null;
    this.isLoading = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    if (this.cropper) {
      this.cropper.destroy();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${styles}
        /* Import cropper styles manually as we are in shadow dom */
        :host {
          --primary-color: #4a90e2;
        }
      </style>
      <div class="recipe-import-modal" id="modal">
        <div class="recipe-import-modal__content">
          <div class="recipe-import-modal__header">
            <h3 class="recipe-import-modal__title">ייבוא מתכון מתמונה</h3>
            <button class="recipe-import-modal__close" id="close-btn">&times;</button>
          </div>

          <div class="recipe-import-modal__body" id="modal-body">
            ${this.isLoading ? this.renderLoading() : this.renderContent()}
          </div>

          <div class="recipe-import-modal__footer" id="modal-footer">
            ${
              !this.isLoading && this.activeCropIndex === -1
                ? `
              <button class="recipe-import-modal__btn recipe-import-modal__btn--secondary" id="cancel-btn">ביטול</button>
              <button class="recipe-import-modal__btn recipe-import-modal__btn--primary" id="process-btn" ${this.images.length === 0 ? 'disabled' : ''}>חלץ מתכון</button>
            `
                : ''
            }

            ${
              !this.isLoading && this.activeCropIndex !== -1
                ? `
              <button class="recipe-import-modal__btn recipe-import-modal__btn--secondary" id="rotate-left-btn" title="סובב שמאלה">
                 &#8634;
              </button>
              <button class="recipe-import-modal__btn recipe-import-modal__btn--secondary" id="rotate-right-btn" title="סובב ימינה">
                 &#8635;
              </button>
              <button class="recipe-import-modal__btn recipe-import-modal__btn--secondary" id="cancel-crop-btn">ביטול חיתוך</button>
              <button class="recipe-import-modal__btn recipe-import-modal__btn--primary" id="save-crop-btn">שמור חיתוך</button>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;

    // Re-inject external css for cropper if needed or rely on import
    // Since we can't easily import css into shadow dom from node_modules without build tool support for it as string
    // We assume the global styles might not reach here.
    // However, cropperjs mostly uses inline styles and structure. The css file is mainly for container size.
    // We added basic styles.

    const style = document.createElement('style');
    style.textContent = `
      .cropper-container {
        direction: ltr;
        font-size: 0;
        line-height: 0;
        position: relative;
        -ms-touch-action: none;
        touch-action: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      .cropper-container img {
        display: block;
        height: 100%;
        image-orientation: 0deg;
        max-height: none !important;
        max-width: none !important;
        min-height: 0 !important;
        min-width: 0 !important;
        width: 100%;
      }
      /* Add more minimal cropper css if needed */
    `;
    this.shadowRoot.appendChild(style);
  }

  renderContent() {
    if (this.activeCropIndex !== -1) {
      return `
        <div class="recipe-import-modal__crop-container">
          <img id="crop-image" src="${this.images[this.activeCropIndex].preview}" style="max-width: 100%;">
        </div>
      `;
    }

    return `
      <div class="recipe-import-modal__upload-area" id="drop-zone">
        <p>גרור תמונות לכאן או לחץ לבחירה</p>
        <p style="font-size: 0.8em; color: #666;">ניתן להעלות מספר תמונות</p>
        <input type="file" class="recipe-import-modal__file-input" id="file-input" multiple accept="image/*">
      </div>

      <div class="recipe-import-modal__images-grid" id="images-grid">
        ${this.images
          .map(
            (img, index) => `
          <div class="recipe-import-modal__image-preview" data-index="${index}">
            <img src="${img.cropped || img.preview}" alt="Preview">
            <button class="recipe-import-modal__remove-image" data-index="${index}">&times;</button>
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }

  renderLoading() {
    return `
      <div class="recipe-import-modal__loading">
        <div class="recipe-import-modal__spinner"></div>
        <p>מפענח מתכון... זה עשוי לקחת כדקה</p>
      </div>
    `;
  }

  setupEventListeners() {
    const modal = this.shadowRoot.getElementById('modal');
    const closeBtn = this.shadowRoot.getElementById('close-btn');
    const cancelBtn = this.shadowRoot.getElementById('cancel-btn');
    const processBtn = this.shadowRoot.getElementById('process-btn');
    const fileInput = this.shadowRoot.getElementById('file-input');
    const dropZone = this.shadowRoot.getElementById('drop-zone');

    // Close events
    const closeHandler = () => this.close();
    if (closeBtn) closeBtn.addEventListener('click', closeHandler);
    if (cancelBtn) cancelBtn.addEventListener('click', closeHandler);

    // Upload events
    if (dropZone) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('recipe-import-modal__upload-area--drag-over');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('recipe-import-modal__upload-area--drag-over');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('recipe-import-modal__upload-area--drag-over');
        this.handleFiles(e.dataTransfer.files);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFiles(e.target.files);
      });
    }

    // Process event
    if (processBtn) {
      processBtn.addEventListener('click', () => this.processImages());
    }

    // Image grid events (remove / crop)
    const grid = this.shadowRoot.getElementById('images-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.recipe-import-modal__remove-image');
        if (removeBtn) {
          e.stopPropagation();
          const index = parseInt(removeBtn.dataset.index);
          this.removeImage(index);
          return;
        }

        const preview = e.target.closest('.recipe-import-modal__image-preview');
        if (preview) {
          const index = parseInt(preview.dataset.index);
          this.startCropping(index);
        }
      });
    }

    // Crop events
    const saveCropBtn = this.shadowRoot.getElementById('save-crop-btn');
    const cancelCropBtn = this.shadowRoot.getElementById('cancel-crop-btn');
    const rotateLeftBtn = this.shadowRoot.getElementById('rotate-left-btn');
    const rotateRightBtn = this.shadowRoot.getElementById('rotate-right-btn');

    if (saveCropBtn) {
      saveCropBtn.addEventListener('click', () => this.saveCrop());
    }
    if (cancelCropBtn) {
      cancelCropBtn.addEventListener('click', () => this.cancelCrop());
    }
    if (rotateLeftBtn) {
      rotateLeftBtn.addEventListener('click', () => this.rotate(-90));
    }
    if (rotateRightBtn) {
      rotateRightBtn.addEventListener('click', () => this.rotate(90));
    }

    // Initialize cropper if active
    if (this.activeCropIndex !== -1) {
      const img = this.shadowRoot.getElementById('crop-image');
      if (img) {
        this.cropper = new Cropper(img, {
          viewMode: 1,
          autoCropArea: 1,
        });
      }
    }
  }

  handleFiles(fileList) {
    const files = Array.from(fileList);
    const newImages = [];

    let processed = 0;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({
          file: file,
          preview: e.target.result,
          cropped: null,
        });
        processed++;

        if (processed === files.length) {
          this.images = [...this.images, ...newImages];
          this.refresh();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index) {
    this.images.splice(index, 1);
    this.refresh();
  }

  startCropping(index) {
    this.activeCropIndex = index;
    this.refresh();
  }

  rotate(degree) {
    if (this.cropper) {
      this.cropper.rotate(degree);
    }
  }

  cancelCrop() {
    this.activeCropIndex = -1;
    this.cropper = null;
    this.refresh();
  }

  saveCrop() {
    if (this.cropper) {
      const canvas = this.cropper.getCroppedCanvas();
      this.images[this.activeCropIndex].cropped = canvas.toDataURL('image/jpeg', 0.9);
      this.activeCropIndex = -1;
      this.cropper = null;
      this.refresh();
    }
  }

  async processImages() {
    if (this.images.length === 0) return;

    this.isLoading = true;
    this.refresh();

    try {
      const imagesToProcess = this.images.map((img) => img.cropped || img.preview);

      const functions = getFunctions(getFirebaseApp());
      const extractRecipe = httpsCallable(functions, 'extractRecipeFromImage');

      const result = await extractRecipe({ images: imagesToProcess });

      this.dispatchEvent(
        new CustomEvent('recipe-extracted', {
          detail: { recipeData: result.data },
          bubbles: true,
          composed: true,
        }),
      );

      this.close();
    } catch (error) {
      console.error('Error processing recipe:', error);
      alert('שגיאה בפענוח המתכון: ' + error.message);
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  refresh() {
    // Re-render
    const modal = this.shadowRoot.getElementById('modal');
    // Save scroll position or other state if needed?
    this.render(); // This is a bit heavy, destroying dom
    this.setupEventListeners();
    modal.classList.add('recipe-import-modal--open');
  }

  open() {
    this.images = [];
    this.activeCropIndex = -1;
    this.isLoading = false;
    this.refresh();
    const modal = this.shadowRoot.getElementById('modal');
    modal.classList.add('recipe-import-modal--open');
  }

  close() {
    const modal = this.shadowRoot.getElementById('modal');
    if (modal) {
      modal.classList.remove('recipe-import-modal--open');
    }
  }
}

customElements.define('recipe-import-modal', RecipeImportModal);
