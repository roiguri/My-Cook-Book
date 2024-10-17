class RecipeFormComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
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
        min-width: 400px;
        margin: 0 auto;
        padding: 2rem 1rem;
        box-sizing: border-box;
      }
  
      .recipe-form__title {
        font-family: var(--heading-font, 'Amatic SC', cursive);
        font-size: 2.5rem;
        color: var(--primary-color, #bb6016);
        text-align: center;
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
      .recipe-form__textarea {
        padding: 0.5rem;
        border: 1px solid var(--primary-color, #bb6016);
        border-radius: 4px;
        font-size: 1rem;
        flex-grow: 1;
        background: white;
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
  
      .recipe-form__input--quantity,
      .recipe-form__input--unit {
        width: 30%;
      }
  
      .recipe-form__input--item {
        flex-grow: 1;
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
  
      .recipe-form__input--file {
        border: none;
        padding: 0;
        margin-bottom: 0.5rem;
      }

      .recipe-form__button--submit {
        background-color: var(--primary-color, #bb6016);
        color: white;
      }
      .recipe-form__button--submit:hover {
        background-color: var(--primary-hover, #5c4033);
      }
      .recipe-form__button--clear {
        background-color: var(--secondary-color, #e6dfd1);
        color: var(--primary-color, #bb6016);
      }
      .recipe-form__button--clear:hover {
        background-color: #5c4033;
        color: white;
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
              <input type="text" id="name" name="name" class="recipe-form__input" required>
            </div>
            <div class="recipe-form__group">
              <label for="dish-type" class="recipe-form__label">סוג מנה:</label>
              <select id="dish-type" name="dish-type" class="recipe-form__select" required>
                <option value="">בחר סוג מנה</option>
                <option value="Appetizers">מנות ראשונות</option>
                <option value="Main Courses">מנות עיקריות</option>
                <option value="Side Dishes">תוספות</option>
                <option value="Soups & Stews">מרקים ונזידים</option>
                <option value="Salads">סלטים</option>
                <option value="Desserts">קינוחים</option>
                <option value="Breakfast & Brunch">ארוחות בוקר</option>
                <option value="Snacks">חטיפים</option>
                <option value="Beverages">משקאות</option>
              </select>
            </div>
          </div>
  
          <div class="recipe-form__row">
            <div class="recipe-form__group">
              <label for="prep-time" class="recipe-form__label">זמן הכנה (בדקות):</label>
              <input type="number" id="prep-time" name="prep-time" class="recipe-form__input" min="0" required>
            </div>
            <div class="recipe-form__group">
              <label for="wait-time" class="recipe-form__label">זמן המתנה (בדקות):</label>
              <input type="number" id="wait-time" name="wait-time" class="recipe-form__input" min="0" required>
            </div>
          </div>
  
          <div class="recipe-form__row">
            <div class="recipe-form__group">
              <label for="servings-form" class="recipe-form__label">מספר מנות:</label>
              <input type="number" id="servings-form" name="servings" class="recipe-form__input" min="1" required>
            </div>
            <div class="recipe-form__group">
              <label for="difficulty" class="recipe-form__label">דרגת קושי:</label>
              <select id="difficulty" name="difficulty" class="recipe-form__select" required>
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
              <input type="text" id="main-ingredient" name="main-ingredient" class="recipe-form__input" required>
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
            <label for="recipe-image" class="recipe-form__label recipe-form__label--upload">הוסף תמונה:</label>
            <input type="file" id="recipe-image" name="recipe-image" class="recipe-form__input recipe-form__input--file" accept="image/*">
          </div>
  
          <div class="recipe-form__group">
            <label for="comments" class="recipe-form__label">הערות:</label>
            <textarea id="comments" name="comments" class="recipe-form__textarea"></textarea>
          </div>
  
          <div class="recipe-form__group--buttons">
            <button type="button" id="clear-button" class="recipe-form__button recipe-form__button--clear">נקה</button>
            <button type="submit" id="submit-button" class="recipe-form__button recipe-form__button--submit">שלח מתכון</button>
          </div>
        </form>
      </div>
    `;
  }

  setupEventListeners() {
    // Add event listener for ingredients
    const ingredientsContainer = this.shadowRoot.getElementById('ingredients-container');
    ingredientsContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('recipe-form__button--add-ingredient')) {
        this.addIngredientLine(event);
      }
      else if (event.target.classList.contains('recipe-form__button--remove-ingredient')) {
        this.removeIngredientLine(event);
      }
    });

    // Add event listener for Instructions
    const stagesContainer = this.shadowRoot.getElementById('stages-container');
    stagesContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('recipe-form__button--add-step')) {
        this.addStepLine(event);
      }
      else if (event.target.classList.contains('recipe-form__button--remove-step')) {
        this.removeStepLine(event);
      }
      else if (event.target.id === 'add-stage') {
        this.addStage(event);
      }
      else if (event.target.classList.contains('recipe-form__button--remove-stage')) {
        this.removeStage(event);
      }
    });

    // Add event listeners for form submission and clearing
    // const form = this.shadowRoot.getElementById('recipe-form');
    // form.addEventListener('submit', (event) => this.handleSubmit(event));
    
    // const clearButton = this.shadowRoot.getElementById('clear-button');
    // clearButton.addEventListener('click', () => this.clearRecipe());
  }

  addIngredientLine(event) {
    const ingredientsContainer = this.shadowRoot.getElementById('ingredients-container');
    const newEntry = document.createElement('div');
    newEntry.classList.add('recipe-form__ingredient-entry');
    newEntry.innerHTML = `
      <input type="text" class="recipe-form__input recipe-form__input--quantity" placeholder="כמות">
      <input type="text" class="recipe-form__input recipe-form__input--unit" placeholder="יחידה">
      <input type="text" class="recipe-form__input recipe-form__input--item" placeholder="פריט">
      <button type="button" class="recipe-form__button recipe-form__button--remove-ingredient">-</button>
    `;
    
    const addButton = event.target;
    const lastEntry = addButton.closest('.recipe-form__ingredient-entry');
    ingredientsContainer.insertBefore(newEntry, lastEntry);
  }

  removeIngredientLine(event) {
    const entry = event.target.closest('.recipe-form__ingredient-entry');
    if (entry) {
      entry.remove();
    }
  }

  /**
   * Add instructions
   */
  addStepLine(event) {
    const currentStage = event.target.closest('.recipe-form__steps');
    const clickedButton = event.target;
    const currentStep = clickedButton.closest('.recipe-form__step');
  
    // Change the current step's button to remove
    clickedButton.textContent = '-';
    clickedButton.classList.remove('recipe-form__button--add-step');
    clickedButton.classList.add('recipe-form__button--remove-step');
  
    // Create and add the new step with an add button
    const newStep = document.createElement('fieldset');
    newStep.classList.add('recipe-form__step');
    newStep.innerHTML = `
      <input type="text" name="steps" class="recipe-form__input">
      <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
    `;
  
    // Insert the new step after the current one
    currentStage.insertBefore(newStep, currentStep.nextSibling);
  }

  removeStepLine(event) {
    const step = event.target.closest('.recipe-form__step');
    if (step) {
      step.remove();
    }
    
    // Ensure there's always an "add" button at the end
    const currentStage = event.target.closest('.recipe-form__steps');
    const steps = currentStage.querySelectorAll('.recipe-form__step');
    const lastStep = steps[steps.length - 1];
    const lastButton = lastStep.querySelector('.recipe-form__button');
    
    if (!lastButton.classList.contains('recipe-form__button--add-step')) {
      lastButton.textContent = '+';
      lastButton.classList.remove('recipe-form__button--remove-step');
      lastButton.classList.add('recipe-form__button--add-step');
    }
  }

  // Add stages
  addStage(event) {
    const stagesContainer = this.shadowRoot.getElementById('stages-container');
    const stageCount = stagesContainer.querySelectorAll('.recipe-form__steps').length;
  
    if (stageCount === 1) {
      // Convert the first stage to include title and remove button
      const firstStage = stagesContainer.querySelector('.recipe-form__steps');
      this.convertToStageFormat(firstStage, 1);
    }
  
    const newStage = document.createElement('div');
    newStage.classList.add('recipe-form__steps');
    this.convertToStageFormat(newStage, stageCount + 1);
  
    const addStageButton = this.shadowRoot.getElementById('add-stage');
    stagesContainer.insertBefore(newStage, addStageButton);
  }
  
  convertToStageFormat(stage, number) {
    const existingContent = stage.innerHTML;
    stage.innerHTML = `
      <div class="recipe-form__stage-header">
        <h3 class="recipe-form__stage-title">שלב ${number}</h3>
        <button type="button" class="recipe-form__button recipe-form__button--remove-stage">-</button>
      </div>
      <input type="text" class="recipe-form__input recipe-form__input--stage-name" placeholder="שם השלב (אופציונלי)">
      ${existingContent || `
        <fieldset class="recipe-form__step">
          <input type="text" name="steps" class="recipe-form__input">
          <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
        </fieldset>
      `}
    `;
  }
  
  removeStage(event) {
    const stage = event.target.closest('.recipe-form__steps');
    if (stage) {
      stage.remove();
      const remainingStages = this.shadowRoot.querySelectorAll('.recipe-form__steps');
      if (remainingStages.length === 1) {
        // We're back to one stage, so remove the title and button
        const lastStage = remainingStages[0];
        lastStage.innerHTML = lastStage.querySelector('fieldset').outerHTML;
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
}

customElements.define('recipe-form-component', RecipeFormComponent);