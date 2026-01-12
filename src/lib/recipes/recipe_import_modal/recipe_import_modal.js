import { getFunctions, httpsCallable } from 'firebase/functions';
import Cropper from 'cropperjs';
import styles from './recipe_import_modal.css?inline';
import cropperStyles from 'cropperjs/dist/cropper.css?inline';
import memoryGameStyles from '../../games/memory_game.css?inline';
import gameWrapperStyles from '../../games/game_wrapper.css?inline';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { CookingMemoryGame } from '../../games/memory_game.js';
import { GameWrapper } from '../../games/game_wrapper.js';

class RecipeImportModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cropper = null;
    this.images = []; // Array of { id, file, imageUrl, processedBase64 }
    this.activeImageId = null;
    this.isLoading = false;
    this.gameWrapper = null;
    this.game = null;
    this.extractedData = null;
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
        ${memoryGameStyles}
        ${gameWrapperStyles}
      </style>
      <custom-modal id="import-modal" width="600px">
          <div class="modal-body-content">
            <h2 class="modal-title">ייבא מתכון מתמונה</h2>
            
            <!-- Initial State: Upload -->
            <div id="upload-view" class="upload-area">
              <div class="upload-icon">📷</div>
              <p class="upload-text">לחץ להעלאת תמונות או גרור לכאן</p>
              <input type="file" id="file-input" accept="image/*" multiple style="display: none;">
            </div>

            <!-- Preview State: List & Reorder -->
            <div id="preview-view" style="display: none; width: 100%;">
              <div class="images-list" id="images-list"></div>
              <div class="add-more-area" id="add-more-btn">
                <span>+ הוסף תמונה נוספת</span>
              </div>
            </div>

            <!-- Editor State: Crop & Rotate -->
            <div id="editor-view" style="display: none; width: 100%;">
              <div class="editor-container">
                 <img id="image-preview" style="max-width: 100%; display: block;">
              </div>
              <div class="toolbar">
                <button class="tool-btn" id="rotate-left" title="סובב שמאלה">↶</button>
                <button class="tool-btn" id="rotate-right" title="סובב ימינה">↷</button>
                <button class="tool-btn" id="cancel-crop" title="ביטול">✕</button>
                <button class="tool-btn" id="save-crop" title="שמור חיתוך">✓</button>
              </div>
            </div>

            <!-- Loading State -->
            <div id="loading-view" class="loading-container" style="display: none;">
              <div class="loading-status-row" id="loading-status">
                 <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                 </div>
                 <p id="loading-text" style="margin: 0;">מנתח את המתכון... זה עשוי לקחת מספר שניות</p>
              </div>
              
              <div id="success-overlay" class="success-overlay" style="display: none;">
                  <div class="success-badge">המתכון מוכן!</div>
                  <button class="btn btn-primary" id="view-recipe-btn">צפה במתכון</button>
              </div>
              <div id="game-container" style="width: 100%; margin-top: 10px;"></div>
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
    const addMoreBtn = this.shadowRoot.getElementById('add-more-btn');

    // Tools
    const rotateLeftBtn = this.shadowRoot.getElementById('rotate-left');
    const rotateRightBtn = this.shadowRoot.getElementById('rotate-right');
    const saveCropBtn = this.shadowRoot.getElementById('save-crop');
    const cancelCropBtn = this.shadowRoot.getElementById('cancel-crop');

    // Error handling
    const tryAgainBtn = this.shadowRoot.getElementById('try-again-btn');

    // Close Actions
    const close = () => modal.close({ byUser: true });
    cancelBtn.addEventListener('click', close);

    // Listen to modal close event to reset state
    modal.addEventListener('modal-closed', () => {
      // If we have extracted data when closing (e.g. user closed without clicking 'View Recipe'),
      // still emit the event so the parent form can use the data.
      if (this.extractedData) {
        this.dispatchEvent(
          new CustomEvent('recipe-extracted', {
            detail: { data: this.extractedData },
            bubbles: true,
            composed: true,
          }),
        );
      }
      this.resetToUpload();
    });

    // Upload Actions
    uploadArea.addEventListener('click', () => fileInput.click());
    addMoreBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.addImages(e.target.files);
      }
      fileInput.value = ''; // Reset input
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
        this.addImages(e.dataTransfer.files);
      }
    });

    // Editor Actions
    rotateLeftBtn.addEventListener('click', () => this.cropper?.rotate(-90));
    rotateRightBtn.addEventListener('click', () => this.cropper?.rotate(90));
    saveCropBtn.addEventListener('click', () => this.saveCrop());
    cancelCropBtn.addEventListener('click', () => this.closeEditor());

    // Extract
    extractBtn.addEventListener('click', () => this.extractRecipe());

    // View Recipe (Success State)
    const viewRecipeBtn = this.shadowRoot.getElementById('view-recipe-btn');
    viewRecipeBtn.addEventListener('click', () => this.finishImport());

    // Try Again
    tryAgainBtn.addEventListener('click', () => this.resetToUpload());
  }

  addImages(files) {
    const currentCount = this.images.length;
    const newCount = files.length;

    if (currentCount + newCount > 5) {
      alert('ניתן להעלות עד 5 תמונות בלבד');
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.images.push({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          file: file,
          imageUrl: e.target.result,
          processedBase64: null, // Will be populated on demand or on save
        });
        this.updatePreviewList();
      };
      reader.readAsDataURL(file);
    });
  }

  updatePreviewList() {
    const uploadView = this.shadowRoot.getElementById('upload-view');
    const previewView = this.shadowRoot.getElementById('preview-view');
    const extractBtn = this.shadowRoot.getElementById('extract-btn');
    const imagesList = this.shadowRoot.getElementById('images-list');

    if (this.images.length === 0) {
      uploadView.style.display = 'block';
      previewView.style.display = 'none';
      extractBtn.disabled = true;
      return;
    }

    uploadView.style.display = 'none';
    previewView.style.display = 'block';
    extractBtn.disabled = false;

    imagesList.innerHTML = '';
    this.images.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'image-item';
      item.innerHTML = `
        <div class="image-thumb-container">
          <img src="${img.imageUrl}" class="image-thumb">
        </div>
        <div class="image-controls">
          <button class="control-btn move-up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="control-btn move-down" ${index === this.images.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="control-btn edit-btn">✏️</button>
          <button class="control-btn delete-btn">🗑️</button>
        </div>
        <div class="image-number">${index + 1}</div>
      `;

      item.querySelector('.move-up').onclick = () => this.moveImage(index, -1);
      item.querySelector('.move-down').onclick = () => this.moveImage(index, 1);
      item.querySelector('.edit-btn').onclick = () => this.openEditor(img.id);
      item.querySelector('.delete-btn').onclick = () => this.deleteImage(index);

      imagesList.appendChild(item);
    });
  }

  moveImage(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < this.images.length) {
      const temp = this.images[index];
      this.images[index] = this.images[newIndex];
      this.images[newIndex] = temp;
      this.updatePreviewList();
    }
  }

  deleteImage(index) {
    this.images.splice(index, 1);
    this.updatePreviewList();
  }

  openEditor(imageId) {
    const img = this.images.find((i) => i.id === imageId);
    if (!img) return;

    this.activeImageId = imageId;
    const previewView = this.shadowRoot.getElementById('preview-view');
    const editorView = this.shadowRoot.getElementById('editor-view');
    const imagePreview = this.shadowRoot.getElementById('image-preview');

    previewView.style.display = 'none';
    editorView.style.display = 'block';

    // Use processed image if exists, otherwise original
    const src = img.processedBase64
      ? `data:image/jpeg;base64,${img.processedBase64}`
      : img.imageUrl;
    imagePreview.src = src;

    // Hide footer (submit/cancel) when editing
    this.shadowRoot.querySelector('.modal-footer').style.display = 'none';

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
  }

  saveCrop() {
    if (!this.cropper || !this.activeImageId) return;

    const img = this.images.find((i) => i.id === this.activeImageId);
    if (img) {
      const canvas = this.cropper.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024,
      });
      // Store pure base64
      img.processedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      // Update thumbnail (optional, might be heavy if full res, but let's try)
      // Actually finding the thumb by index might be better, but let's just refresh list
    }
    this.closeEditor();
    this.updatePreviewList();
  }

  closeEditor() {
    this.activeImageId = null;
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    const editorView = this.shadowRoot.getElementById('editor-view');
    const previewView = this.shadowRoot.getElementById('preview-view');

    editorView.style.display = 'none';
    previewView.style.display = 'block';

    // Show footer again
    this.shadowRoot.querySelector('.modal-footer').style.display = 'flex';
  }

  resetToUpload() {
    this.images = [];
    this.activeImageId = null;
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }

    const uploadView = this.shadowRoot.getElementById('upload-view');
    if (uploadView) {
      uploadView.style.display = 'block';
      this.shadowRoot.getElementById('preview-view').style.display = 'none'; // reset preview
      this.shadowRoot.getElementById('editor-view').style.display = 'none';
      this.shadowRoot.getElementById('loading-view').style.display = 'none';
      this.shadowRoot.getElementById('error-view').style.display = 'none';
      this.shadowRoot.getElementById('extract-btn').disabled = true;
      this.shadowRoot.getElementById('file-input').value = '';

      // Reset loading state internals
      const loadingStatus = this.shadowRoot.getElementById('loading-status');
      if (loadingStatus) loadingStatus.style.display = 'flex';

      this.shadowRoot.getElementById('loading-text').textContent =
        'זה עשוי לקחת מספר שניות... הנה משחק קטן בינתיים!';
      this.shadowRoot.getElementById('success-overlay').style.display = 'none';
      this.extractedData = null;
    }
  }

  async extractRecipe() {
    if (this.images.length === 0) return;

    this.setLoading(true);

    try {
      const imagesToSend = await Promise.all(
        this.images.map(async (img) => {
          let base64 = img.processedBase64;

          if (!base64) {
            // If not processed (cropped), use original.
            // Since imageUrl is dataURL, split it.
            // Note: imageUrl came from FileReader so it's a data URL.
            base64 = img.imageUrl.split(',')[1];
          }

          return {
            base64: base64,
            mimeType: 'image/jpeg', // Assuming jpeg for simplicity or extracting from header
          };
        }),
      );

      const functions = getFunctions();
      const extractRecipeFromImage = httpsCallable(functions, 'extractRecipeFromImage');

      const result = await extractRecipeFromImage({
        images: imagesToSend,
      });

      // Show success state but keep modal open
      this.showSuccessState(result.data);
    } catch (error) {
      console.error('Extraction failed:', error);
      this.isLoading = false;
      this.setError(error);
    }
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    const loadingView = this.shadowRoot.getElementById('loading-view');
    const editorView = this.shadowRoot.getElementById('editor-view');
    const footer = this.shadowRoot.querySelector('.modal-footer');
    const gameContainer = this.shadowRoot.getElementById('game-container');

    if (isLoading) {
      loadingView.style.display = 'flex';
      // editorView.style.display = 'none'; // Editor is already closed or irrelevant
      this.shadowRoot.getElementById('preview-view').style.display = 'none'; // Hide preview
      footer.style.display = 'none';

      // Start Game Wrapper
      if (!this.gameWrapper && gameContainer) {
        this.gameWrapper = new GameWrapper(gameContainer, CookingMemoryGame, { rows: 2 });
        this.gameWrapper.init();
      }
    } else {
      loadingView.style.display = 'none';
      footer.style.display = 'flex';

      // Stop/Destroy Game
      if (this.gameWrapper) {
        this.gameWrapper.destroy();
        this.gameWrapper = null;
      }
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

    this.shadowRoot.getElementById('loading-view').style.display = 'none'; // Ensure loading is hidden

    errorView.style.display = 'block';
    errorMessage.textContent = 'שגיאה: ' + displayMessage;

    // Hide other views
    this.shadowRoot.getElementById('loading-view').style.display = 'none';
    this.shadowRoot.getElementById('editor-view').style.display = 'none';
    this.shadowRoot.getElementById('preview-view').style.display = 'none';
    this.shadowRoot.getElementById('upload-view').style.display = 'none';
    this.shadowRoot.querySelector('.modal-footer').style.display = 'none';
  }

  open() {
    this.resetToUpload();
    this.shadowRoot.getElementById('import-modal').open();
  }

  showSuccessState(data) {
    this.extractedData = data;

    // Hide loading dots row
    const loadingStatus = this.shadowRoot.getElementById('loading-status');
    const loadingText = this.shadowRoot.getElementById('loading-text');
    const successOverlay = this.shadowRoot.getElementById('success-overlay');

    if (loadingStatus) loadingStatus.style.display = 'none';

    // Optional: could reuse loadingText for success message, but we used overlay instead.
    // We already have "Recipe Ready" in the badge.
    // If we want to show text:
    // loadingText.textContent = 'הניתוח הושלם! אתה יכול להמשיך לשחק או לצפות במתכון.';

    successOverlay.style.display = 'flex';
  }

  finishImport() {
    if (!this.extractedData) return;

    this.setLoading(false); // This will destroy the game
    this.close(); // This triggers 'modal-closed' which will emit the event
  }

  close() {
    this.shadowRoot.getElementById('import-modal').close();
  }
}

customElements.define('recipe-import-modal', RecipeImportModal);
