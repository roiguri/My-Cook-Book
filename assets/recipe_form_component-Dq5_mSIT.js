import{a as _,g as h,b as v,d as b}from"./sw-register-nWNmA_5D.js";import{j as y,v as w,k as u}from"./recipe-image-utils-BxyJQeAp.js";import"./message-modal-BCf8-UxT.js";class x extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.maxFileSize=5*1024*1024,this.allowedTypes=["image/jpeg","image/png","image/webp"],this.images=[],this.maxImages=5,this.draggedImage=null,this.removedImages=[]}connectedCallback(){this.render(),this.setupEventListeners()}render(){this.shadowRoot.innerHTML=`
      <style>
        .image-handler {
          font-family: var(--body-font);
          width: 100%;
        }

        .upload-area {
          border: 2px dashed var(--primary-color, #bb6016);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .upload-area.drag-over {
          background-color: rgba(187, 96, 22, 0.1);
        }

        .upload-area[data-disabled="true"] {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .selected-files {
          margin-top: 10px;
          font-size: 0.9em;
          color: #666;
        }

        .file-input {
          display: none;
        }

        .preview-container {
          position: relative;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
          padding: 0.5rem 0;
        }

        .image-preview {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid var(--primary-color, #bb6016);
          cursor: move;
          transition: all 0.2s ease;
          user-select: none;
        }

        .image-preview.dragging {
          opacity: 0.5;
          transform: scale(0.95);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .image-preview.primary {
          border-color: var(--secondary);
          box-shadow: 0 0 10px rgba(var(--secondary), 0.5);
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-preview.uploading::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .image-preview:hover .image-controls {
          opacity: 1;
        }

        .image-controls {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .control-button {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 2px;
          cursor: pointer;
          font-size: 0.8em;
          color: #333;
          width: 80%;
        }

        .control-button:hover {
          background: white;
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          display: none;
        }

        .progress-bar__fill {
          height: 100%;
          background: var(--primary-color, #bb6016);
          width: 0%;
          transition: width 0.3s ease;
        }

        .error-message {
          color: red;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        .status-message {
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        .drop-indicator {
          position: absolute;
          width: calc(100% - 2rem); /* Account for container padding */
          height: 3px;
          background-color: var(--primary-color, #bb6016);
          box-shadow: 0 0 5px rgba(187, 96, 22, 0.5);
          transition: transform 0.2s ease;
          pointer-events: none;
          display: none;
          z-index: 1000;
          margin: 0 1rem;
        }

        .image-preview.primary::after {
          content: '✓';
          position: absolute;
          top: 5px;
          right: 5px;
          background: var(--secondary);
          color: black;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .primary-label {
          position: absolute;
          top: 30px;
          right: 5px;
          background: var(--secondary);
          opacity: 0.9;
          color: black;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }

        .error-container {
          background-color: #ffebee;
          color: #c62828;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 10px;
          font-size: 0.9em;
          display: none;
        }
      </style>

      <div class="image-handler">
        <div class="error-container"></div>
        <div class="upload-area" data-disabled="false">
          גרור תמונות לכאן או לחץ להעלאה
          <div class="status-message">
            (מקסימום ${this.maxImages} תמונות, גודל מקסימלי 5MB לתמונה)
          </div>
          <div class="selected-files"></div>
        </div>
        <input type="file" class="file-input" accept="image/jpeg,image/png,image/webp" multiple>
        <div class="error-message"></div>
        <div class="preview-container"></div>
      </div>
    `}setupEventListeners(){const r=this.shadowRoot.querySelector(".upload-area"),i=this.shadowRoot.querySelector(".file-input");r.addEventListener("click",()=>{r.getAttribute("data-disabled")!=="true"&&i.click()}),i.addEventListener("change",a=>{this.handleFiles(Array.from(a.target.files)),i.value=""}),r.addEventListener("dragover",a=>{a.preventDefault(),r.getAttribute("data-disabled")!=="true"&&r.classList.add("drag-over")}),r.addEventListener("dragleave",()=>{r.classList.remove("drag-over")}),r.addEventListener("drop",a=>{if(a.preventDefault(),r.classList.remove("drag-over"),r.getAttribute("data-disabled")!=="true"){const t=Array.from(a.dataTransfer.files).filter(s=>this.allowedTypes.includes(s.type));this.handleFiles(t)}});const o=this.shadowRoot.querySelector(".preview-container"),e=document.createElement("div");e.className="drop-indicator",o.appendChild(e),o.addEventListener("dragstart",a=>{const t=a.target.closest(".image-preview");t&&(this.draggedImage=t,t.classList.add("dragging"),a.dataTransfer.setData("text/plain",t.getAttribute("data-id")),a.dataTransfer.effectAllowed="move")}),o.addEventListener("dragend",a=>{const t=a.target.closest(".image-preview");t&&(t.classList.remove("dragging"),this.draggedImage=null,e.style.display="none")}),o.addEventListener("dragover",a=>{a.preventDefault();const t=a.target.closest(".image-preview");if(t&&this.draggedImage&&t!==this.draggedImage){a.dataTransfer.dropEffect="move";const s=[...o.querySelectorAll(".image-preview")],n=s.indexOf(t),l=s.indexOf(this.draggedImage);e.style.display="block";const c=t.getBoundingClientRect(),d=o.getBoundingClientRect();n>l?e.style.transform=`translateY(${c.bottom-d.top}px)`:e.style.transform=`translateY(${c.top-d.top}px)`}}),o.addEventListener("dragenter",a=>{a.preventDefault()}),o.addEventListener("dragleave",a=>{a.target.closest(".image-preview")||(e.style.display="none")}),o.addEventListener("drop",a=>{a.preventDefault(),e.style.display="none";const t=a.target.closest(".image-preview");if(!t||!this.draggedImage||t===this.draggedImage)return;const s=[...o.querySelectorAll(".image-preview")],n=s.indexOf(this.draggedImage),l=s.indexOf(t);this.reorderImages(n,l)})}async handleFiles(r){const i=this.maxImages-this.images.length;if(i<=0){this.showError(`לא ניתן להעלות יותר מ-${this.maxImages} תמונות`);return}const o=r.slice(0,i);for(const e of o){const a=this.validateFile(e);if(!a.valid){this.showError(a.error);continue}try{const t=await this.createImagePreview(e),s={file:e,preview:t,id:y()};this.addImage(s),this.dispatchEvent(new CustomEvent("file-added",{detail:{imageData:s},bubbles:!0,composed:!0}))}catch{this.showError("שגיאה בטעינת התמונה")}}this.updateUploadAreaState()}validateFile(r){return this.allowedTypes.includes(r.type)?r.size>this.maxFileSize?{valid:!1,error:"התמונה גדולה מדי. הגודל המקסימלי המותר הוא 5MB"}:{valid:!0}:{valid:!1,error:"סוג הקובץ לא נתמך. נא להעלות תמונות מסוג JPEG, PNG או WebP בלבד"}}updateSelectedFiles(){const r=this.shadowRoot.querySelector(".selected-files");if(this.images.length===0){r.textContent="";return}const i=this.images.map(o=>o.file?o.file.name:o.fileName||o.id||"תמונה קיימת").filter(Boolean);r.textContent=`קבצים נבחרו: ${i.join(", ")}`}reorderImages(r,i){const o=this.images.splice(r,1)[0];this.images.splice(i,0,o),this.updatePreviewContainer(),this.dispatchEvent(new CustomEvent("images-reordered",{detail:{images:this.images},bubbles:!0,composed:!0}))}createImagePreview(r){return new Promise((i,o)=>{const e=new FileReader;e.onload=a=>i(a.target.result),e.onerror=()=>o(new Error("Failed to read file")),e.readAsDataURL(r)})}addImage(r){this.images.push({...r,isPrimary:this.images.length===0}),this.updatePreviewContainer(),this.updateUploadAreaState(),this.updateSelectedFiles()}removeImage(r){const i=this.images.length===1,o=this.images.find(a=>a.id===r),e=o==null?void 0:o.isPrimary;o&&(o.id||o.full||o.compressed)&&this.removedImages.push({id:o.id,full:o.full,compressed:o.compressed}),this.images=this.images.filter(a=>a.id!==r),e&&this.images.length>0&&(this.images[0].isPrimary=!0),this.updatePreviewContainer(),this.updateUploadAreaState(),i&&this.updateSelectedFiles(),this.dispatchEvent(new CustomEvent("images-changed",{detail:{images:this.images},bubbles:!0,composed:!0}))}setPrimaryImage(r){this.images=this.images.map(i=>({...i,isPrimary:i.id===r})),this.updatePreviewContainer(),this.dispatchEvent(new CustomEvent("primary-image-changed",{detail:{imageId:r},bubbles:!0,composed:!0}))}updatePreviewContainer(){const r=this.shadowRoot.querySelector(".preview-container");r.innerHTML="",this.images.forEach((i,o)=>{const e=document.createElement("div");e.className=`image-preview${i.isPrimary?" primary":""}`,e.draggable=!0,e.setAttribute("data-id",i.id),e.innerHTML=`
        <img src="${i.preview}" alt="Image preview">
        ${i.isPrimary?'<div class="primary-label">תמונה ראשית</div>':""}
        <div class="progress-bar">
          <div class="progress-bar__fill"></div>
        </div>
        <div class="image-controls">
          <button class="control-button remove-button">הסר</button>
          ${i.isPrimary?"":'<button class="control-button primary-button">הגדר כראשית</button>'}
        </div>
      `,e.querySelector(".remove-button").addEventListener("click",()=>{this.removeImage(i.id)}),i.isPrimary||e.querySelector(".primary-button").addEventListener("click",()=>{this.setPrimaryImage(i.id)}),r.appendChild(e)}),this.updateSelectedFiles()}updateUploadAreaState(){this.shadowRoot.querySelector(".upload-area").setAttribute("data-disabled",this.images.length>=this.maxImages)}showError(r){const i=this.shadowRoot.querySelector(".error-container");i.textContent=r,i.style.display="block",setTimeout(()=>{i.style.display="none"},5e3)}setImageProgress(r,i){const o=this.shadowRoot.querySelector(`.image-preview[data-id="${r}"]`);if(o){const e=o.querySelector(".progress-bar__fill");e&&(e.style.width=`${i}%`)}}setImageUploading(r,i){const o=this.shadowRoot.querySelector(`.image-preview[data-id="${r}"]`);if(o){o.classList.toggle("uploading",i);const e=o.querySelector(".progress-bar");e&&(e.style.display=i?"block":"none")}}setImageUploaded(r,i){const o=this.images.find(e=>e.id===r);o&&(o.uploadedUrl=i,this.setImageUploading(r,!1))}setImageError(r,i){const o=this.shadowRoot.querySelector(`.image-preview[data-id="${r}"]`);o&&(this.setImageUploading(r,!1),o.classList.add("error"),this.showError(i))}getImages(){return[...this.images]}getRemovedImages(){return[...this.removedImages]}clearImages(){this.images=[],this.removedImages=[],this.updatePreviewContainer(),this.updateUploadAreaState(),this.dispatchEvent(new CustomEvent("images-cleared"))}setMaxImages(r){this.maxImages=r,this.shadowRoot.querySelector(".status-message").textContent=`(מקסימום ${this.maxImages} תמונות, גודל מקסימלי 5MB לתמונה)`,this.updateUploadAreaState()}}customElements.define("image-handler",x);class S extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.recipeData={},this.clearButtonText=this.hasAttribute("clear-button-text")?this.getAttribute("clear-button-text"):"נקה",this.submitButtonText=this.hasAttribute("submit-button-text")?this.getAttribute("submit-button-text"):"שלח מתכון"}async connectedCallback(){this.render(),this.setupEventListeners();const r=this.getAttribute("recipe-id");r&&await this.setRecipeData(r)}render(){this.shadowRoot.innerHTML=`
      <style>${this.styles()}</style>
      ${this.template()}
    `}styles(){return`
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
    `}template(){return`
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
                <option value="breakfast$brunch">ארוחות בוקר</option>
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
    `}setupEventListeners(){this.shadowRoot.getElementById("ingredients-container").addEventListener("click",t=>{t.target.classList.contains("recipe-form__button--add-ingredient")?this.addIngredientLine(t):t.target.classList.contains("recipe-form__button--remove-ingredient")&&this.removeIngredientLine(t)}),this.shadowRoot.getElementById("stages-container").addEventListener("click",t=>{t.target.classList.contains("recipe-form__button--add-step")?this.addStepLine(t):t.target.classList.contains("recipe-form__button--remove-step")?this.removeStepLine(t):t.target.id==="add-stage"?this.addStage(t):t.target.classList.contains("recipe-form__button--remove-stage")&&this.removeStage(t)});const o=this.shadowRoot.getElementById("recipe-images");o.addEventListener("images-changed",t=>{this.validateForm()}),o.addEventListener("primary-image-changed",t=>{this.recipeData.primaryImageId=t.detail.imageId}),this.shadowRoot.querySelector("#recipe-form").addEventListener("submit",t=>{t.preventDefault(),this.validateForm()?(this.collectFormData(),this.dispatchRecipeData()):this.showErrorMessage()}),this.shadowRoot.getElementById("clear-button").addEventListener("click",()=>{this.clearForm(),this.dispatchEvent(new CustomEvent("clear-button-clicked",{bubbles:!0,composed:!0}))})}addIngredientLine(r){const i=this.shadowRoot.querySelector(".recipe-form__ingredients"),e=r.target.closest(".recipe-form__ingredient-entry"),a=document.createElement("div");a.classList.add("recipe-form__ingredient-entry"),a.innerHTML=`
      <input type="text" class="recipe-form__input recipe-form__input--quantity" placeholder="כמות">
      <input type="text" class="recipe-form__input recipe-form__input--unit" placeholder="יחידה">
      <input type="text" class="recipe-form__input recipe-form__input--item" placeholder="פריט">
      <button type="button" class="recipe-form__button recipe-form__button--add-ingredient">+</button>
      <button type="button" class="recipe-form__button recipe-form__button--remove-ingredient">-</button>
    `,i.insertBefore(a,e.nextSibling);const t=i.querySelector(".recipe-form__ingredient-entry");if(!t.querySelector(".recipe-form__button--remove-ingredient")){const s=document.createElement("button");s.type="button",s.classList.add("recipe-form__button","recipe-form__button--remove-ingredient"),s.textContent="-",t.appendChild(s)}}removeIngredientLine(r){const i=r.target.closest(".recipe-form__ingredient-entry"),o=i.closest(".recipe-form__ingredients");i.remove();const e=o.querySelectorAll(".recipe-form__ingredient-entry");if(e.length===1){const a=e[0].querySelector(".recipe-form__button--remove-ingredient");a&&a.remove()}}addStepLine(r){const i=r.target.closest(".recipe-form__steps"),e=r.target.closest(".recipe-form__step"),a=document.createElement("div");a.classList.add("recipe-form__step"),a.innerHTML=`
      <input type="text" class="recipe-form__input">
      <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
      <button type="button" class="recipe-form__button recipe-form__button--remove-step">-</button> 
    `,i.insertBefore(a,e.nextSibling);const t=i.querySelector(".recipe-form__step");if(!t.querySelector(".recipe-form__button--remove-step")){const s=document.createElement("button");s.type="button",s.classList.add("recipe-form__button","recipe-form__button--remove-step"),s.textContent="-",t.appendChild(s)}}removeStepLine(r){const i=r.target.closest(".recipe-form__step"),o=i.closest(".recipe-form__steps");i.remove();const e=o.querySelectorAll(".recipe-form__step");if(e.length===1){const a=e[0].querySelector(".recipe-form__button--remove-step");a&&a.remove()}}addStage(r){const i=this.shadowRoot.getElementById("stages-container"),o=i.querySelectorAll(".recipe-form__steps").length;let e=[];if(o===1){const s=i.querySelector(".recipe-form__steps");e=Array.from(s.querySelectorAll('.recipe-form__step input[type="text"]')).map(n=>n.value.trim())}const a=document.createElement("div");a.classList.add("recipe-form__steps"),this.convertToStageFormat(a,o+1);const t=this.shadowRoot.getElementById("add-stage");if(i.insertBefore(a,t),e.length>0){const s=i.querySelector(".recipe-form__steps");s.innerHTML="",this.convertToStageFormat(s,1),e.forEach((n,l)=>{l>0&&this.addStepLine({target:s.querySelector(".recipe-form__button--add-step")}),s.querySelectorAll('.recipe-form__step input[type="text"]')[l].value=n})}a.querySelectorAll(".recipe-form__step").length===0&&this.addStepLine({target:a.querySelector(".recipe-form__button--add-step")})}convertToStageFormat(r,i){const o=r.innerHTML;r.innerHTML=`
      <div class="recipe-form__stage-header">
        <h3 class="recipe-form__stage-title">שלב ${i}</h3>
        <button type="button" class="recipe-form__button recipe-form__button--remove-stage">-</button>
      </div>
      <input type="text" class="recipe-form__input recipe-form__input--stage-name" placeholder="שם השלב (אופציונלי)">
      ${o||`
        <fieldset class="recipe-form__step">
          <input type="text" name="steps" class="recipe-form__input">
          <button type="button" class="recipe-form__button recipe-form__button--add-step">+</button>
        </fieldset>
      `}
    `}removeStage(r){const i=this.shadowRoot.getElementById("stages-container"),o=r.target.closest(".recipe-form__steps");if(o){let e=[];const a=i.querySelectorAll(".recipe-form__steps").length;if(a===2&&(e=Array.from(o.querySelectorAll('.recipe-form__step input[type="text"]')).map(t=>t.value.trim())),o.remove(),a===2&&e.length>0){const t=i.querySelector(".recipe-form__steps"),s=t.querySelector(".recipe-form__button--add-stage"),n=t.querySelector(".recipe-form__button--remove-stage"),l=t.querySelector(".recipe-form__stage-header"),c=t.querySelector(".recipe-form__input--stage-name");s&&s.remove(),n&&n.remove(),l&&l.remove(),c&&c.remove()}this.updateStageNumbers()}}updateStageNumbers(){this.shadowRoot.querySelectorAll(".recipe-form__steps").forEach((i,o)=>{const e=i.querySelector(".recipe-form__stage-title");e&&(e.textContent=`שלב ${o+1}`)})}validateForm(){this.collectFormData();const{isValid:r,errors:i}=w(this.recipeData);this.shadowRoot.querySelectorAll(".recipe-form__input, .recipe-form__select, .recipe-form__textarea").forEach(e=>{e.classList.remove("recipe-form__input--invalid")});const o=this.shadowRoot.querySelector(".recipe-form__error-message");if(r)o.style.display="none";else{let e="ישנם שגיאות בטופס. אנא תקן אותן.";i&&(Object.keys(i).forEach(a=>{if(a.startsWith("ingredients[")){const t=a.match(/ingredients\[(\d+)\]\.(\w+)/);if(t){const s=parseInt(t[1],10),n=t[2],l=this.shadowRoot.querySelectorAll(".recipe-form__ingredient-entry")[s];if(l){const c=l.querySelector(`.recipe-form__input--${n}`);c&&c.classList.add("recipe-form__input--invalid")}}}else if(a.startsWith("instructions[")){const t=a.match(/instructions\[(\d+)\]/);if(t){const s=parseInt(t[1],10),n=this.shadowRoot.querySelectorAll('.recipe-form__stages input[type="text"]')[s];n&&n.classList.add("recipe-form__input--invalid")}}else if(a.startsWith("stages[")){const t=a.match(/stages\[(\d+)\](?:\.(\w+))?/);if(t){const s=parseInt(t[1],10),n=t[2],l=this.shadowRoot.querySelectorAll(".recipe-form__steps")[s];if(l&&n==="title"){const c=l.querySelector(".recipe-form__input--stage-name");c&&c.classList.add("recipe-form__input--invalid")}l&&n==="instructions"&&l.querySelectorAll('input[type="text"]').forEach(c=>{c.classList.add("recipe-form__input--invalid")})}}else{const s={name:"name",category:"dish-type",prepTime:"prep-time",waitTime:"wait-time",servings:"servings-form",difficulty:"difficulty",mainIngredient:"main-ingredient",tags:"tags",comments:"comments"}[a];if(s){const n=this.shadowRoot.getElementById(s);n&&n.classList.add("recipe-form__input--invalid")}}}),e=Object.values(i).join(" ")),o.textContent=e,o.style.display="block"}return r}collectFormData(){this.recipeData={name:this.shadowRoot.getElementById("name").value.trim(),category:this.shadowRoot.getElementById("dish-type").value,prepTime:parseInt(this.shadowRoot.getElementById("prep-time").value),waitTime:parseInt(this.shadowRoot.getElementById("wait-time").value),difficulty:this.shadowRoot.getElementById("difficulty").value,mainIngredient:this.shadowRoot.getElementById("main-ingredient").value,tags:this.shadowRoot.getElementById("tags").value.split(",").map(t=>t.trim()),servings:parseInt(this.shadowRoot.getElementById("servings-form").value),ingredients:[],approved:!1},this.shadowRoot.querySelectorAll(".recipe-form__ingredient-entry").forEach(t=>{this.recipeData.ingredients.push({amount:t.querySelector(".recipe-form__input--quantity").value.trim(),unit:t.querySelector(".recipe-form__input--unit").value.trim(),item:t.querySelector(".recipe-form__input--item").value.trim()})});const r=this.shadowRoot.querySelectorAll(".recipe-form__steps");r.length>1?(this.recipeData.stages=[],r.forEach((t,s)=>{const n=t.querySelector(".recipe-form__input--stage-name"),c={title:n?n.value.trim():`שלב ${s+1}`,instructions:Array.from(t.querySelectorAll('.recipe-form__step input[type="text"]')).map(d=>d.value.trim())};this.recipeData.stages.push(c)})):this.recipeData.instructions=Array.from(this.shadowRoot.querySelector(".recipe-form__stages").querySelectorAll('input[type="text"]')).map(t=>t.value.trim());const i=this.shadowRoot.getElementById("recipe-images"),o=i.getImages(),e=typeof i.getRemovedImages=="function"?i.getRemovedImages():[];this.recipeData.images=o.map(t=>{var s;return t.file?{file:t.file,isPrimary:t.isPrimary,access:"public",uploadedBy:((s=_.getCurrentUser())==null?void 0:s.uid)||"anonymous",source:"new"}:{id:t.id,isPrimary:t.isPrimary,full:t.full,compressed:t.compressed,access:t.access,uploadedBy:t.uploadedBy,fileName:t.fileName,uploadTimestamp:t.uploadTimestamp,source:"existing"}}),this.recipeData.toDelete=e;const a=this.shadowRoot.getElementById("comments").value.trim();a&&(this.recipeData.comments=[a])}dispatchRecipeData(){const r=new CustomEvent("recipe-data-collected",{detail:{recipeData:this.recipeData},bubbles:!0,composed:!0});this.dispatchEvent(r)}clearForm(){this.shadowRoot.querySelectorAll("input").forEach(s=>{s.value="",s.classList.remove("recipe-form__input--invalid")}),this.shadowRoot.querySelectorAll("select").forEach(s=>{s.selectedIndex=0,s.classList.remove("recipe-form__input--invalid")}),this.shadowRoot.querySelectorAll("textarea").forEach(s=>{s.value="",s.classList.remove("recipe-form__input--invalid")}),this.shadowRoot.querySelector(".recipe-form__ingredients").querySelectorAll(".recipe-form__ingredient-entry").forEach((s,n)=>{if(n===0){s.querySelector(".recipe-form__input--quantity").value="",s.querySelector(".recipe-form__input--unit").value="",s.querySelector(".recipe-form__input--item").value="";const l=s.querySelector("button");l.textContent="+",l.classList.remove("recipe-form__button--remove-ingredient"),l.classList.add("recipe-form__button--add-ingredient")}else s.remove()}),this.shadowRoot.getElementById("stages-container").querySelectorAll(".recipe-form__steps").forEach((s,n)=>{if(n===0){s.querySelectorAll(".recipe-form__step").forEach((p,f)=>{if(f===0){p.querySelector('input[type="text"]').value="";const m=p.querySelector("button");m.textContent="+",m.classList.remove("recipe-form__button--remove-step"),m.classList.add("recipe-form__button--add-step")}else p.remove()});const c=s.querySelector(".recipe-form__stage-header");c&&c.remove();const d=s.querySelector(".recipe-form__input--stage-name");d&&d.remove()}else s.remove()}),this.shadowRoot.getElementById("recipe-images").clearImages(),this.shadowRoot.getElementById("recipe-form").reset();const t=this.shadowRoot.querySelector(".recipe-form__error-message");t&&(t.style.display="none")}async setRecipeData(r){try{const i=h(),o=await v(b(i,"recipes",r));if(o.exists()){const e=o.data();this.recipeData=e,this.shadowRoot.getElementById("name").value=e.name,this.shadowRoot.getElementById("dish-type").value=e.category,this.shadowRoot.getElementById("prep-time").value=e.prepTime,this.shadowRoot.getElementById("wait-time").value=e.waitTime,this.shadowRoot.getElementById("servings-form").value=e.servings,this.shadowRoot.getElementById("difficulty").value=e.difficulty,this.shadowRoot.getElementById("main-ingredient").value=e.mainIngredient,this.shadowRoot.getElementById("tags").value=e.tags.join(", "),this.shadowRoot.getElementById("comments").value=e.comments?e.comments.join(`
`):"";const a=this.shadowRoot.querySelector(".recipe-form__ingredients");a.querySelectorAll(".recipe-form__ingredient-entry").forEach((s,n)=>{n>0&&s.remove()}),e.ingredients.forEach((s,n)=>{const c=a.querySelectorAll(".recipe-form__ingredient-entry")[n];if(n<e.ingredients.length-1){const d=c.querySelector(".recipe-form__button--add-ingredient");d&&this.addIngredientLine({target:d})}c&&(c.querySelector(".recipe-form__input--quantity").value=s.amount,c.querySelector(".recipe-form__input--unit").value=s.unit,c.querySelector(".recipe-form__input--item").value=s.item)});const t=this.shadowRoot.getElementById("stages-container");if(t.querySelectorAll(".recipe-form__steps").forEach((s,n)=>{n>0&&s.remove()}),e.stages&&e.stages.length>0)e.stages.forEach((s,n)=>{n<e.stages.length-1&&this.addStage({target:t.querySelector(".recipe-form__button--add-stage")});const l=t.querySelectorAll(".recipe-form__steps")[n],c=l.querySelector(".recipe-form__input--stage-name");c&&(c.value=s.title||""),s.instructions.forEach((d,p)=>{p>0&&this.addStepLine({target:l.querySelectorAll(".recipe-form__button--add-step")[p-1]}),l.querySelectorAll('.recipe-form__step input[type="text"]')[p].value=d})});else{const s=t.querySelector(".recipe-form__steps");for(let l=0;l<e.instructions.length-1;l++){const c=s.querySelectorAll(".recipe-form__button--add-step");c.length>0&&this.addStepLine({target:c[c.length-1]})}const n=s.querySelectorAll('.recipe-form__step input[type="text"]');e.instructions.forEach((l,c)=>{n[c]&&(n[c].value=l)})}e.images&&await this.populateImages(e.images,e.category),this.updateStageNumbers()}else console.warn("No such document!")}catch(i){console.error("Error fetching recipe:",i)}}async populateImages(r,i){const o=this.shadowRoot.getElementById("recipe-images");for(const e of r)try{const a=e.compressed?await u(e.compressed):e.full?await u(e.full):null;a&&o.addImage({file:null,preview:a,id:e.id,isPrimary:e.isPrimary,full:e.full,compressed:e.compressed,access:e.access,uploadedBy:e.uploadedBy,fileName:e.fileName,uploadTimestamp:e.uploadTimestamp,source:"existing"})}catch(a){console.error("Error loading image:",a)}}showErrorMessage(r){}}customElements.define("recipe-form-component",S);
