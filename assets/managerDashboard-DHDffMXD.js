const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-controller-B2mcsM-8.js","assets/sw-register-nWNmA_5D.js","assets/sw-register-CsuhpVXX.css","assets/auth-avatar-BhsXcPk7.js","assets/auth-content-DLM3Yd_8.js","assets/login-form-hXhtH-WN.js","assets/message-modal-BCf8-UxT.js","assets/modal-CJCcv8_f.js","assets/signup-form-C5UqCACI.js","assets/forgot-password-ka97TXr_.js","assets/user-profile-Drzji1yT.js","assets/image_approval-Dfu4YK8M.js","assets/recipe-image-utils-BxyJQeAp.js","assets/image-carousel-gh5zOnk4.js","assets/recipe-ingredients-utils-z11E7uy4.js"])))=>i.map(i=>d[i]);
import{a as I,F as c,i as E,_ as d,f as x}from"./sw-register-nWNmA_5D.js";import"./navigation-script-6EMbmBri.js";import"./image-carousel-gh5zOnk4.js";import{S as l,u as R,h,i as k,r as C}from"./recipe-image-utils-BxyJQeAp.js";import"./message-modal-BCf8-UxT.js";import"./recipe_form_component-Dq5_mSIT.js";import"./modal-CJCcv8_f.js";import"./recipe-ingredients-utils-z11E7uy4.js";document.addEventListener("DOMContentLoaded",function(){I.addAuthObserver(e=>{const o=window.location.pathname.includes("My-Cook-Book")?"/My-Cook-Book/":"/";e.user?W(e.user).then(function(t){t?L():window.location.href=o}):window.location.href=o});const i=document.querySelector("image-approval-component");i.addEventListener("image-approved",z),i.addEventListener("image-rejected",U)});function L(){S(),m(),g(),v()}function S(){c.queryDocuments("users").then(i=>{const e=document.getElementById("user-list"),o=i.map(t=>({header:A(t.email),content:M(t)}));e.setItems(o)}).catch(p)}function A(i){const e=document.createElement("div");return e.textContent=i,e}function M(i){const e=document.createElement("div"),o=document.createElement("select");o.innerHTML=`
      <option value="user" ${i.role==="user"?"selected":""}>User</option>
      <option value="approved" ${i.role==="approved"?"selected":""}>approved</option>
      <option value="manager" ${i.role==="manager"?"selected":""}>Manager</option>
  `;const t=document.createElement("button");t.textContent="שמור",t.addEventListener("click",()=>_(i.id,o.value));const r=document.createElement("div");return r.style.width="20px",e.appendChild(o),e.appendChild(r),e.appendChild(t),e}function _(i,e){c.updateDocument("users",i,{role:e}).then(()=>N("תפקיד המשתמש עודכן בהצלחה")).catch(p)}function m(){document.getElementById("all-recipes-list").setItems([]);const e=document.getElementById("recipe-search"),o=document.getElementById("recipe-filter");let t=[];c.queryDocuments("recipes",{where:[["approved","==",!0]]}).then(r=>{t=r,y(t),$(t)}).catch(p),e.addEventListener("input",()=>b(t)),o.addEventListener("change",()=>b(t))}function y(i){const e=document.getElementById("all-recipes-list"),o=i.map(t=>({header:t.name,content:P(t)}));e.setItems(o)}const u={appetizers:"מנות ראשונות","main-courses":"מנות עיקריות","side-dishes":"תוספות","soups-stews":"מרקים ותבשילים",salads:"סלטים","breakfast-brunch":"ארוחות בוקר",snacks:"חטיפים",beverages:"משקאות",desserts:"קינוחים"},D=Object.fromEntries(Object.entries(u).map(([i,e])=>[e,i]));function P(i){const e=document.createElement("div");return e.innerHTML=`
      <p>קטגוריה: ${u[i.category]}</p>
      <p>זמן הכנה: ${i.prepTime+i.waitTime} דקות</p>
      <button class="edit-recipe" data-id="${i.id}">ערוך</button>
  `,e.querySelector(".edit-recipe").addEventListener("click",()=>T(i)),e}function T(i){const e=document.querySelector(".edit-preview-container");e.innerHTML="",e.innerHTML=`
    <edit-preview-recipe
      path-to-icon="/img/icon/other/"
      recipe-id="${i.id}" 
      start-mode="edit">
    </edit-preview-recipe>
  `;const o=document.querySelector("edit-preview-recipe");setTimeout(()=>{o.openModal()},100)}function b(i){const e=document.getElementById("recipe-search").value.toLowerCase(),o=document.getElementById("recipe-filter").value,t=i.filter(r=>r.name.toLowerCase().includes(e)&&(o===""||r.category===D[o]));y(t)}function $(i){const e=document.getElementById("recipe-filter");[...new Set(i.map(t=>u[t.category]))].forEach(t=>{const r=document.createElement("option");r.value=t,r.textContent=t,e.appendChild(r)})}function g(){const i=document.getElementById("pending-recipes-list");c.queryDocuments("recipes",{where:[["approved","==",!1]]}).then(e=>{const o=e.map(t=>({header:q(t),content:B()}));if(o.length==0){const t=document.getElementById("pending-recipes");t.querySelector(".no-pending-message").textContent="אין מתכונים הממתינים לאישור"}i?i.setItems(o):console.error("Cannot find scrolling list element")}).catch(p)}function q(i){const e=document.createElement("div");return e.style.display="flex",e.style.justifyContent="space-between",e.style.alignItems="center",e.innerHTML=`
    <span>${i.name} | ${u[i.category]||"No category"}</span>
    <button class="preview-recipe" data-id="${i.id}">הצג</button>
  `,e}function B(i){const e=document.createElement("div");return e.textContent="Full recipe details will be shown in the preview modal.",e}const f=document.getElementById("pending-recipes-list");f.addEventListener("scrolling-list-ready",()=>{const i=f.shadowRoot;i?i.addEventListener("click",e=>{if(e.target.classList.contains("preview-recipe")){const o=e.target.getAttribute("data-id");j(o)}}):console.error("Shadow root not found!")});function j(i){console.log(`Preview recipe with id: ${i}`);const e=document.querySelector(".preview-recipe-container");e.innerHTML=`
  <recipe-preview-modal id="recipe-preview" recipe-id="${i}" recipe-name="Delicious Cake" show-buttons="true">
  `,customElements.whenDefined("recipe-preview-modal").then(()=>{const o=document.querySelector("recipe-preview-modal");o.openModal(),o.addEventListener("recipe-approved",t=>{console.log("Recipe approved:",t.detail.recipeId),g(),m()}),o.addEventListener("recipe-rejected",t=>{console.log("Recipe rejected:",t.detail.recipeId),setTimeout(()=>{g(),m()},600)})})}async function v(){const i=document.getElementById("pending-images-list");i.setItems([]);try{const t=(await c.queryDocuments("recipes",{where:[["pendingImage","!=",null]]})).map(r=>({recipeId:r.id,recipeName:r.name,imageUrl:r.pendingImage.full})).map(r=>({header:F(r),content:H(r)}));if(t.length==0){const r=document.getElementById("pending-images");r.querySelector(".no-pending-message").textContent="אין תמונות הממתינות לאישור"}i?i.setItems(t):console.error("Cannot find pending images list element")}catch(e){p(e)}}function F(i){const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="space-between",e.style.alignItems="center";const o=document.createElement("span");o.innerHTML=`${i.recipeName}`;const t=document.createElement("button");return t.classList.add("preview-image"),t.setAttribute("data-url",`${i.imageUrl}`),t.setAttribute("data-recipe-id",`${i.recipeId}`),t.textContent="הצג",t.addEventListener("click",function(r){r.preventDefault();const s=this.getAttribute("data-url"),a=this.getAttribute("data-recipe-id");O(s,a,i.recipeName)}),e.appendChild(o),e.appendChild(t),e}function H(i){const e=document.createElement("div");return e.textContent="Image preview will be shown in the modal.",e}function O(i,e,o){const t={recipeId:e,imageUrl:i,recipeName:o};document.querySelector("image-approval-component").openModalForImage(t)}function z(i){console.log("Image approved for recipe:",i.detail.recipeId),v(),m()}function U(i){console.log("Image rejected for recipe:",i.detail.recipeId),v()}function N(i){alert(i)}function p(i){console.error("Error:",i),alert("אירעה שגיאה. אנא נסה שנית.")}function W(i){return c.getDocument("users",i.uid).then(e=>e?e.role==="manager":!1)}class G extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.items=[],this.displayedItems=[],this.batchSize=20,this.expandableItems=!1,this.intersectionObserver=null,this.isLoading=!1}static get observedAttributes(){return["height","width","expandable-items","header-background-color","header-text-color","content-background-color","content-text-color"]}attributeChangedCallback(e,o,t){if(o!==t)switch(e){case"height":this.style.setProperty("--list-height",t);break;case"width":this.style.setProperty("--list-width",t);break;case"expandable-items":this.expandableItems=t==="true",this.render();break;case"header-background-color":this.style.setProperty("--header-background-color",t);break;case"header-text-color":this.style.setProperty("--header-text-color",t);break;case"content-background-color":this.style.setProperty("--content-background-color",t);break;case"content-text-color":this.style.setProperty("--content-text-color",t);break}}connectedCallback(){this.render(),this.setupEventListeners(),this.setupIntersectionObserver(),this.dispatchEvent(new CustomEvent("scrolling-list-ready"))}render(){this.shadowRoot.innerHTML=`
      <style>
        ${this.styles()}
      </style>
      ${this.template()}
    `,this.listContainer=this.shadowRoot.querySelector(".list-container")}styles(){return`
      :host {
        display: block;
        width: var(--list-width, 100%);
        height: var(--list-height, 400px);
        --header-background-color: var(--header-background-color, #f0f0f0);
        --header-text-color: var(--header-text-color, #000000);
        --content-background-color: var(--content-background-color, #ffffff);
        --content-text-color: var(--content-text-color, #000000);
      }
      
      .scrolling-list {
        height: 100%;
        overflow-y: auto;
      }
      .list-item {
        border-bottom: 1px solid #ccc;
        
      }
      .list-item-header {
        padding: 10px;
        background-color: var(--header-background-color);
        color: var(--header-text-color);
      }
      .expandable .list-item-header {
        cursor: pointer;
      }
      .list-item-content {
        display: none;
        padding: 10px;
        background-color: var(--content-background-color);
        color: var(--content-text-color);
      }
      .list-item.expanded .list-item-content {
        display: block;
      }
      #sentinel {
        height: 1px;
      }
    `}template(){return`
      <div class="scrolling-list ${this.expandableItems?"expandable":""}">
        <div class="list-container"></div>
        <div id="sentinel"></div>
      </div>
    `}setupEventListeners(){this.expandableItems&&this.listContainer.addEventListener("click",e=>{const o=e.target.closest(".list-item-header");o&&o.closest(".list-item").classList.toggle("expanded")})}setupIntersectionObserver(){const e={root:this.shadowRoot.querySelector(".scrolling-list"),rootMargin:"100px",threshold:.1};this.intersectionObserver=new IntersectionObserver(t=>{t[0].isIntersecting&&!this.isLoading&&this.loadMoreItems()},e);const o=this.shadowRoot.querySelector("#sentinel");this.intersectionObserver.observe(o)}loadMoreItems(){if(this.isLoading||this.displayedItems.length>=this.items.length)return;this.isLoading=!0;const e=this.displayedItems.length,o=Math.min(e+this.batchSize,this.items.length),t=this.items.slice(e,o);this.displayedItems=[...this.displayedItems,...t],this.renderNewItems(t),this.isLoading=!1}renderNewItems(e){const o=document.createDocumentFragment();e.forEach(t=>{const r=document.createElement("div");r.classList.add("list-item");const s=typeof t.header=="string"?t.header:"",a=typeof t.content=="string"?t.content:"";r.innerHTML=`
        <div class="list-item-header">${s}</div>
        <div class="list-item-content">${a}</div>
      `,typeof t.header!="string"&&r.querySelector(".list-item-header").appendChild(t.header),typeof t.content!="string"&&r.querySelector(".list-item-content").appendChild(t.content),o.appendChild(r)}),this.listContainer.appendChild(o)}setItems(e){this.items=e,this.displayedItems=[],this.listContainer.innerHTML="",this.loadMoreItems()}}customElements.define("scrolling-list",G);class V extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.recipeId=this.getAttribute("recipe-id"),this.render(),this.formComponent=this.shadowRoot.querySelector("recipe-form-component"),this.formComponent.addEventListener("recipe-data-collected",this.handleRecipeData.bind(this)),this.formComponent.addEventListener("clear-button-clicked",this.resetFormToCurrentData.bind(this))}render(){this.shadowRoot.innerHTML=`
          <style>
              /* Add your component-specific styles here */
          </style>
          <div class="edit-recipe-container">
              <recipe-form-component clear-button-text="איפוס" submit-button-text="שמור שינויים" recipe-id="${this.recipeId}"></recipe-form-component>
              <message-modal></message-modal>
          </div>
      `}async handleRecipeData(e){const o=e.detail.recipeData;try{if(Array.isArray(o.toDelete))for(const n of o.toDelete)n.full&&await l.deleteFile(n.full).catch(()=>{}),n.compressed&&await l.deleteFile(n.compressed).catch(()=>{});const t=[];for(const n of o.images)if(n.source==="new"&&n.file){const w=await R({recipeId:this.recipeId,category:o.category,file:n.file,isPrimary:n.isPrimary,uploadedBy:n.uploadedBy});t.push(w)}else n.source==="existing"&&t.push({id:n.id,full:n.full,compressed:n.compressed,isPrimary:n.isPrimary,access:n.access,uploadedBy:n.uploadedBy,fileName:n.fileName,uploadTimestamp:n.uploadTimestamp});const{images:r,toDelete:s,...a}=o;console.log("Images to upload:",t),console.log("Uploading recipe:",{...a,images:t}),await c.updateDocument("recipes",this.recipeId,{...a,images:t}),this.showSuccessMessage("Recipe updated successfully!")}catch(t){this.showErrorMessage(`Error updating recipe: ${t}`)}}async updateRecipeInFirestore(e,o){const{imageFile:t,...r}=o;await c.updateDocument("recipes",e,r),console.log("Recipe updated in Firestore with ID:",e)}async uploadImage(e,o,t,r=null){if(r&&r!==t)try{const s=h(this.recipeId,o,r,"full"),a=h(this.recipeId,o,r,"compressed");await l.deleteFile(s),await l.deleteFile(a),console.log("Removed old images from Firebase Storage")}catch(s){console.error("Error removing old images:",s)}try{const s=h(this.recipeId,o,t,"full"),a=h(this.recipeId,o,t,"compressed"),n=await k(e);await l.uploadFile(n,a),console.log("Uploaded compressed image to Firebase Storage"),await l.uploadFile(e,s),console.log("Uploaded full-size image to Firebase Storage")}catch(s){console.error("Error uploading new images:",s)}}showSuccessMessage(e){this.shadowRoot.querySelector("message-modal").show(e,"Success!")}showErrorMessage(e,o){this.shadowRoot.querySelector("message-modal").show(e,"Error!")}resetFormToCurrentData(){this.formComponent.setRecipeData(this.recipeId)}}customElements.define("edit-recipe-component",V);class J extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.recipeId=this.getAttribute("recipe-id"),this.showButtons=!1,this.recipeName=this.getAttribute("recipe-name"),this.mode=this.getAttribute("start-mode")||"preview",this.path="/My-Cook-Book/img/icon/other/",this.render(),this.modal=this.shadowRoot.querySelector("custom-modal"),this.setupModeToggle(),this.handleResize(),window.addEventListener("resize",this.handleResize)}render(){this.shadowRoot.innerHTML=`
      <style>
        ${this.styles()}
      </style>
      ${this.template()}
    `}styles(){return`      
      .recipe-preview-modal .modal-content {
        outline: 1px solid black;
        border-radius: 10px;
        background-color: transparent;
        overflow-y: auto; /* Add vertical scroll to the modal content */
        margin-bottom: 20px;
      }

      .modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
      }

      .modal-content {
        background-color: #fefefe;
        padding: 20px;
        border: 1px solid #888;
        width: 90%;
        flex-grow: 1;
      }

      .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
      }

      .close:hover,
      .close:focus {
        color: black;
        text-decoration: none;
        cursor: pointer;
      }

      .modal-buttons {
        display: flex;
        justify-content: space-around;
        margin-top: 10px;
        margin-bottom: 10px;
        gap: 10px;
      }

      .modal-buttons button { 
        padding: 12px;
        width: 100%;
        background-color: var(--primary-color, #bb6016);
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      .modal-buttons button:hover {
        background-color: var(--primary-hover, #5c4033);
      }

      .modal-buttons button#approve-button {
        background-color: var(--success-color, #4CAF50); /* Green for Approve */
      }

      .modal-buttons button#approve-button:hover {
        background-color: var(--success-hover, #45a049); /* Darker green on hover */
      }

      .modal-buttons button#reject-button {
        background-color: var(--error-color, #f44336); /* Red for Reject */
      }

      .modal-buttons button#reject-button:hover {
        background-color: var(--error-hover, #d32f2f); /* Darker red on hover */
      }

      .mode-toggle {
        position: absolute;
        top: 10px; /* Adjust as needed */
        left: 10px; /* Adjust as needed */
        background: none; /* Remove button background */
        border: none; /* Remove button border */
        padding: 5px; /* Adjust as needed */
        cursor: pointer; /* Show pointer cursor on hover */
      }

      .toggle-icon {
        height: 20px;
        width: 20px;
      }
    `}template(){return`
      <div class="recipe-preview-modal">
        <custom-modal height="90vh" width="60vw">
          <button class="mode-toggle">
            ${this.mode==="preview"?`<img src="${this.path}pencil.png" class="toggle-icon">`:`<img src="${this.path}eye.png" class="toggle-icon">`} 
          </button>
          <h3> Recipe Preview </h3>
          <div class="modal-content">
            ${this.mode==="preview"?`<recipe-component recipe-id="${this.recipeId}"></recipe-component>`:`<edit-recipe-component recipe-id="${this.recipeId}"></edit-recipe-component>`}          
          </div>
        </custom-modal>
      </div>
    `}setupModeToggle(){const e=this.shadowRoot.querySelector(".mode-toggle"),o=this.shadowRoot.querySelector(".modal-content"),t=this.shadowRoot.querySelector(".toggle-icon");e.addEventListener("click",r=>{if(console.log("another click"),this.mode==="preview"){this.mode="edit";const s=o.querySelector("recipe-component");s&&o.removeChild(s);const a=document.createElement("edit-recipe-component");a.setAttribute("recipe-id",this.recipeId),o.appendChild(a),t.src=this.path+"eye.png"}else{this.mode="preview";const s=o.querySelector("edit-recipe-component");s&&o.removeChild(s);const a=document.createElement("recipe-component");a.setAttribute("recipe-id",this.recipeId),o.appendChild(a),t.src=this.path+"pencil.png"}})}openModal(){this.modal.open()}closeModal(){this.modal.close()}handleError(e){}handleResize(){this.shadowRoot.querySelector("custom-modal"),window.innerWidth<768?(this.modal.setHeight("100vh"),this.modal.setWidth("100vw")):(this.modal.setHeight("90vh"),this.modal.setWidth("60vw"))}}customElements.define("edit-preview-recipe",J);class K extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.isLoading=!1}connectedCallback(){this.recipeId=this.getAttribute("recipe-id"),this.showButtons=this.getAttribute("show-buttons")==="true",this.recipeName=this.getAttribute("recipe-name"),this.render(),this.modal=this.shadowRoot.querySelector("custom-modal"),this.modal.setAttribute("modal-title",`Preview: ${this.recipeName}`),this.shadowRoot.querySelector("recipe-component").setAttribute("recipe-id",this.recipeId),this.setupButtons()}render(){this.shadowRoot.innerHTML=`
      <style>
        ${this.styles()}
      </style>
      ${this.template()}
    `}styles(){return`
      .recipe-preview-modal .modal-content {
        max-width: 600px;
        outline: 1px solid black;
        border-radius: 10px;
        background-color: transparent;
        overflow-y: auto; /* Add vertical scroll to the modal content */
        margin-bottom: 20px;
      }

      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
      }

      .modal-content {
        background-color: #fefefe;
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
        flex-grow: 1;
      }

      .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
      }

      .close:hover,
      .close:focus {
        color: black;
        text-decoration: none;
        cursor: pointer;
      }

      .modal-buttons {
        display: flex;
        justify-content: space-around;
        margin-top: 10px;
        margin-bottom: 10px;
        gap: 10px;
      }

      .modal-buttons button { 
        padding: 12px;
        width: 100%;
        background-color: var(--primary-color, #bb6016);
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      .modal-buttons button:hover {
        background-color: var(--primary-hover, #5c4033);
      }

      .modal-buttons button#approve-button {
        background-color: var(--success-color, #4CAF50); /* Green for Approve */
      }

      .modal-buttons button#approve-button:hover {
        background-color: var(--success-hover, #45a049); /* Darker green on hover */
      }

      .modal-buttons button#reject-button {
        background-color: var(--error-color, #f44336); /* Red for Reject */
      }

      .modal-buttons button#reject-button:hover {
        background-color: var(--error-hover, #d32f2f); /* Darker red on hover */
      }

      .loading-overlay {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .loading-overlay.active {
        display: flex;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error-message {
        color: var(--error-color, #f44336);
        margin: 10px 0;
        text-align: center;
        display: none;
      }
    `}template(){return`
      <div class="recipe-preview-modal">
        <custom-modal height="90vh" width="60vw">
          <div class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
          <div class="error-message"></div
          <h3> Recipe Preview </h3>
          <div class="modal-content">
            <recipe-component recipe-id="${this.recipeId}"></recipe-component>
          </div>
          <div class="modal-buttons" id="modal-buttons">
            <button id="reject-button">דחה</button>
            <button id="approve-button">אשר</button>
          </div>
        </custom-modal>
      </div>
    `}setupButtons(){const e=this.shadowRoot.getElementById("modal-buttons");if(!this.showButtons){e.style.display="none";return}const o=this.shadowRoot.getElementById("approve-button"),t=this.shadowRoot.getElementById("reject-button");o.addEventListener("click",()=>this.handleApproveClick()),t.addEventListener("click",()=>this.handleRejectClick())}setLoading(e){this.isLoading=e;const o=this.shadowRoot.querySelector(".loading-overlay"),t=this.shadowRoot.getElementById("approve-button"),r=this.shadowRoot.getElementById("reject-button");e?(o.classList.add("active"),t==null||t.setAttribute("disabled","true"),r==null||r.setAttribute("disabled","true")):(o.classList.remove("active"),t==null||t.removeAttribute("disabled"),r==null||r.removeAttribute("disabled"))}showError(e){const o=this.shadowRoot.querySelector(".error-message");o.textContent=e,o.style.display="block",setTimeout(()=>{o.style.display="none"},5e3)}async handleApproveClick(){if(!this.isLoading)try{this.setLoading(!0),await this.handleRecipeApproval(this.recipeId),this.dispatchEvent(new CustomEvent("recipe-approved",{detail:{recipeId:this.recipeId},bubbles:!0,composed:!0})),this.modal.close()}catch(e){console.error("Error approving recipe:",e),this.showError("אירעה שגיאה באישור המתכון. אנא נסה שנית."),this.setLoading(!1)}}async handleRejectClick(){if(!this.isLoading)try{this.setLoading(!0),await this.handleRecipeRejection(this.recipeId),this.dispatchEvent(new CustomEvent("recipe-rejected",{detail:{recipeId:this.recipeId},bubbles:!0,composed:!0})),this.modal.close()}catch(e){console.error("Error rejecting recipe:",e),this.showError("אירעה שגיאה בדחיית המתכון. אנא נסה שנית."),this.setLoading(!1)}}openModal(){this.modal.open()}closeModal(){this.modal.close()}async handleRecipeApproval(e){await c.updateDocument("recipes",e,{approved:!0})}async handleRecipeRejection(e){try{await C(e),await c.deleteDocument("recipes",e)}catch(o){throw console.error("Error in handleRecipeRejection:",o),new Error("Failed to reject recipe: "+o.message)}}}customElements.define("recipe-preview-modal",K);E(x);d(()=>import("./auth-controller-B2mcsM-8.js"),__vite__mapDeps([0,1,2]));d(()=>import("./auth-content-DLM3Yd_8.js"),[]);d(()=>import("./auth-avatar-BhsXcPk7.js"),__vite__mapDeps([3,1,2,4]));d(()=>import("./login-form-hXhtH-WN.js"),__vite__mapDeps([5,4,6,7]));d(()=>import("./signup-form-C5UqCACI.js"),__vite__mapDeps([8,4,6,7]));d(()=>import("./forgot-password-ka97TXr_.js"),__vite__mapDeps([9,4,6,7]));d(()=>import("./user-profile-Drzji1yT.js"),__vite__mapDeps([10,4,6,7,1,2]));d(()=>import("./image_approval-Dfu4YK8M.js"),__vite__mapDeps([11,1,2,12]));d(()=>import("./image-carousel-gh5zOnk4.js"),__vite__mapDeps([13,1,2,12,14]));
