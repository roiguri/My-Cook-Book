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
        console.log("Button clicked:", event.target.textContent);
        
        addIngredientLine(event);

    }
    else if (event.target.classList.contains("remove-ingredient")) { // Check if the clicked element is a button
        console.log("Button clicked:", event.target.textContent);
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
      console.log("stepsContainer: ", stepsContainer);

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
    console.log("stageCounter: ", stageCounter);
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
      console.log("Button clicked:", event.target.textContent);
    addStepLine(event);
}
else if (event.target.classList.contains("remove-step")) {
    console.log("Button clicked:", event.target.textContent);
    removeStepLine(event);
}
else if (event.target.id === "add-stage") {
    console.log("Add stage button clicked");
    addStage(event);
}
else if (event.target.classList.contains("remove-stage")) {
  console.log("Remove stage button clicked");
  removeStage(event);
}
});
