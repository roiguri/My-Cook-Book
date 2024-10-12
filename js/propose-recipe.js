/* Add ingredient list Item */

function addIngredientLine(event) {
    /* create new entry element */
    const newEntry = document.createElement("div");
    newEntry.classList.add("ingredient-entry");
    
    const newQuan = document.createElement("input");
    newQuan.setAttribute("type", "text");
    newQuan.setAttribute("name", "ingredient-quantity[]");
    newQuan.placeholder = "כמות";
    newQuan.classList.add("quantity-input");

    const newUnit = document.createElement("input");
    newUnit.setAttribute("type", "text");
    newUnit.setAttribute("name", "ingredient-unit[]");
    newUnit.placeholder = "יחידה";
    newUnit.classList.add("unit-input");

    const newItem = document.createElement("input");
    newItem.setAttribute("type", "text");
    newItem.setAttribute("name", "ingredient-item[]");
    newItem.placeholder = "פריט";
    newItem.classList.add("item-input");

    const newAddBtn = document.createElement("button");
    newAddBtn.setAttribute("type", "button");
    newAddBtn.classList.add("add-ingredient");
    newAddBtn.textContent = "+";
    
    /* append all elements to entry */
    newEntry.appendChild(newQuan);
    newEntry.appendChild(newUnit);
    newEntry.appendChild(newItem);
    newEntry.appendChild(newAddBtn);

    /* append to ingredient list */
    const ingredientList = document.querySelector(".ingredients")
    ingredientList.appendChild(newEntry);

    /* change button to remove button */
    const clickedButton = event.target;
    clickedButton.textContent = "-";
    clickedButton.classList.remove("add-ingredient");
    clickedButton.classList.add("remove-ingredient");
}

function removeIngredientLine(event){
    const clickedButton = event.target;
    const entry = clickedButton.parentNode;
    entry.remove();
}

const ingredientList = document.getElementById("ingredients-container");
ingredientList.addEventListener("click", function(event) {
    if (event.target.classList.contains("add-ingredient")) { // Check if the clicked element is a button
        
        addIngredientLine(event);

    }
    else if (event.target.classList.contains("remove-ingredient")) { // Check if the clicked element is a button
        removeIngredientLine(event);
        
    }
});

let stageCounter = 1;
function addStage(event) {
    // add title to the first stage
    if (stageCounter == 1){
      // title container
      const titleContainer = document.createElement("div");
      titleContainer.classList.add("title-container");

      const title = document.createElement("h3");
      title.textContent = `שלב ${stageCounter}`;
      const stepsContainer = document.getElementById("steps-container");

      const rmStageBtn = document.createElement("button");
      rmStageBtn.setAttribute("type", "button");
      rmStageBtn.classList.add("remove-stage");
      rmStageBtn.textContent = "-";

      titleContainer.appendChild(title);
      titleContainer.appendChild(rmStageBtn);

      // stage name input
      const stageNameInput = document.createElement("input");
      stageNameInput.setAttribute("type", "text");
      stageNameInput.setAttribute("name", `stage-name-${stageCounter}`);
      stageNameInput.classList.add("stage-name");
      stageNameInput.placeholder = "שם השלב (אופציונלי)";

      stepsContainer.insertBefore(stageNameInput, stepsContainer.firstChild);
      stepsContainer.insertBefore(titleContainer, stepsContainer.firstChild);

    }
    stageCounter++;
    // add new stage
    const newStage = document.createElement("div");
    newStage.classList.add("steps-container");
    newStage.setAttribute("id", "steps-container");

    // title container
    const titleContainer = document.createElement("div");
    titleContainer.classList.add("title-container");

    const rmStageBtn = document.createElement("button");
    rmStageBtn.setAttribute("type", "button");
    rmStageBtn.classList.add("remove-stage");
    rmStageBtn.textContent = "-";

    const title = document.createElement("h3");
    title.textContent = `שלב ${stageCounter}`;

    titleContainer.appendChild(title);
    titleContainer.appendChild(rmStageBtn);
    const stageNameInput = document.createElement("input");
    stageNameInput.setAttribute("type", "text");
    stageNameInput.classList.add("stage-name");
    stageNameInput.setAttribute("name", `stage-name-${stageCounter}`);
    stageNameInput.placeholder = "שם השלב (אופציונלי)";

    newStage.appendChild(titleContainer);
    newStage.appendChild(stageNameInput);

    const newStep = document.createElement("fieldset");
    newStep.classList.add("steps");

    const newInput = document.createElement("input");
    newInput.setAttribute("type", "text");
    newInput.setAttribute("name", `steps-${stageCounter}`);

    const newAddBtn = document.createElement("button");
    newAddBtn.setAttribute("type", "button");
    newAddBtn.classList.add("add-step");
    newAddBtn.textContent = "+";

    newStage.appendChild(newStep);
    newStep.appendChild(newInput);
    newStep.appendChild(newAddBtn);

    const stagesContainer = document.getElementById("stages-container");
    const lastStage = stagesContainer.lastElementChild;
    stagesContainer.insertBefore(newStage, lastStage);
}

