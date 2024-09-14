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

    /* append to ingredient list */
    const stepsList = document.querySelector(".steps-container")
    stepsList.appendChild(newEntry);

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

const stepsList = document.getElementById("steps-container");
stepsList.addEventListener("click", function(event) {
    if (event.target.classList.contains("add-step")) { // Check if the clicked element is a button
        console.log("Button clicked:", event.target.textContent);
        addStepLine(event);

    }
    else if (event.target.classList.contains("remove-step")) { // Check if the clicked element is a button
        console.log("Button clicked:", event.target.textContent);
        removeStepLine(event);
    }
});

