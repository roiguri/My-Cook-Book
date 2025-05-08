class o extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.isOpen=!1,this.focusableElements=[],this.firstFocusableElement=null,this.lastFocusableElement=null,this.handleKeyDown=this.handleKeyDown.bind(this)}connectedCallback(){this.render(),this.setupEventListeners(),this.setFocusableElements(),this.hasAttribute("width")&&this.setWidth(this.getAttribute("width")),this.hasAttribute("height")&&this.setHeight(this.getAttribute("height")),this.hasAttribute("background-color")&&this.setBackgroundColor(this.getAttribute("background-color"))}render(){this.shadowRoot.innerHTML=`
      <style>
        ${this.styles()}
      </style>
      ${this.template()}
    `}styles(){return`
      ${this.existingStyles()}
      .modal-content {
        width: var(--modal-width, 300px);
        height: var(--modal-height, auto);
        background-color: var(--modal-background-color, var(--background-color, #f5f2e9));
      }
    `}existingStyles(){return`
      .modal {
        display: flex;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        align-items: start;
        background-color: rgba(0,0,0,0.4);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .modal.open {
        opacity: 1;
        visibility: visible;
      }
      .modal-content {
        background-color: var(--background-color, #f5f2e9);
        margin: auto;
        padding: 20px;
        border: 1px solid #888;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        transform: scale(0.7);
        transition: transform 0.3s ease;
      }
      .modal.open .modal-content {
        transform: scale(1);
      }
      .close-button {
        background-color: color-mix(in srgb, var(--background-color), black 10%);
        border: none;
        padding: 10px;
        padding-left: 22px;
        cursor: pointer;
        flex-grow: 0;

        font-size: var(--size-icon, 18px);
        font-weight: bold;
        
        align-self: start;
        position: relative;
        top: -20px;
        right: -20px;
        width: 30px;
        border-bottom-left-radius: 10px;
        border-top-right-radius: 10px;
        margin-bottom: -20px;
        text-align: center;
        transition: background-color 0.3s ease;
      }
      .close-button:hover {
        color: var(--button-color, white);
        background-color: var(--primary-color, #bb6016);
      }
    `}template(){return`
      <div dir="rtl" class="modal">
        <div class="modal-content">
          <button class="close-button">&times;</button>
          <slot></slot>
        </div>
      </div>
    `}setupEventListeners(){this.shadowRoot.querySelector(".close-button").addEventListener("click",()=>this.close());const e=this.shadowRoot.querySelector(".modal");e.addEventListener("click",s=>{s.target===e&&this.close()})}open(){var t;if(!this.isOpen){const e=this.shadowRoot.querySelector(".modal");e.style.display="flex",e.offsetWidth,e.classList.add("open"),this.isOpen=!0,this.setFocusableElements(),(t=this.firstFocusableElement)==null||t.focus(),window.addEventListener("keydown",this.handleKeyDown),this.dispatchEvent(new CustomEvent("modal-opened")),this.lockScroll()}}close(){if(this.isOpen){const t=this.shadowRoot.querySelector(".modal");t.classList.remove("open"),this.isOpen=!1,window.removeEventListener("keydown",this.handleKeyDown),setTimeout(()=>{this.isOpen||(t.style.display="none")},300),this.dispatchEvent(new CustomEvent("modal-closed")),this.unlockScroll()}}setCustomProperty(t,e){this.style.setProperty(`--modal-${t}`,e)}setWidth(t){this.setCustomProperty("width",t)}setHeight(t){this.setCustomProperty("height",t)}setBackgroundColor(t){this.setCustomProperty("background-color",t)}handleKeyDown(t){if(this.isOpen)switch(t.key){case"Escape":this.close();break;case"Tab":this.handleTabKey(t);break}}handleTabKey(t){!this.firstFocusableElement||!this.lastFocusableElement||(t.shiftKey&&document.activeElement===this.firstFocusableElement?(t.preventDefault(),this.lastFocusableElement.focus()):!t.shiftKey&&document.activeElement===this.lastFocusableElement&&(t.preventDefault(),this.firstFocusableElement.focus()))}setFocusableElements(){const t='button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';this.focusableElements=[...this.shadowRoot.querySelectorAll(t)],this.firstFocusableElement=this.focusableElements[0],this.lastFocusableElement=this.focusableElements[this.focusableElements.length-1]}lockScroll(){document.body.style.overflow="hidden",document.body.style.paddingRight=this.getScrollbarWidth()+"px"}unlockScroll(){document.body.style.overflow="",document.body.style.paddingRight=""}getScrollbarWidth(){return window.innerWidth-document.documentElement.clientWidth}}customElements.define("custom-modal",o);export{o as M};
