import { getFirestoreInstance } from '../../../js/services/firebase-service.js';
import authService from '../../../js/services/auth-service.js';
import { doc, getDoc } from 'firebase/firestore';
import { validateRecipeData } from '../../../js/utils/recipes/recipe-data-utils.js';
import { getImageUrl } from '../../../js/utils/recipes/recipe-image-utils.js';
import { showErrorModal, logError } from '../../../js/utils/error-handler.js';

import '../../images/image-handler.js';
import '../../modals/message-modal/message-modal.js';

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
      <style>${this.styles()}</style>
      ${this.template()}
    `;
  }

  styles() {
    return `
      .recipe-form {
        font-family: var(--body-font, Arial, sans-serif);
        color: var(--text-color, #3a3a3a);
        width: 100%;
        max-width: 800px;
        min-width: 200px;
        margin: 0 auto;
        padding: 1rem;
        box-sizing: border-box;
      }
  
      .recipe-form__title {
        font-family: var(--heading-font-he, 'Amatic SC', cursive);
        font-size: 2.5rem;
        color: var(--primary-color, #bb6016);
        text-align: center;
        margin: 0;
        margin-bottom: 1.5rem;
      }
  
      .recipe-form__error-message {
        color: red;
        font-weight: bold;
        margin-bottom: 1rem;
      }
  
      .recipe-form__row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }
  
      .recipe-form__group {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
  
      .recipe-form__label {
        font-weight: bold;
        margin-bottom: 0.5rem;
      }
  
      .recipe-form__input,
      .recipe-form__select,
      .recipe-form__textarea,
      .recipe-form__image-group {
        padding: 0.5rem;
        border: 1px solid var(--primary-color, #bb6016);
        border-radius: 4px;
        font-size: 1rem;
        flex-grow: 1;
        background: white;
      }

      .recipe-form__image-group {
        margin-bottom: 1rem;
      }

      .recipe-form__image-section {
        margin: 1rem 0;
      }

      .recipe-form__image-title {
        font-family: var(--heading-font-he);
        font-size: 1.2rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }
  
      .recipe-form__textarea {
        min-height: 100px;
        resize: vertical;
      }
      
      .recipe-form__ingredients,
      .recipe-form__stages {
        margin-bottom: 1rem;
      }
  
      .recipe-form__ingredient-entry,
      .recipe-form__step {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        border: none;
        padding: 0;
        margin: 0.5rem 0;
      }
  
      .recipe-form__input--quantity {
        width:  15%;
      }

      .recipe-form__input--unit {
        width:  20%;
      }
  
      .recipe-form__input--item {
        width: 60%;
      }
  
      .recipe-form__button {
        padding: 0.5rem 1rem;
        background-color: var(--primary-color, #bb6016);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
  
      .recipe-form__button:hover {
        background-color: var(--primary-hover, #5c4033);
      }

      .recipe-form__stage-header {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .recipe-form__button--add-ingredient,
      .recipe-form__button--add-step,
      .recipe-form__button--remove-ingredient,
      .recipe-form__button--remove-step,
      .recipe-form__button--remove-stage {
        padding: 0.5rem;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
  
      .recipe-form__button--add-stage {
        margin-top: 1rem;
      }
  
      .recipe-form__group--buttons {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
        gap: 10px;
      }
  
      .recipe-form__button--submit,
      .recipe-form__button--clear {
        flex-grow: 1;
      }

      .recipe-form__button--submit {
        background-color: var(--primary-color, #bb6016);
        color: white;
      }
      .recipe-form__button--submit:hover {
        background-color: var(--primary-hover, #5c4033);
      }
      .recipe-form__button--clear {
        background-color: #918772;
        color: white;
      }
      .recipe-form__button--clear:hover {
        background-color: #5c4033;
        color: white;
      }

      .recipe-form__input--invalid {
        border-color: red;
      }
      .recipe-form__error-message {
        color: red;
        margin-bottom: 1rem;
      }
  
      @media (max-width: 768px) {
        .recipe-form__row {
          flex-direction: column;
        }
  
        .recipe-form__group--buttons {
          flex-direction: column;
          gap: 1rem;
        }
  
        .recipe-form__button--submit,
        .recipe-form__button--clear {
          width: 100%;
        }

        .recipe-form__input,
        .recipe-form__select,
        .recipe-form__textarea,
          font-size: 0.75rem;
        }
      }
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
          <div class="recipe-form__row">
            <div class="recipe-form__group">
              <label for="name" class="recipe-form__label">שם המנה:</label>
              <input type="text" id="name" name="name" class="recipe-form__input">
            </div>
            <div class="recipe-form__group">
              <label for="dish-type" class="recipe-form__label">סוג מנה:</label>
              <select id="dish-type" name="dish-type" class="recipe-form__select">
                <option value="">בחר סוג מנה</option>
                <option value="appetizers">מנות ראשונות</option>
                <option value="main-courses">מנות עיקריות</option>
                <option value="side-dishes">תוספות</option>
                <option value="soups-stews">מרקים ותבשילים</option>
                <option value="salads">סלטים</option>
                <option value="desserts">קינוחים</option>
                <option value="breakfast-brunch">ארוחות בוקר</option>
                <option value="snacks">חטיפים</option>
                <option value="beverages">משקאות</option>
              </select>
            </div>
          </div>
  
          <div class="recipe-form__row">
            <div class="recipe-form__group">
              <label for="prep-time" class="recipe-form__label">זמן הכנה (בדקות):</label>
              <input type="number" id="prep-time" name="prep-time" class="recipe-form__input" min="0">
            </div>
            <div class="recipe-form__group">
              <label for="wait-time" class="recipe-form__label">זמן המתנה (בדקות):</label>
              <input type="number" id="wait-time" name="wait-time" class="recipe-form__input" min="0">
            </div>
          </div>
  
          <div class="recipe-form__row">
            <div class="recipe-form__group">
              <label for="servings-form" class="recipe-form__label">מספר מנות:</label>
              <input type="number" id="servings-form" name="servings" class="recipe-form__input" min="1">
            </div>
            <div class="recipe-form__group">
              <label for="difficulty" class="recipe-form__label">דרגת קושי:</label>
              <select id="difficulty" name="difficulty" class="recipe-form__select">
                <option value="">בחר דרגת קושי</option>
                <option value="קלה">קלה</option>
                <option value="בינונית">בינונית</option>
                <option value="קשה">קשה</option>
              </select>
            </div>
          </div>
  
          <div class="recipe-form__row">
            <div class="recipe-form__group">
              <label for="main-ingredient" class="recipe-form__label">מרכיב עיקרי:</label>
              <input type="text" id="main-ingredient" name="main-ingredient" class="recipe-form__input">
            </div>
            <div class="recipe-form__group">
              <label for="tags" class="recipe-form__label">תגיות:</label>
              <input type="text" id="tags" name="tags" class="recipe-form__input">
            </div>
          </div>
  
          <div class="recipe-form__group">
            <div id="ingredients-container" class="recipe-form__ingredients">
              <label class="recipe-form__label">מצרכים:</label>
              <div class="recipe-form__ingredient-entry">
                <input type="text" class="recipe-form__input recipe-form__input--quantity" placeholder="כמות">
                <input type="text" class="recipe-form__input recipe-form__input--unit" placeholder="יחידה">
                <input type="text" class="recipe-form__input recipe-form__input--item" placeholder="פריט">
                <button type="button" class="recipe-form__button recipe-form__button--add-ingredient">+</button>
              </div>
            </div>
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
  
          <div class="recipe-form__group--buttons">
            <button type="button" id="clear-button" class="recipe-form__button recipe-form__button--clear">${this.clearButtonText}</button>
            <button type="submit" id="submit-button" class="recipe-form__button recipe-form__button--submit">${this.submitButtonText}</button>
          </div>
        </form>
      </div>
      <message-modal></message-modal>
    `;
  }

  setupEventListeners() {
    // Add event listener for ingredients
    const ingredientsContainer = this.shadowRoot.getElementById('ingredients-container');
    ingredientsContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('recipe-form__button--add-ingredient')) {
        this.addIngredientLine(event);
      } else if (event.target.classList.contains('recipe-form__button--remove-ingredient')) {
        this.removeIngredientLine(event);
      }
    });

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

    // Add event listener for clearing the form
    const clearButton = this.shadowRoot.getElementById('clear-button');
    clearButton.addEventListener('click', () => {
      this.clearForm();

      // Dispatch the clear button click event
      this.dispatchEvent(
        new CustomEvent('clear-button-clicked', {
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  /**
   * Add ingredient
   */
  addIngredientLine(event) {
    const ingredientsContainer = this.shadowRoot.querySelector('.recipe-form__ingredients');
    const clickedButton = event.target;
    const currentIngredient = clickedButton.closest('.recipe-form__ingredient-entry');

    // Create and add the new ingredient entry with remove and add buttons in the correct order
    const newEntry = document.createElement('div');
    newEntry.classList.add('recipe-form__ingredient-entry');
    newEntry.innerHTML = `
      <input type="text" class="recipe-form__input recipe-form__input--quantity" placeholder="כמות">
      <input type="text" class="recipe-form__input recipe-form__input--unit" placeholder="יחידה">
      <input type="text" class="recipe-form__input recipe-form__input--item" placeholder="פריט">
      <button type="button" class="recipe-form__button recipe-form__button--add-ingredient">+</button>
      <button type="button" class="recipe-form__button recipe-form__button--remove-ingredient">-</button>
    `;

    // Insert the new entry after the current one
    ingredientsContainer.insertBefore(newEntry, currentIngredient.nextSibling);

    // Add remove button to the first ingredient if it doesn't have one
    const firstIngredient = ingredientsContainer.querySelector('.recipe-form__ingredient-entry');
    if (!firstIngredient.querySelector('.recipe-form__button--remove-ingredient')) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.classList.add('recipe-form__button', 'recipe-form__button--remove-ingredient');
      removeButton.textContent = '-';
      firstIngredient.appendChild(removeButton);
    }
  }

  // Function to remove an ingredient
  removeIngredientLine(event) {
    const ingredientToRemove = event.target.closest('.recipe-form__ingredient-entry');
    const ingredientsContainer = ingredientToRemove.closest('.recipe-form__ingredients');
    ingredientToRemove.remove();

    // Check if there's only one ingredient left and remove the remove button if so
    const remainingIngredients = ingredientsContainer.querySelectorAll(
      '.recipe-form__ingredient-entry',
    );
    if (remainingIngredients.length === 1) {
      const removeButton = remainingIngredients[0].querySelector(
        '.recipe-form__button--remove-ingredient',
      );
      if (removeButton) {
        removeButton.remove();
      }
    }
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
   * Validate form using recipe-data-utils and ingredient utils
   */
  validateForm() {
    this.collectFormData();
    const { isValid, errors } = validateRecipeData(this.recipeData);
    // Clear all previous error states
    this.shadowRoot
      .querySelectorAll('.recipe-form__input, .recipe-form__select, .recipe-form__textarea')
      .forEach((el) => {
        el.classList.remove('recipe-form__input--invalid');
      });
    // Show error messages and highlight invalid fields
    const errorMessage = this.shadowRoot.querySelector('.recipe-form__error-message');
    if (!isValid) {
      let errorText = 'ישנם שגיאות בטופס. אנא תקן אותן.';
      if (errors) {
        // Highlight fields with errors
        Object.keys(errors).forEach((key) => {
          if (key.startsWith('ingredients[')) {
            // Highlight ingredient fields
            const match = key.match(/ingredients\[(\d+)\]\.(\w+)/);
            if (match) {
              const idx = parseInt(match[1], 10);
              const field = match[2];
              const entry = this.shadowRoot.querySelectorAll('.recipe-form__ingredient-entry')[idx];
              if (entry) {
                const input = entry.querySelector(`.recipe-form__input--${field}`);
                if (input) input.classList.add('recipe-form__input--invalid');
              }
            }
          } else if (key.startsWith('instructions[')) {
            // Highlight instruction fields
            const match = key.match(/instructions\[(\d+)\]/);
            if (match) {
              const idx = parseInt(match[1], 10);
              const input = this.shadowRoot.querySelectorAll(
                '.recipe-form__stages input[type="text"]',
              )[idx];
              if (input) input.classList.add('recipe-form__input--invalid');
            }
          } else if (key.startsWith('stages[')) {
            // Highlight stage fields
            const match = key.match(/stages\[(\d+)\](?:\.(\w+))?/);
            if (match) {
              const sIdx = parseInt(match[1], 10);
              const field = match[2];
              const stage = this.shadowRoot.querySelectorAll('.recipe-form__steps')[sIdx];
              if (stage && field === 'title') {
                const input = stage.querySelector('.recipe-form__input--stage-name');
                if (input) input.classList.add('recipe-form__input--invalid');
              }
              if (stage && field === 'instructions') {
                stage.querySelectorAll('input[type="text"]').forEach((input) => {
                  input.classList.add('recipe-form__input--invalid');
                });
              }
            }
          } else {
            // Highlight main fields
            const fieldMap = {
              name: 'name',
              category: 'dish-type',
              prepTime: 'prep-time',
              waitTime: 'wait-time',
              servings: 'servings-form',
              difficulty: 'difficulty',
              mainIngredient: 'main-ingredient',
              tags: 'tags',
              comments: 'comments',
            };
            const fieldId = fieldMap[key];
            if (fieldId) {
              const el = this.shadowRoot.getElementById(fieldId);
              if (el) el.classList.add('recipe-form__input--invalid');
            }
          }
        });
        // Show all error messages
        errorText = Object.values(errors).join(' ');
      }
      errorMessage.textContent = errorText;
      errorMessage.style.display = 'block';
    } else {
      errorMessage.style.display = 'none';
    }
    return isValid;
  }

  collectFormData() {
    this.recipeData = {
      name: this.shadowRoot.getElementById('name').value.trim(),
      category: this.shadowRoot.getElementById('dish-type').value,
      prepTime: parseInt(this.shadowRoot.getElementById('prep-time').value),
      waitTime: parseInt(this.shadowRoot.getElementById('wait-time').value),
      difficulty: this.shadowRoot.getElementById('difficulty').value,
      mainIngredient: this.shadowRoot.getElementById('main-ingredient').value,
      tags: this.shadowRoot
        .getElementById('tags')
        .value.split(',')
        .map((tag) => tag.trim()),
      servings: parseInt(this.shadowRoot.getElementById('servings-form').value),
      ingredients: [],
      approved: false, // Added for future manager approval
    };

    // Get ingredients
    this.shadowRoot.querySelectorAll('.recipe-form__ingredient-entry').forEach((entry) => {
      this.recipeData.ingredients.push({
        amount: entry.querySelector('.recipe-form__input--quantity').value.trim(),
        unit: entry.querySelector('.recipe-form__input--unit').value.trim(),
        item: entry.querySelector('.recipe-form__input--item').value.trim(),
      });
    });

    // Check if stages are present
    const stagesContainers = this.shadowRoot.querySelectorAll('.recipe-form__steps');
    if (stagesContainers.length > 1) {
      this.recipeData.stages = [];
      stagesContainers.forEach((container, index) => {
        const stageNameInput = container.querySelector('.recipe-form__input--stage-name');
        const stageTitle = stageNameInput ? stageNameInput.value.trim() : `שלב ${index + 1}`;
        const stage = {
          title: stageTitle,
          instructions: Array.from(
            container.querySelectorAll('.recipe-form__step input[type="text"]'),
          ).map((input) => input.value.trim()),
        };
        this.recipeData.stages.push(stage);
      });
    } else {
      this.recipeData.instructions = Array.from(
        this.shadowRoot
          .querySelector('.recipe-form__stages')
          .querySelectorAll('input[type="text"]'),
      ).map((input) => input.value.trim());
    }

    // Collect images
    const imageHandler = this.shadowRoot.getElementById('recipe-images');
    const images = imageHandler.getImages();
    // Track removed images if the handler supports it
    const toDelete =
      typeof imageHandler.getRemovedImages === 'function' ? imageHandler.getRemovedImages() : [];

    this.recipeData.images = images.map((img) => {
      if (img.file) {
        // New image to upload
        return {
          file: img.file,
          isPrimary: img.isPrimary,
          access: 'public',
          uploadedBy: authService.getCurrentUser()?.uid || 'anonymous',
          source: 'new',
        };
      } else {
        // Existing image to keep
        return {
          id: img.id,
          isPrimary: img.isPrimary,
          full: img.full,
          compressed: img.compressed,
          access: img.access,
          uploadedBy: img.uploadedBy,
          fileName: img.fileName,
          uploadTimestamp: img.uploadTimestamp,
          source: 'existing',
        };
      }
    });
    this.recipeData.toDelete = toDelete;

    // Get comments if present
    const comments = this.shadowRoot.getElementById('comments').value.trim();
    if (comments) {
      this.recipeData.comments = [comments];
    }
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
    // Clear all input fields
    this.shadowRoot.querySelectorAll('input').forEach((input) => {
      input.value = '';
      input.classList.remove('recipe-form__input--invalid');
    });

    // Clear all select fields
    this.shadowRoot.querySelectorAll('select').forEach((select) => {
      select.selectedIndex = 0;
      select.classList.remove('recipe-form__input--invalid');
    });

    // Clear all textareas
    this.shadowRoot.querySelectorAll('textarea').forEach((textarea) => {
      textarea.value = '';
      textarea.classList.remove('recipe-form__input--invalid');
    });

    // Reset ingredients to initial state
    const ingredientsContainer = this.shadowRoot.querySelector('.recipe-form__ingredients');
    const ingredientEntries = ingredientsContainer.querySelectorAll(
      '.recipe-form__ingredient-entry',
    );
    ingredientEntries.forEach((entry, index) => {
      if (index === 0) {
        // Reset first ingredient entry
        entry.querySelector('.recipe-form__input--quantity').value = '';
        entry.querySelector('.recipe-form__input--unit').value = '';
        entry.querySelector('.recipe-form__input--item').value = '';
        const addButton = entry.querySelector('button');
        addButton.textContent = '+';
        addButton.classList.remove('recipe-form__button--remove-ingredient');
        addButton.classList.add('recipe-form__button--add-ingredient');
      } else {
        // Remove additional ingredient entries
        entry.remove();
      }
    });

    // Reset instructions to initial state
    const stagesContainer = this.shadowRoot.getElementById('stages-container');
    const stepsContainers = stagesContainer.querySelectorAll('.recipe-form__steps');
    stepsContainers.forEach((container, index) => {
      if (index === 0) {
        // Reset first stage
        const steps = container.querySelectorAll('.recipe-form__step');
        steps.forEach((step, stepIndex) => {
          if (stepIndex === 0) {
            // Reset first step
            step.querySelector('input[type="text"]').value = '';
            const addButton = step.querySelector('button');
            addButton.textContent = '+';
            addButton.classList.remove('recipe-form__button--remove-step');
            addButton.classList.add('recipe-form__button--add-step');
          } else {
            // Remove additional steps
            step.remove();
          }
        });
        // Remove stage title and name if present
        const titleContainer = container.querySelector('.recipe-form__stage-header');
        if (titleContainer) titleContainer.remove();
        const stageName = container.querySelector('.recipe-form__input--stage-name');
        if (stageName) stageName.remove();
      } else {
        // Remove additional stages
        container.remove();
      }
    });

    // Clear the image preview and hide it
    const imageHandler = this.shadowRoot.getElementById('recipe-images');
    imageHandler.clearImages();

    // Reset the form
    this.shadowRoot.getElementById('recipe-form').reset();

    // Hide error message if visible
    const errorMessage = this.shadowRoot.querySelector('.recipe-form__error-message');
    if (errorMessage) errorMessage.style.display = 'none';
  }

  async setRecipeData(recipeId) {
    try {
      const db = getFirestoreInstance();
      const docSnap = await getDoc(doc(db, 'recipes', recipeId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.recipeData = data; // Store the fetched data

        // Populate basic input fields
        this.shadowRoot.getElementById('name').value = data.name;
        this.shadowRoot.getElementById('dish-type').value = data.category;
        this.shadowRoot.getElementById('prep-time').value = data.prepTime;
        this.shadowRoot.getElementById('wait-time').value = data.waitTime;
        this.shadowRoot.getElementById('servings-form').value = data.servings;
        this.shadowRoot.getElementById('difficulty').value = data.difficulty;
        this.shadowRoot.getElementById('main-ingredient').value = data.mainIngredient;
        this.shadowRoot.getElementById('tags').value = data.tags.join(', ');
        this.shadowRoot.getElementById('comments').value = data.comments
          ? data.comments.join('\n')
          : '';

        // Populate ingredients
        const ingredientsContainer = this.shadowRoot.querySelector('.recipe-form__ingredients');
        // Remove all existing ingredient entries except the first one
        ingredientsContainer
          .querySelectorAll('.recipe-form__ingredient-entry')
          .forEach((entry, index) => {
            if (index > 0) {
              entry.remove();
            }
          });
        // Add ingredient entries and populate them
        data.ingredients.forEach((ingredient, index) => {
          // Select the correct ingredient entry using index
          const entries = ingredientsContainer.querySelectorAll('.recipe-form__ingredient-entry');
          const entry = entries[index];

          if (index < data.ingredients.length - 1) {
            const addButton = entry.querySelector('.recipe-form__button--add-ingredient');

            if (addButton) {
              this.addIngredientLine({ target: addButton });
            }
          }

          if (entry) {
            // Make sure the entry exists
            entry.querySelector('.recipe-form__input--quantity').value = ingredient.amount;
            entry.querySelector('.recipe-form__input--unit').value = ingredient.unit;
            entry.querySelector('.recipe-form__input--item').value = ingredient.item;
          }
        });

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
    const formElements = this.shadowRoot.querySelectorAll('input, select, textarea, button');
    formElements.forEach((element) => {
      element.disabled = isDisabled;
    });

    const imageHandler = this.shadowRoot.getElementById('recipe-images');
    if (imageHandler && typeof imageHandler.setDisabled === 'function') {
      imageHandler.setDisabled(isDisabled);
    }
  }
}

customElements.define('recipe-form-component', RecipeFormComponent);
