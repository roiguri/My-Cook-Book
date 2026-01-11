import { getFunctions, httpsCallable } from 'firebase/functions';
import Cropper from 'cropperjs';
import styles from './recipe_import_modal.css?inline';
import cropperStyles from 'cropperjs/dist/cropper.css?inline';

class RecipeImportModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cropper = null;
    this.currentFile = null;
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
        ${cropperStyles}
        ${styles}
      </style>
      <custom-modal id="import-modal" width="600px">
          <div class="modal-body-content">
            <h2 class="modal-title">ייבא מתכון מתמונה</h2>
            
            <!-- Initial State: Upload -->
            <div id="upload-view" class="upload-area">
              <div class="upload-icon">📷</div>
              <p class="upload-text">לחץ להעלאת תמונה או גרור לכאן</p>
              <input type="file" id="file-input" accept="image/*" style="display: none;">
            </div>

            <!-- Editor State: Crop & Rotate -->
            <div id="editor-view" style="display: none; width: 100%;">
              <div class="editor-container">
                 <img id="image-preview" style="max-width: 100%; display: block;">
              </div>
              <div class="toolbar">
                <button class="tool-btn" id="rotate-left" title="סובב שמאלה">↶</button>
                <button class="tool-btn" id="rotate-right" title="סובב ימינה">↷</button>
                <button class="tool-btn" id="reset-crop" title="אפס חיתוך">↺</button>
              </div>
            </div>

            <!-- Loading State -->
            <div id="loading-view" class="loading-container" style="display: none;">
              <div class="spinner"></div>
              <p>מנתח את המתכון... זה עשוי לקחת מספר שניות</p>
            </div>

            <!-- Error State -->
            <div id="error-view" class="error-container" style="display: none;">
              <p class="error-message" id="error-message">שגיאה בניתוח התמונה</p>
              <button class="btn btn-secondary" id="try-again-btn">נסה שוב</button>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-btn">ביטול</button>
                <button class="btn btn-primary" id="extract-btn" disabled>חלץ מתכון</button>
            </div>
          </div>
      </custom-modal>
    `;
  }

  setupEventListeners() {
    const modal = this.shadowRoot.getElementById('import-modal');
    const cancelBtn = this.shadowRoot.getElementById('cancel-btn');
    const uploadArea = this.shadowRoot.getElementById('upload-view');
    const fileInput = this.shadowRoot.getElementById('file-input');
    const extractBtn = this.shadowRoot.getElementById('extract-btn');

    // Tools
    const rotateLeftBtn = this.shadowRoot.getElementById('rotate-left');
    const rotateRightBtn = this.shadowRoot.getElementById('rotate-right');
    const resetBtn = this.shadowRoot.getElementById('reset-crop');

    // Error handling
    const tryAgainBtn = this.shadowRoot.getElementById('try-again-btn');

    // Close Actions
    const close = () => modal.close({ byUser: true });
    cancelBtn.addEventListener('click', close);

    // Listen to modal close event to reset state
    modal.addEventListener('modal-closed', () => {
      this.resetToUpload();
    });

    // Upload Actions
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary-color)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#ccc';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#ccc';
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    // Editor Actions
    rotateLeftBtn.addEventListener('click', () => this.cropper?.rotate(-90));
    rotateRightBtn.addEventListener('click', () => this.cropper?.rotate(90));
    resetBtn.addEventListener('click', () => this.cropper?.reset());

    // Extract
    extractBtn.addEventListener('click', () => this.extractRecipe());

    // Try Again
    tryAgainBtn.addEventListener('click', () => this.resetToUpload());
  }

  handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      alert('נא לבחור קובץ תמונה');
      return;
    }

    this.currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.initCropper(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  initCropper(imageUrl) {
    const uploadView = this.shadowRoot.getElementById('upload-view');
    const editorView = this.shadowRoot.getElementById('editor-view');
    const imagePreview = this.shadowRoot.getElementById('image-preview');
    const extractBtn = this.shadowRoot.getElementById('extract-btn');

    uploadView.style.display = 'none';
    editorView.style.display = 'block';

    imagePreview.src = imageUrl;

    if (this.cropper) {
      this.cropper.destroy();
    }

    this.cropper = new Cropper(imagePreview, {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });

    extractBtn.disabled = false;
  }

  resetToUpload() {
    this.currentFile = null;
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }

    const uploadView = this.shadowRoot.getElementById('upload-view');
    if (uploadView) {
      uploadView.style.display = 'block';
      this.shadowRoot.getElementById('editor-view').style.display = 'none';
      this.shadowRoot.getElementById('loading-view').style.display = 'none';
      this.shadowRoot.getElementById('error-view').style.display = 'none';
      this.shadowRoot.getElementById('extract-btn').disabled = true;
      this.shadowRoot.getElementById('file-input').value = '';
    }
  }

  async extractRecipe() {
    if (!this.cropper) return;

    this.setLoading(true);

    try {
      // Get cropped canvas
      const canvas = this.cropper.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024,
      });

      // Get base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const functions = getFunctions();
      const extractRecipeFromImage = httpsCallable(functions, 'extractRecipeFromImage');

      const result = await extractRecipeFromImage({
        imageBase64: base64Image,
        mimeType: 'image/jpeg',
      });

      this.setLoading(false); // Stop loading before success actions

      // Emit success event
      this.dispatchEvent(
        new CustomEvent('recipe-extracted', {
          detail: { data: result.data },
          bubbles: true,
          composed: true,
        }),
      );

      this.close();
    } catch (error) {
      console.error('Extraction failed:', error);
      // Ensure loading is off before showing error
      this.isLoading = false;
      this.setError(error);
    }
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    const loadingView = this.shadowRoot.getElementById('loading-view');
    const editorView = this.shadowRoot.getElementById('editor-view');
    const footer = this.shadowRoot.querySelector('.modal-footer');

    if (isLoading) {
      loadingView.style.display = 'flex';
      editorView.style.display = 'none';
      footer.style.display = 'none'; // Hide buttons during load
    } else {
      loadingView.style.display = 'none';
      // Don't show editorView here, implementation of extractRecipe handles close or error show
      footer.style.display = 'flex';
    }
  }

  setError(error) {
    const errorView = this.shadowRoot.getElementById('error-view');
    const errorMessage = this.shadowRoot.getElementById('error-message');

    // Error mapping
    let displayMessage = 'אירעה שגיאה בעיבוד התמונה. אנא נסה שוב.';
    const rawMessage = error.message || '';

    if (rawMessage.includes('permission-denied') || rawMessage.includes('unauthenticated')) {
      displayMessage = 'אין לך הרשאה לבצע פעולה זו. אנא וודא שאתה מחובר כמשתמש מאושר.';
    } else if (rawMessage.includes('invalid-argument')) {
      displayMessage = 'התמונה שנשלחה אינה תקינה. אנא נסה תמונה אחרת.';
    } else if (rawMessage.includes('internal')) {
      displayMessage = 'שגיאה בשרת העיבוד. אנא נסה שוב מאוחר יותר.';
    } else if (rawMessage.includes('quota-exceeded')) {
      displayMessage = 'הגענו למכסת השימוש היומית. אנא נסה שוב מחר.';
    } else if (rawMessage.includes('deadline-exceeded') || rawMessage.includes('timeout')) {
      displayMessage = 'הפעולה לקחה זמן רב מדי. נסה לחתוך את התמונה לאזור הרלוונטי בלבד.';
    } else if (rawMessage.includes('not-found')) {
      displayMessage = 'השירות אינו זמין כעת (404). אנא פנה למנהל המערכת.';
    }

    errorView.style.display = 'block';
    errorMessage.textContent = 'שגיאה: ' + displayMessage;

    // Hide other views
    this.shadowRoot.getElementById('loading-view').style.display = 'none';
    this.shadowRoot.getElementById('editor-view').style.display = 'none';
    this.shadowRoot.getElementById('upload-view').style.display = 'none';
    this.shadowRoot.querySelector('.modal-footer').style.display = 'none'; // Footer hidden in error view (has its own button)
  }

  open() {
    this.resetToUpload();
    this.shadowRoot.getElementById('import-modal').open();
  }

  close() {
    this.shadowRoot.getElementById('import-modal').close();
  }
}

customElements.define('recipe-import-modal', RecipeImportModal);
