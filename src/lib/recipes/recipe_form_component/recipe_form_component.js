import { getFirestoreInstance } from '../../../js/services/firebase-service.js';
import { doc, getDoc } from 'firebase/firestore';
import { getImageUrl } from '../../../js/utils/recipes/recipe-image-utils.js';
import { showErrorModal, logError } from '../../../js/utils/error-handler.js';
import { validateRecipeForm } from '../../../js/utils/form/form-validation-utils.js';
import { collectRecipeFormData } from '../../../js/utils/form/form-data-collector.js';
import { clearForm, setFormDisabledState } from '../../../js/utils/form/form-state-manager.js';

import '../../images/image-handler.js';
import '../../modals/message-modal/message-modal.js';
import './parts/recipe-metadata-fields.js';
import './parts/form-button-group.js';
import './parts/recipe-ingredients-list.js';
import './parts/recipe-instructions-list.js';

class RecipeFormComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.recipeData = {}; // To store recipe data

    this.clearButtonText = this.hasAttribute('clear-button-text')
      ? this.getAttribute('clear-button-text')
      : 'נקה';
    this.submitButtonText = this.hasAttribute('submit-button-text')
      ? this.getAttribute('submit-button-text')
      : 'שלח מתכון';
  }

  async connectedCallback() {
    this.render();
    this.setupEventListeners();

    // Check if recipeId is provided as an attribute
    const recipeId = this.getAttribute('recipe-id');
    if (recipeId) {
      await this.setRecipeData(recipeId);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/src/lib/recipes/recipe_form_component/recipe_form_component.css">
      ${this.template()}
    `;
  }


  template() {
    return `
      <div dir="rtl" class="recipe-form">
        <h2 class="recipe-form__title">פרטי המתכון</h2>
        
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
    `;
  }

  setupEventListeners() {

    // Add event listener for Instructions List component
    const instructionsList = this.shadowRoot.getElementById('instructions-list');
    instructionsList.addEventListener('instructions-changed', () => {
      // No validation on every change - only on submit like before
    });

    // Add event listener to show image preview
    const imageHandler = this.shadowRoot.getElementById('recipe-images');

    imageHandler.addEventListener('images-changed', () => {
      // Update validation state when images change
      this.validateForm();
    });

    imageHandler.addEventListener('primary-image-changed', (e) => {
      // Update internal state when primary image changes
      this.recipeData.primaryImageId = e.detail.imageId;
    });

    // Add event listener for form submission
    const form = this.shadowRoot.querySelector('#recipe-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (this.validateForm()) {
        this.collectFormData();
        this.dispatchRecipeData();
      } else {
        // Scroll to top to show validation errors
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // Add event listeners for form button group events
    const buttonGroup = this.shadowRoot.getElementById('form-buttons');
    buttonGroup.addEventListener('clear-clicked', () => {
      this.clearForm();

      // Dispatch the clear button click event
      this.dispatchEvent(
        new CustomEvent('clear-button-clicked', {
          bubbles: true,
          composed: true,
        }),
      );
    });
    buttonGroup.addEventListener('submit-clicked', () => {
      if (this.validateForm()) {
        this.collectFormData();
        this.dispatchRecipeData();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
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
    // Dispatches a custom event with the recipe data
    const recipeDataEvent = new CustomEvent('recipe-data-collected', {
      detail: { recipeData: this.recipeData },
      bubbles: true, // Ensures the event bubbles up through the DOM
      composed: true, // Allows the event to cross shadow DOM boundaries
    });
    this.dispatchEvent(recipeDataEvent);
  }

  clearForm() {
    clearForm(this.shadowRoot);
  }

  async setRecipeData(recipeId) {
    try {
      const db = getFirestoreInstance();
      const docSnap = await getDoc(doc(db, 'recipes', recipeId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.recipeData = data; // Store the fetched data

        // Populate metadata fields through component API
        const metadataFields = this.shadowRoot.getElementById('metadata-fields');
        if (metadataFields) {
          metadataFields.populateFields(data);
        }

        // Populate comments field (still in main component)
        const commentsField = this.shadowRoot.getElementById('comments');
        if (commentsField) {
          commentsField.value = data.comments ? data.comments.join('\n') : '';
        }

        // Populate ingredients through component API
        const ingredientsList = this.shadowRoot.getElementById('ingredients-list');
        if (ingredientsList) {
          // Handle both flat ingredients and sectioned ingredients  
          if (data.ingredients) {
            ingredientsList.populateIngredients(data.ingredients);
          } else if (data.ingredientSections) {
            ingredientsList.populateIngredients({ ingredientSections: data.ingredientSections });
          }
        }

        // Populate instructions through new component API
        const instructionsList = this.shadowRoot.getElementById('instructions-list');
        if (instructionsList) {
          // Component will automatically handle mode switching based on data
          if (data.stages && data.stages.length > 0) {
            instructionsList.populateInstructions({ stages: data.stages });
          } else if (data.instructions && data.instructions.length > 0) {
            instructionsList.populateInstructions(data.instructions);
          }
        }

        // Populate images if they exist
        if (data.images) {
          await this.populateImages(data.images);
        }

      } else {
        console.warn('No such document!');
        // Handle the case where the recipe doesn't exist
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      // Handle the error appropriately (e.g., show an error message)
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

  showErrorMessage(error) {
    const messageModal = this.shadowRoot.querySelector('message-modal');
    logError(error, 'Recipe form');
    showErrorModal(messageModal, error);
  }

  setDisabled(isDisabled) {
    setFormDisabledState(this.shadowRoot, isDisabled);
  }
}

customElements.define('recipe-form-component', RecipeFormComponent);
