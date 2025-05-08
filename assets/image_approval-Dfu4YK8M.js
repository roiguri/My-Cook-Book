import"./sw-register-nWNmA_5D.js";import{m as o,n as a}from"./recipe-image-utils-BxyJQeAp.js";class i extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.imageData=null}connectedCallback(){this.render(),this.setupEventListeners()}render(){this.shadowRoot.innerHTML=`
      <style>${this.styles()}</style>
      <custom-modal height="auto">
        <h2>אישור תמונה</h2>
        <div id="recipe-info" class="recipe-info"></div>
        <div id="image-container" class="image-container"></div>
        <div class="buttons">
          <button id="approve-button" class="base-button approve-button">אשר</button>
          <button id="reject-button" class="base-button reject-button">דחה</button>
        </div>
      </custom-modal>
    `}styles(){return`
      .image-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
      }

      h2 {
        margin: 0;
      }
      
      .image-container img {
        max-width: 100%;
        max-height: 300px;
        border-radius: 10px;
      }
      .recipe-info {
        margin-bottom: 0.5rem;
      }
      .buttons {
        display: flex;
        gap: 10px;
      }
      .base-button {
        padding: 12px;
        width: 100%;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      .approve-button {
        background-color: #4CAF50;
      }
      .approve-button:hover {
        background-color: #45a049;
      }
      .reject-button {
        background-color: #f44336;
      }
      .reject-button:hover {
        background-color: #da190b;
      }
    `}setupEventListeners(){this.shadowRoot.getElementById("approve-button").addEventListener("click",()=>this.handleApprove()),this.shadowRoot.getElementById("reject-button").addEventListener("click",()=>this.handleReject())}openModalForImage(e){this.imageData=e,this.updateModalContent(),this.shadowRoot.querySelector("custom-modal").open()}updateModalContent(){if(!this.imageData)return;const e=this.shadowRoot.getElementById("image-container");e.innerHTML=`<img src="${this.imageData.imageUrl}" alt="Pending image">`;const t=this.shadowRoot.getElementById("recipe-info");t.innerHTML=`
      <p>שם המתכון: ${this.imageData.recipeName}</p>
    `}async handleApprove(){console.log("Approve button clicked");try{await o(this.imageData.recipeId),this.dispatchEvent(new CustomEvent("image-approved",{bubbles:!0,composed:!0,detail:{recipeId:this.imageData.recipeId}})),this.closeModal()}catch(e){console.error("Error approving image:",e)}}async handleReject(){console.log("Reject button clicked");try{await a(this.imageData.recipeId),this.dispatchEvent(new CustomEvent("image-rejected",{bubbles:!0,composed:!0,detail:{recipeId:this.imageData.recipeId}})),this.closeModal()}catch(e){console.error("Error rejecting image:",e)}}closeModal(){this.shadowRoot.querySelector("custom-modal").close(),this.imageData=null}}customElements.define("image-approval-component",i);
