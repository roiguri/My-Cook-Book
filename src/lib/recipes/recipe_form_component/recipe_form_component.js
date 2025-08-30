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
            <div id="stages-container" class="recipe-form__stages">
              <label class="recipe-form__label">תהליך הכנה:</label>
              <div id="steps-container" class="recipe-form__steps">
                <fieldset class="recipe-form__step">
                  <input type="text" name="steps" class="recipe-form__input">
                  <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
                </fieldset>
              </div>
              <button type="button" id="add-stage" class="recipe-form__button recipe-form__button--add-stage">הוסף שלב</button>
            </div>
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

    // Add event listener for Instructions
    const stagesContainer = this.shadowRoot.getElementById('stages-container');
    stagesContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('recipe-form__button--add-step')) {
        this.addStepLine(event);
      } else if (event.target.classList.contains('recipe-form__button--remove-step')) {
        this.removeStepLine(event);
      } else if (event.target.id === 'add-stage') {
        this.addStage(event);
      } else if (event.target.classList.contains('recipe-form__button--remove-stage')) {
        this.removeStage(event);
      }
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
   * Add instructions
   */
  addStepLine(event) {
    const stepsContainer = event.target.closest('.recipe-form__steps');
    const clickedButton = event.target;
    const currentStep = clickedButton.closest('.recipe-form__step');

    // Create and add the new step with remove and add buttons
    const newStep = document.createElement('div');
    newStep.classList.add('recipe-form__step');
    newStep.innerHTML = `
      <input type="text" class="recipe-form__input">
      <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
      <button type="button" class="recipe-form__button recipe-form__button--remove-step">-</button> 
    `;

    // Insert the new step after the current one
    stepsContainer.insertBefore(newStep, currentStep.nextSibling);

    // Add remove button to the first step if it doesn't have one
    const firstStep = stepsContainer.querySelector('.recipe-form__step');
    if (!firstStep.querySelector('.recipe-form__button--remove-step')) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.classList.add('recipe-form__button', 'recipe-form__button--remove-step');
      removeButton.textContent = '-';
      firstStep.appendChild(removeButton);
    }
  }

  // Function to remove a step
  removeStepLine(event) {
    const stepToRemove = event.target.closest('.recipe-form__step');
    const stepsContainer = stepToRemove.closest('.recipe-form__steps');
    stepToRemove.remove();

    // Check if there's only one step left and remove the remove button if so
    const remainingSteps = stepsContainer.querySelectorAll('.recipe-form__step');
    if (remainingSteps.length === 1) {
      const removeButton = remainingSteps[0].querySelector('.recipe-form__button--remove-step');
      if (removeButton) {
        removeButton.remove();
      }
    }
  }

  // Add stages
  addStage() {
    const stagesContainer = this.shadowRoot.getElementById('stages-container');
    const stageCount = stagesContainer.querySelectorAll('.recipe-form__steps').length;

    // Store existing instructions from the first stage
    let existingInstructions = [];
    if (stageCount === 1) {
      const firstStage = stagesContainer.querySelector('.recipe-form__steps');
      existingInstructions = Array.from(
        firstStage.querySelectorAll('.recipe-form__step input[type="text"]'),
      ).map((input) => input.value.trim());
    }

    // Create a new stage and convert it to the correct format
    const newStage = document.createElement('div');
    newStage.classList.add('recipe-form__steps');
    this.convertToStageFormat(newStage, stageCount + 1);

    // Insert the new stage before the "add stage" button
    const addStageButton = this.shadowRoot.getElementById('add-stage');
    stagesContainer.insertBefore(newStage, addStageButton);

    // If there were existing instructions, add them to the first stage
    if (existingInstructions.length > 0) {
      // Clear existing instructions from the first stage
      const firstStage = stagesContainer.querySelector('.recipe-form__steps');
      firstStage.innerHTML = ''; // This line clears the first stage

      // Convert the first stage to the correct format
      this.convertToStageFormat(firstStage, 1);

      // Add existing instructions to the first stage
      existingInstructions.forEach((instruction, index) => {
        if (index > 0) {
          this.addStepLine({ target: firstStage.querySelector('.recipe-form__button--add-step') });
        }
        firstStage.querySelectorAll('.recipe-form__step input[type="text"]')[index].value =
          instruction;
      });
    }

    // Ensure the new stage has at least one empty step
    if (newStage.querySelectorAll('.recipe-form__step').length === 0) {
      this.addStepLine({ target: newStage.querySelector('.recipe-form__button--add-step') });
    }
  }

  convertToStageFormat(stage, number) {
    const existingContent = stage.innerHTML;
    stage.innerHTML = `
      <div class="recipe-form__stage-header">
        <h3 class="recipe-form__stage-title">שלב ${number}</h3>
        <button type="button" class="recipe-form__button recipe-form__button--remove-stage">-</button>
      </div>
      <input type="text" class="recipe-form__input recipe-form__input--stage-name" placeholder="שם השלב (אופציונלי)">
      ${
        existingContent ||
        `
        <fieldset class="recipe-form__step">
          <input type="text" name="steps" class="recipe-form__input">
          <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
        </fieldset>
      `
      }
    `;
  }

  removeStage(event) {
    const stagesContainer = this.shadowRoot.getElementById('stages-container');
    const stageToRemove = event.target.closest('.recipe-form__steps');

    if (stageToRemove) {
      // If removing the last stage, store the instructions to re-add to the single stage format
      let existingInstructions = [];
      const stageCount = stagesContainer.querySelectorAll('.recipe-form__steps').length;
      if (stageCount === 2) {
        existingInstructions = Array.from(
          stageToRemove.querySelectorAll('.recipe-form__step input[type="text"]'),
        ).map((input) => input.value.trim());
      }

      stageToRemove.remove();

      // If we're back to one stage, re-add the instructions and clean up extra elements
      if (stageCount === 2 && existingInstructions.length > 0) {
        // ... (re-add instructions logic remains the same)

        // Remove extra buttons, the stage title, and the stage name input field
        const remainingStage = stagesContainer.querySelector('.recipe-form__steps');
        const addStageButton = remainingStage.querySelector('.recipe-form__button--add-stage');
        const removeStageButton = remainingStage.querySelector(
          '.recipe-form__button--remove-stage',
        );
        const stageTitle = remainingStage.querySelector('.recipe-form__stage-header');
        const stageNameInput = remainingStage.querySelector('.recipe-form__input--stage-name'); // Select the stage name input field

        if (addStageButton) addStageButton.remove();
        if (removeStageButton) removeStageButton.remove();
        if (stageTitle) stageTitle.remove();
        if (stageNameInput) stageNameInput.remove(); // Remove the stage name input field
      }

      this.updateStageNumbers();
    }
  }

  updateStageNumbers() {
    const stages = this.shadowRoot.querySelectorAll('.recipe-form__steps');
    stages.forEach((stage, index) => {
      const title = stage.querySelector('.recipe-form__stage-title');
      if (title) {
        title.textContent = `שלב ${index + 1}`;
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
        if (ingredientsList && data.ingredients) {
          ingredientsList.populateIngredients(data.ingredients);
        }

        // Populate instructions (stages)
        const stagesContainer = this.shadowRoot.getElementById('stages-container');
        // Remove all existing stages except the first one
        stagesContainer.querySelectorAll('.recipe-form__steps').forEach((stage, index) => {
          if (index > 0) {
            stage.remove();
          }
        });

        // Add stages and steps based on fetched data
        if (data.stages && data.stages.length > 0) {
          data.stages.forEach((stage, stageIndex) => {
            // Add new stage only if it's not the first one
            if (stageIndex < data.stages.length - 1) {
              this.addStage({
                target: stagesContainer.querySelector('.recipe-form__button--add-stage'),
              });
            }

            const currentStage =
              stagesContainer.querySelectorAll('.recipe-form__steps')[stageIndex];

            // Add title to the stage if it exists
            const stageTitleInput = currentStage.querySelector('.recipe-form__input--stage-name');
            if (stageTitleInput) {
              stageTitleInput.value = stage.title || ''; // Set the title or leave it empty if it doesn't exist
            }

            // Add steps to the stage
            stage.instructions.forEach((instruction, instructionIndex) => {
              if (instructionIndex > 0) {
                this.addStepLine({
                  target: currentStage.querySelectorAll('.recipe-form__button--add-step')[
                    instructionIndex - 1
                  ],
                });
              }
              currentStage.querySelectorAll('.recipe-form__step input[type="text"]')[
                instructionIndex
              ].value = instruction;
            });
          });
        } else {
          // Handle the case where there are no stages (single instruction mode)
          const currentStage = stagesContainer.querySelector('.recipe-form__steps');

          // Add necessary step lines first
          for (let i = 0; i < data.instructions.length - 1; i++) {
            const addStepButtons = currentStage.querySelectorAll('.recipe-form__button--add-step');
            if (addStepButtons.length > 0) {
              this.addStepLine({ target: addStepButtons[addStepButtons.length - 1] });
            }
          }

          // Then populate the step inputs
          const stepInputs = currentStage.querySelectorAll('.recipe-form__step input[type="text"]');
          data.instructions.forEach((instruction, instructionIndex) => {
            if (stepInputs[instructionIndex]) {
              stepInputs[instructionIndex].value = instruction;
            }
          });
        }

        // Populate images if they exist
        if (data.images) {
          await this.populateImages(data.images);
        }

        // Update stage titles
        this.updateStageNumbers();
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