function updateStageCounters() {
  const stages = document.querySelectorAll('.steps-container');
  if (stages.length === 1) {
    stageCounter = 1;
    const stage = document.querySelector('.steps-container');
    stage.querySelector('.title-container').remove();
    stage.querySelector('.stage-name').remove();
  }
  else {
  stages.forEach((stage, index) => {
    const title = stage.querySelector('h3');
    title.textContent = `שלב ${index + 1}`;
    });
    stageCounter = stages.length; // Assuming stageCounter is a global variable
  }
}

function removeStage(event){
  const clickedButton = event.target;
  const stageContainer = clickedButton.closest('.steps-container');
  stageContainer.remove();
  updateStageCounters();
}

function addStepLine(event) {
    /* create new entry element */
    const newEntry = document.createElement("fieldset");
    newEntry.classList.add("steps");
    
    const newStep = document.createElement("input");
    newStep.setAttribute("type", "text");
    newStep.setAttribute("name", "steps");

    const newAddBtn = document.createElement("button");
    newAddBtn.setAttribute("type", "button");
    newAddBtn.classList.add("add-step");
    newAddBtn.textContent = "+";
    
    /* append all elements to entry */
    newEntry.appendChild(newStep);
    newEntry.appendChild(newAddBtn);

    /* find the correct stage container and append the new step */
    const currentStage = event.target.closest('.steps-container');
    currentStage.appendChild(newEntry);

    /* change button to remove button */
    const clickedButton = event.target;
    clickedButton.textContent = "-";
    clickedButton.classList.remove("add-step");
    clickedButton.classList.add("remove-step");
}

function removeStepLine(event){
    const clickedButton = event.target;
    const entry = clickedButton.parentNode;
    entry.remove();
}


document.addEventListener('click', function(event) {
  if (event.target.classList.contains("add-step")) {
    addStepLine(event);
}
else if (event.target.classList.contains("remove-step")) {
    removeStepLine(event);
}
else if (event.target.id === "add-stage") {
    addStage(event);
}
else if (event.target.classList.contains("remove-stage")) {
  removeStage(event);
}
else if (event.target.id === "submit-button") {
  confirmSubmitRecipe(event);
}
else if (event.target.id === "clear-button")  {
  clearRecipe(event);
}
});

// form submission
function confirmSubmitRecipe(event) {
  event.preventDefault(); // Prevent form from submitting immediately

  if (!validateForm()) {
    console.log("Form is invalid");
    document.querySelector(".error-message").style.display = "block";
    return;
  }

  const confirmMessage = "האם אתה בטוח שברצונך לשלוח את המתכון? לאחר השליחה לא ניתן יהיה לערוך את המתכון.";
  if (confirm(confirmMessage)) {
    submitRecipe();
  } else {
    console.log("Form submission cancelled");
  }
}

async function submitRecipe(event) {
  const formData = getFormData();
  try {
    // Upload image if present
    const imageInput = document.getElementById('recipe-image');
    if (imageInput && imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const imageUrl = await uploadImage(file, formData.category);
      formData.image = imageUrl;
    }

    // Add recipe to Firestore
    const docRef = await db.collection('recipes').add(formData);
    
    // Update the recipe with its ID
    await docRef.update({ id: docRef.id });

    alert('המתכון נשלח בהצלחה!');
    // Optionally, reset the form or redirect the user
  } catch (error) {
    console.error('Error submitting recipe:', error);
    alert('אירעה שגיאה בשליחת המתכון. נא לנסות שוב.');
  }
}

async function uploadImage(file, category) {
  const storageRef = firebase.storage().ref();
  const fullImageRef = storageRef.child(`img/recipes/full/${category}/${file.name}`);
  const compressedImageRef = storageRef.child(`img/recipes/compressed/${category}/${file.name}`);

  // Upload full size image
  await fullImageRef.put(file);

  // Compress and upload compressed image
  const compressedFile = await compressImage(file);
  await compressedImageRef.put(compressedFile);

  // Return the full size image URL
  return await fullImageRef.getDownloadURL();
}

async function compressImage(file) {
  // Implement image compression logic here
  // For simplicity, we're just returning the original file
  // You should use a library like browser-image-compression for actual compression
  return file;
}

