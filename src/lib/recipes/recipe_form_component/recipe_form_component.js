import { getFirestoreInstance } from '../../../js/services/firebase-service.js';
import { doc, getDoc } from 'firebase/firestore';
import { getAuthInstance } from '../../../js/services/firebase-service.js';
import { isApproved, isManager } from '../../../js/services/auth-service.js';
import { getImageUrl } from '../../../js/utils/recipes/recipe-image-utils.js';
import { showErrorModal, logError } from '../../../js/utils/error-handler.js';
import { validateRecipeForm } from '../../../js/utils/form/form-validation-utils.js';
import { collectRecipeFormData } from '../../../js/utils/form/form-data-collector.js';
import { clearForm, setFormDisabledState } from '../../../js/utils/form/form-state-manager.js';
import { formProtectionManager } from '../../../js/utils/form/form-protection-manager.js';

import '../../images/image-handler.js';
import '../../modals/message-modal/message-modal.js';
import '../../modals/confirmation_modal/confirmation_modal.js';
import '../../modals/recipe-import-modal/recipe-import-modal.js';
import './parts/recipe-metadata-fields.js';
import './parts/form-button-group.js';
import './parts/recipe-ingredients-list.js';
import './parts/recipe-instructions-list.js';
import '../media-instructions-editor/media-instructions-editor.js';

import styles from './recipe_form_component.css?inline';

class RecipeFormComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.recipeData = {}; // To store recipe data
    this.isProtectionEnabled = false;
    this.isDirty = false;

    this.clearButtonText = this.hasAttribute('clear-button-text')
      ? this.getAttribute('clear-button-text')
      : 'נקה';
    this.submitButtonText = this.hasAttribute('submit-button-text')
      ? this.getAttribute('submit-button-text')
      : 'שלח מתכון';
    this.formProtectionDisabled = this.hasAttribute('disable-form-protection');
  }

  async connectedCallback() {
    this.render();
    this.setupEventListeners();

    if (!this.formProtectionDisabled) {
      this.setupFormProtection();
    }

    const recipeId = this.getAttribute('recipe-id');
    if (recipeId) {
      await this.setRecipeData(recipeId);
    } else {
      // Enable protection for new forms after initial render (only if not disabled)
      if (!this.formProtectionDisabled) {
        setTimeout(() => {
          this.collectFormData();
          this.enableFormProtection(this.recipeData);
        }, 500);
      }
    }
  }

  disconnectedCallback() {
    this.cleanupFormProtection();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${this.template()}
    `;
  }

  template() {
    return `
      <div dir="rtl" class="recipe-form">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 class="recipe-form__title" style="margin: 0;">פרטי המתכון</h2>
          <button id="import-btn" class="recipe-form__btn-secondary" style="display: none; padding: 6px 12px; font-size: 0.9em;">
            <span style="margin-left: 6px;">📷</span> ייבוא מתמונה
          </button>
        </div>
        
        <div class="recipe-form__error-message" style="display: none;">
          נא למלא את כל שדות החובה
        </div>
  
        <form id="recipe-form" class="recipe-form__form">
          <recipe-metadata-fields id="metadata-fields"></recipe-metadata-fields>
  
          <div class="recipe-form__group">
            <recipe-ingredients-list id="ingredients-list"></recipe-ingredients-list>
          </div>
  
          <div class="recipe-form__group">
            <recipe-instructions-list id="instructions-list" mode="flat"></recipe-instructions-list>
          </div>
  
          <div class="recipe-form__group">
            <label class="recipe-form__label">תמונות המתכון:</label>
            <image-handler id="recipe-images"></image-handler>
          </div>

          <div class="recipe-form__group">
            <label class="recipe-form__label">טיפים מצולמים:</label>
            <p class="recipe-form__help-text">הוסף תמונות או סרטונים המדגימים את שלבי ההכנה</p>
            <media-instructions-editor
              id="media-instructions-editor"
              media-data='[]'
              recipe-id="">
            </media-instructions-editor>
          </div>

          <div class="recipe-form__group">
            <label for="comments" class="recipe-form__label">הערות:</label>
            <textarea id="comments" name="comments" class="recipe-form__textarea"></textarea>
          </div>
  
          <form-button-group 
            id="form-buttons" 
            clear-text="${this.clearButtonText}" 
            submit-text="${this.submitButtonText}">
          </form-button-group>
        </form>
      </div>
      <message-modal></message-modal>
      <recipe-import-modal></recipe-import-modal>
    `;
  }

  setupEventListeners() {
    // Add event listener for Import button
    const importBtn = this.shadowRoot.getElementById('import-btn');
    const importModal = this.shadowRoot.querySelector('recipe-import-modal');

    // Check permissions and show button
    const auth = getAuthInstance();
    if (auth && auth.currentUser) {
      auth.currentUser.getIdTokenResult().then((idTokenResult) => {
        if (idTokenResult.claims.approved || idTokenResult.claims.manager) {
          if (importBtn) importBtn.style.display = 'flex';
        }
      });
    }

    if (importBtn && importModal) {
      importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importModal.open();
      });
    }

    if (importModal) {
      importModal.addEventListener('recipe-extracted', (e) => {
        this.populateForm(e.detail.recipeData);
      });
    }

    // Add event listener for Instructions List component
    const instructionsList = this.shadowRoot.getElementById('instructions-list');
    instructionsList.addEventListener('instructions-changed', () => {
      // No validation on every change - only on submit like before
    });

    // Add event listener to show image preview
    const imageHandler = this.shadowRoot.getElementById('recipe-images');

    imageHandler.addEventListener('primary-image-changed', (e) => {
      // Update internal state when primary image changes
      this.recipeData.primaryImageId = e.detail.imageId;
    });

    // Add event listener for media instructions editor
    const mediaEditor = this.shadowRoot.getElementById('media-instructions-editor');
    if (mediaEditor) {
      mediaEditor.addEventListener('media-changed', (e) => {
        this.recipeData.mediaInstructions = e.detail.mediaInstructions;
      });
    }

    // Add event listeners for form button group events
    const buttonGroup = this.shadowRoot.getElementById('form-buttons');
    buttonGroup.addEventListener('clear-clicked', () => {
      this.handleClearForm();
    });
    buttonGroup.addEventListener('submit-clicked', () => {
      this.handleFormSubmit();
    });

    // Add input listener for comments textarea to clear errors on change
    const commentsTextarea = this.shadowRoot.getElementById('comments');
    if (commentsTextarea) {
      commentsTextarea.addEventListener('input', () => {
        commentsTextarea.classList.remove('recipe-form__input--invalid');
      });
    }
  }

  /**
   * Validate form using form validation utilities
   */
  validateForm() {
    this.collectFormData();
    return validateRecipeForm(this.recipeData, this.shadowRoot);
  }

  collectFormData() {
    this.recipeData = collectRecipeFormData(this.shadowRoot);
  }

  dispatchRecipeData() {
    const recipeDataEvent = new CustomEvent('recipe-data-collected', {
      detail: { recipeData: this.recipeData },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(recipeDataEvent);
  }

  handleFormSubmit() {
    if (this.validateForm()) {
      this.collectFormData();

      if (this.isProtectionEnabled) {
        formProtectionManager.temporaryDisable();
      }

      this.dispatchRecipeData();

      if (this.isProtectionEnabled) {
        formProtectionManager.markAsSaved();
        formProtectionManager.enable();
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async handleClearForm() {
    if (this.isDirty) {
      const shouldClear = await this.confirmClearForm();
      if (!shouldClear) {
        return;
      }
    }

    this.clearForm();

    if (this.isProtectionEnabled) {
      formProtectionManager.cleanup();
      this.isProtectionEnabled = false;

      // Wait for form clear to complete, then collect the empty state
      setTimeout(() => {
        this.collectFormData(); // Collect the now-empty form data
        this.enableFormProtection(this.recipeData);
        this.isDirty = false; // Ensure internal dirty state is reset
        this.updateDirtyStateIndicators(false); // Update UI indicators
      }, 200);
    }

    // Dispatch the clear button click event
    this.dispatchEvent(
      new CustomEvent('clear-button-clicked', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Shows confirmation dialog for clearing dirty form
   * @returns {Promise<boolean>} True if user confirms clear action
   */
  confirmClearForm() {
    return new Promise((resolve) => {
      // Create a simple confirmation modal
      const modal = document.createElement('confirmation-modal');
      document.body.appendChild(modal);

      // Set up event listeners
      const handleApproved = () => {
        document.body.removeChild(modal);
        resolve(true);
        modal.removeEventListener('confirm-approved', handleApproved);
        modal.removeEventListener('confirm-rejected', handleRejected);
      };

      const handleRejected = () => {
        document.body.removeChild(modal);
        resolve(false);
        modal.removeEventListener('confirm-approved', handleApproved);
        modal.removeEventListener('confirm-rejected', handleRejected);
      };

      modal.addEventListener('confirm-approved', handleApproved);
      modal.addEventListener('confirm-rejected', handleRejected);

      modal.confirm(
        'יש לך שינויים שלא נשמרו שיאבדו. האם אתה בטוח שברצונך לנקות את הטופס?',
        'נקה טופס',
        'נקה טופס',
        'שמור שינויים',
      );
    });
  }

  clearForm() {
    clearForm(this.shadowRoot);

    if (this.isProtectionEnabled) {
      this.collectFormData();
      formProtectionManager.initialize(this.shadowRoot, this.recipeData);
    }
  }

  populateForm(data) {
    this.recipeData = { ...this.recipeData, ...data };

    const metadataFields = this.shadowRoot.getElementById('metadata-fields');
    if (metadataFields) {
      metadataFields.populateFields(data);
    }

    const commentsField = this.shadowRoot.getElementById('comments');
    if (commentsField && data.comments) {
      commentsField.value = Array.isArray(data.comments) ? data.comments.join('\n') : data.comments;
    }

    const ingredientsList = this.shadowRoot.getElementById('ingredients-list');
    if (ingredientsList) {
      // Clear existing
      if (data.ingredients) {
        ingredientsList.populateData(data.ingredients);
      } else if (data.ingredientSections) {
        ingredientsList.populateData({ sections: data.ingredientSections });
      }
    }

    const instructionsList = this.shadowRoot.getElementById('instructions-list');
    if (instructionsList) {
      // Clear existing
      if (data.stages && data.stages.length > 0) {
        instructionsList.populateInstructions({ stages: data.stages });
      } else if (data.instructions && data.instructions.length > 0) {
        instructionsList.populateInstructions(data.instructions);
      }
    }

    // Trigger dirty state
    this.isDirty = true;
    this.updateDirtyStateIndicators(true);

    // Show success message
    const messageModal = this.shadowRoot.querySelector('message-modal');
    if (messageModal) {
      messageModal.show('המתכון חולץ בהצלחה! נא לעבור על הפרטים ולתקן במידת הצורך.', 'success');
    }
  }

  async setRecipeData(recipeId) {
    try {
      const db = getFirestoreInstance();
      const docSnap = await getDoc(doc(db, 'recipes', recipeId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.recipeData = data;
        this.populateForm(data);
        this.isDirty = false; // Reset dirty after loading existing
        this.updateDirtyStateIndicators(false);

        if (data.images) {
          await this.populateImages(data.images);
        }

        // Populate media instructions if present
        const mediaEditor = this.shadowRoot.getElementById('media-instructions-editor');
        if (mediaEditor && data.mediaInstructions) {
          mediaEditor.setAttribute('media-data', JSON.stringify(data.mediaInstructions));
          mediaEditor.setAttribute('recipe-id', recipeId);
        } else if (mediaEditor) {
          // Set recipe ID even if no media yet (for new uploads)
          mediaEditor.setAttribute('recipe-id', recipeId);
        }

        // Enable protection only if not disabled
        if (!this.formProtectionDisabled) {
          setTimeout(() => this.enableFormProtection(this.recipeData), 500);
        }
      } else {
        console.warn('No such document!');
        if (!this.formProtectionDisabled) {
          setTimeout(() => {
            this.collectFormData();
            this.enableFormProtection(this.recipeData);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      if (!this.formProtectionDisabled) {
        setTimeout(() => {
          this.collectFormData();
          this.enableFormProtection(this.recipeData);
        }, 500);
      }
    }
  }

  // FIXME: create file object before re-uploading images
  async populateImages(images) {
    const imageHandler = this.shadowRoot.getElementById('recipe-images');

    for (const image of images) {
      try {
        // Use getImageUrl from recipe-image-utils for preview
        const previewUrl = image.compressed
          ? await getImageUrl(image.compressed)
          : image.full
            ? await getImageUrl(image.full)
            : null;
        if (previewUrl) {
          imageHandler.addImage({
            file: null, // No file object, just preview
            preview: previewUrl,
            id: image.id,
            isPrimary: image.isPrimary,
            full: image.full,
            compressed: image.compressed,
            access: image.access,
            uploadedBy: image.uploadedBy,
            fileName: image.fileName,
            uploadTimestamp: image.uploadTimestamp,
            source: 'existing',
          });
        }
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
  }

  /**
   * Sets up form protection event listeners
   */
  setupFormProtection() {
    // Listen for form protection events
    this.addEventListener('form-dirty-state-changed', this.handleDirtyStateChange.bind(this));

    // Add change detection to form fields
    this.setupChangeDetection();
  }

  /**
   * Sets up change detection for form fields
   */
  setupChangeDetection() {
    // Use a debounced function to check dirty state
    let checkDirtyStateTimeout;

    const debouncedDirtyCheck = () => {
      clearTimeout(checkDirtyStateTimeout);
      checkDirtyStateTimeout = setTimeout(() => {
        if (this.isProtectionEnabled) {
          formProtectionManager.checkDirtyState();
        }
      }, 300);
    };

    // Listen to various change events including keyup for delete detection
    const eventTypes = ['input', 'change', 'paste', 'keyup'];
    eventTypes.forEach((eventType) => {
      this.shadowRoot.addEventListener(eventType, debouncedDirtyCheck);
    });

    // Listen to component-specific events
    this.addEventListener('ingredients-changed', debouncedDirtyCheck);
    this.addEventListener('instructions-changed', debouncedDirtyCheck);
    this.addEventListener('images-changed', debouncedDirtyCheck);
    this.addEventListener('media-changed', debouncedDirtyCheck);

    // Also listen for cut events (when users delete content with Ctrl+X)
    this.shadowRoot.addEventListener('cut', debouncedDirtyCheck);
  }

  /**
   * Enables form protection
   * @param {Object} initialData - Initial form data (optional)
   */
  enableFormProtection(initialData = null) {
    if (this.formProtectionDisabled || this.isProtectionEnabled) return;

    const dataToUse = initialData || this.recipeData;
    formProtectionManager.initialize(this.shadowRoot, dataToUse);
    this.isProtectionEnabled = true;
  }

  /**
   * Disables form protection temporarily
   */
  disableFormProtection() {
    if (!this.isProtectionEnabled) return;

    formProtectionManager.temporaryDisable();
    this.isProtectionEnabled = false;
  }

  /**
   * Cleans up form protection
   */
  cleanupFormProtection() {
    if (this.isProtectionEnabled) {
      formProtectionManager.cleanup();
      this.isProtectionEnabled = false;
    }
  }

  /**
   * Handles dirty state changes
   * @param {CustomEvent} event - Dirty state change event
   */
  handleDirtyStateChange(event) {
    this.isDirty = event.detail.isDirty;

    // Update visual indicators
    this.updateDirtyStateIndicators(this.isDirty);

    // Dispatch event for parent components
    this.dispatchEvent(
      new CustomEvent('form-dirty-changed', {
        detail: { isDirty: this.isDirty },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Updates visual indicators for dirty state
   * @param {boolean} isDirty - Whether form is dirty
   */
  updateDirtyStateIndicators(isDirty) {
    // Add/remove dirty class to form
    const form = this.shadowRoot.getElementById('recipe-form');
    if (form) {
      if (isDirty) {
        form.classList.add('form-dirty');
      } else {
        form.classList.remove('form-dirty');
      }
    }

    // Update title to show unsaved changes indicator
    const title = this.shadowRoot.querySelector('.recipe-form__title');
    if (title) {
      if (isDirty) {
        title.classList.add('unsaved-changes');
      } else {
        title.classList.remove('unsaved-changes');
      }
    }
  }

  showErrorMessage(error) {
    const messageModal = this.shadowRoot.querySelector('message-modal');
    logError(error, 'Recipe form');
    showErrorModal(messageModal, error);
  }

  setDisabled(isDisabled) {
    setFormDisabledState(this.shadowRoot, isDisabled);
  }

  /**
   * Public API: Upload pending media instructions
   * Delegates to the media-instructions-editor component without exposing internal structure
   * @param {string} recipeId - Recipe ID for storage path
   * @param {string} userId - User ID for metadata
   * @returns {Promise<Array>} Array of uploaded media metadata objects
   */
  async uploadPendingMediaInstructions(recipeId, userId) {
    const mediaEditor = this.shadowRoot.getElementById('media-instructions-editor');
    if (!mediaEditor || typeof mediaEditor.uploadPendingFiles !== 'function') {
      return [];
    }
    return await mediaEditor.uploadPendingFiles(recipeId, userId);
  }

  /**
   * Public API: Get all media in order (both uploaded and pending)
   * Delegates to the media-instructions-editor component without exposing internal structure
   * @returns {Array} Array of media items with position tracking
   */
  getAllMediaInOrder() {
    const mediaEditor = this.shadowRoot.getElementById('media-instructions-editor');
    if (!mediaEditor || typeof mediaEditor.getAllMediaInOrder !== 'function') {
      return [];
    }
    return mediaEditor.getAllMediaInOrder();
  }
}

customElements.define('recipe-form-component', RecipeFormComponent);
