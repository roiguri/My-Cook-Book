class c extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render(),this.setupEventListeners()}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .auth-container {
          width: 100%;
          min-width: 300px;
          box-sizing: border-box;
          padding-top: 20px;
        }
        
        .auth-tabs {
          display: flex;
          margin-bottom: 20px;
        }
        
        .auth-tab {
          background-color: var(--background-color, #E8D9B7);
          border: none;
          padding: 15px 30px;
          cursor: pointer;
          flex-grow: 1;
          text-align: center;
          font-size: 1.2em;
          font-family: var(--heading-font-he, 'Amatic SC');
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
          position: relative;
        }
        
        .auth-tab.active {
          background-color: var(--background-color, #FDF7E9);
          color: var(--primary-color, #A74C20);
          border-bottom: 2px solid var(--primary-color, #A74C20);
          font-weight: bold;
        }

        .auth-tab:first-child {
          border-top-right-radius: 10px;
        }

        .auth-tab:last-child {
          border-top-left-radius: 10px;
        }

        .auth-tabs.hidden {
          display: none;
        }

        .form-container {
          position: relative;
          min-height: 200px;
          padding: 0 20px 20px 20px;
        }

        /* Slots styling */
        ::slotted(*) {
          display: none !important;
        }

        ::slotted(.active) {
          display: block !important;
        }
      </style>

      <div class="auth-container">
        <div class="auth-tabs">
          <button class="auth-tab active" data-form="login">התחברות</button>
          <button class="auth-tab" data-form="signup">הרשמה</button>
        </div>
        
        <div class="form-container">
          <slot name="login-form"></slot>
          <slot name="signup-form"></slot>
          <slot name="forgot-password"></slot>
          <slot name="user-profile"></slot>
        </div>
      </div>
    `,this.showAuthForms()}setupEventListeners(){var s;this.shadowRoot.querySelectorAll(".auth-tab").forEach(a=>{a.addEventListener("click",()=>this.switchForm(a.dataset.form))}),this.addEventListener("switch-to-forgot-password",()=>{this.showForgotPassword()}),this.addEventListener("back-to-login",()=>{this.showAuthForms(),this.switchForm("login")});const t=this.closest("auth-controller"),o=(s=t==null?void 0:t.shadowRoot)==null?void 0:s.querySelector("custom-modal");o&&o.addEventListener("modal-closed",()=>{setTimeout(()=>{const a=this.querySelector('[slot="login-form"]'),r=this.querySelector('[slot="signup-form"]'),i=this.querySelector('[slot="forgot-password"]');a==null||a.reset(),r==null||r.reset(),i==null||i.reset(),[a,r,i].forEach(l=>{const n=l==null?void 0:l.shadowRoot.querySelector(".error-message");n&&n.classList.remove("visible")}),this.showAuthForms()},300)})}showAuthForms(){this.shadowRoot.querySelector(".auth-tabs").classList.remove("hidden"),this.hideAllForms(),this.shadowRoot.querySelectorAll(".auth-tab").forEach(s=>{s.classList.toggle("active",s.dataset.form==="login")});const o=this.querySelector('[slot="login-form"]');o&&o.classList.add("active")}showUserProfile(){this.shadowRoot.querySelector(".auth-tabs").classList.add("hidden"),this.hideAllForms();const t=this.querySelector('[slot="user-profile"]');t&&t.classList.add("active")}showForgotPassword(){this.shadowRoot.querySelector(".auth-tabs").classList.add("hidden"),this.hideAllForms();const t=this.querySelector('[slot="forgot-password"]');t&&t.classList.add("active")}hideAllForms(){this.querySelectorAll("[slot]").forEach(t=>t.classList.remove("active"))}switchForm(e){this.shadowRoot.querySelectorAll(".auth-tab").forEach(s=>{s.classList.toggle("active",s.dataset.form===e)}),this.hideAllForms();const o=this.querySelector(`[slot="${e}-form"]`);o&&o.classList.add("active")}}customElements.define("auth-content",c);