function validateForm() {
  let isValid = true;

  function addValidationListener(field) {
    field.addEventListener('input', function() {
      if (field.value.trim()) {
        field.classList.remove('invalid');
      }
    });
  }

  // 1. Check if mandatory fields are filled
  const mandatoryFields = [
    'name', 'dish-type', 'prep-time', 'wait-time', 'servings-form',
    'difficulty', 'main-ingredient'
  ];
  mandatoryFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) { 
      isValid = false;
      field.classList.add('invalid');
      addValidationListener(field);
    } else {
      field.classList.remove('invalid');
    }
  });

  // 2. Check if preparation and waiting times are numbers
  const timeFields = ['prep-time', 'wait-time', 'servings-form'];
  timeFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    const value = parseInt(field.value);
    if (isNaN(value) || value < 0) { 
      isValid = false;
      field.classList.add('invalid');
      field.addEventListener('input', function() {
        const newValue = parseInt(this.value);
        if (!isNaN(newValue) && newValue >= 0) {
          this.classList.remove('invalid');
        }
      });
    } else {
      field.classList.remove('invalid');
    }
  });

  // 3. Check if all ingredient fields are filled in all entries
  const ingredientEntries = document.querySelectorAll('.ingredient-entry');
  ingredientEntries.forEach(entry => {
    const quantityInput = entry.querySelector('.quantity-input');
    const unitInput = entry.querySelector('.unit-input');
    const itemInput = entry.querySelector('.item-input');

    [quantityInput, unitInput, itemInput].forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.classList.add('invalid');
        addValidationListener(input);
      } else {
        input.classList.remove('invalid');
      }
    });
  });

  // 4. Check if all step fields are filled in all stages
  const stagesContainers = document.querySelectorAll('.steps-container');
  stagesContainers.forEach(container => {
    container.querySelectorAll('.steps input[type="text"]').forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.classList.add('invalid');
        addValidationListener(input);
      } else {
        input.classList.remove('invalid');
      }
    });
  });

  return isValid;
}

function getFormData() {
  const formData = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('dish-type').value,
    cookingTime: parseInt(document.getElementById('prep-time').value) + parseInt(document.getElementById('wait-time').value),
    difficulty: document.getElementById('difficulty').value,
    mainIngredient: document.getElementById('main-ingredient').value,
    tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
    servings: parseInt(document.getElementById('servings-form').value),
    ingredients: [],
    approved: false  // Added for future manager approval
  };

  // Get ingredients
  document.querySelectorAll('.ingredient-entry').forEach(entry => {
    formData.ingredients.push({
      amount: entry.querySelector('.quantity-input').value.trim(),
      unit: entry.querySelector('.unit-input').value.trim(),
      item: entry.querySelector('.item-input').value.trim()
    });
  });

  // Check if stages are present
  const stagesContainers = document.querySelectorAll('.steps-container');
  if (stagesContainers.length > 1) {
    formData.stages = [];
    stagesContainers.forEach((container, index) => {
      const stage = {
        title: `שלב ${index + 1}`,
        instructions: Array.from(container.querySelectorAll('.steps input[type="text"]')).map(input => input.value.trim())
      };
      formData.stages.push(stage);
    });
  } else {
    formData.instructions = Array.from(document.querySelector('.steps-container').querySelectorAll('input[type="text"]')).map(input => input.value.trim());
  }

  // Get comments if present
  const comments = document.getElementById('comments').value.trim();
  if (comments) {
    formData.comments = [comments];
  }

  return formData;
}

function clearRecipe(event) {
  // Clear all input fields
  document.querySelectorAll('input').forEach(input => {
    input.value = '';
    input.classList.remove('invalid');
  });

  // Clear all select fields
  document.querySelectorAll('select').forEach(select => {
    select.selectedIndex = 0;
    select.classList.remove('invalid');
  });

  // Clear all textareas
  document.querySelectorAll('textarea').forEach(textarea => {
    textarea.value = '';
    textarea.classList.remove('invalid');
  });

  // Reset ingredients to initial state
  const ingredientsContainer = document.querySelector('.ingredients');
  const ingredientEntries = ingredientsContainer.querySelectorAll('.ingredient-entry');
  ingredientEntries.forEach((entry, index) => {
    if (index === 0) {
      // Reset first ingredient entry
      entry.querySelector('.quantity-input').value = '';
      entry.querySelector('.unit-input').value = '';
      entry.querySelector('.item-input').value = '';
      const addButton = entry.querySelector('button');
      addButton.textContent = '+';
      addButton.classList.remove('remove-ingredient');
      addButton.classList.add('add-ingredient');
    } else {
      // Remove additional ingredient entries
      entry.remove();
    }
  });

  // Reset instructions to initial state
  const stagesContainer = document.getElementById('stages-container');
  const stepsContainers = stagesContainer.querySelectorAll('.steps-container');
  stepsContainers.forEach((container, index) => {
    if (index === 0) {
      // Reset first stage
      const steps = container.querySelectorAll('.steps');
      steps.forEach((step, stepIndex) => {
        if (stepIndex === 0) {
          // Reset first step
          step.querySelector('input[type="text"]').value = '';
          const addButton = step.querySelector('button');
          addButton.textContent = '+';
          addButton.classList.remove('remove-step');
          addButton.classList.add('add-step');
        } else {
          // Remove additional steps
          step.remove();
        }
      });
      // Remove stage title and name if present
      const titleContainer = container.querySelector('.title-container');
      if (titleContainer) titleContainer.remove();
      const stageName = container.querySelector('.stage-name');
      if (stageName) stageName.remove();
    } else {
      // Remove additional stages
      container.remove();
    }
  });

  // Reset stage counter
  stageCounter = 1;

  // Reset the form
  document.getElementById('recipe-form').reset();

  // Hide error message if visible
  const errorMessage = document.querySelector('.error-message');
  if (errorMessage) errorMessage.style.display = 'none';
}
