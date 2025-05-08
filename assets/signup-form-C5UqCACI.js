import"./auth-content-DLM3Yd_8.js";import"./message-modal-BCf8-UxT.js";import"./modal-CJCcv8_f.js";class a extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render(),this.setupEventListeners()}render(){this.shadowRoot.innerHTML=`
      <style>
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-size: 0.9em;
          color: var(--text-color);
        }

        .form-group input {
          padding: 10px;
          border: 1px solid var(--secondary-color);
          border-radius: 5px;
          font-size: 1em;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        /* Password strength indicator */
        .password-strength {
          height: 4px;
          border-radius: 2px;
          margin-top: 5px;
          background-color: #ddd;
          overflow: hidden;
        }

        .strength-meter {
          height: 100%;
          width: 0;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .strength-meter.weak { 
          width: 33.33%;
          background-color: #ff4d4d;
        }
        .strength-meter.medium { 
          width: 66.66%;
          background-color: #ffd700;
        }
        .strength-meter.strong { 
          width: 100%;
          background-color: #32cd32;
        }

        .submit-button {
          background-color: var(--primary-color);
          color: white;
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .submit-button:hover {
          background-color: var(--primary-hover);
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 15px 0;
          gap: 10px;
          color: var(--text-color);
          opacity: 0.8;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--secondary-color);
        }

        /* Google Button Styles */
        .gsi-material-button {
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
          -webkit-appearance: none;
          background-color: WHITE;
          background-image: none;
          border: 1px solid #000000;
          -webkit-border-radius: 4px;
          border-radius: 4px;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
          color: #1f1f1f;
          cursor: pointer;
          font-family: 'Roboto', arial, sans-serif;
          font-size: 14px;
          height: 40px;
          letter-spacing: 0.25px;
          outline: none;
          overflow: hidden;
          padding: 0 12px;
          position: relative;
          text-align: center;
          transition: background-color .218s, border-color .218s, box-shadow .218s;
          vertical-align: middle;
          white-space: nowrap;
          width: 100%;
          max-width: 400px;
          margin-top: -10px;
        }
        
        .gsi-material-button-content-wrapper {
          align-items: center;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          height: 100%;
          justify-content: space-between;
          position: relative;
          width: 100%;
        }
        
        .gsi-material-button-icon {
          height: 20px;
          margin-right: 12px;
          min-width: 20px;
          width: 20px;
        }
        
        .gsi-material-button-contents {
          flex-grow: 1;
          font-family: 'Roboto', arial, sans-serif;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: top;
        }
        
        .gsi-material-button-state {
          transition: opacity .218s;
          bottom: 0;
          left: 0;
          opacity: 0;
          position: absolute;
          right: 0;
          top: 0;
        }
        
        .error-message {
          color: red;
          font-size: 0.9em;
          margin-top: 5px;
          display: none;
        }

        .error-message.visible {
          display: block;
        }
      </style>

      <form class="signup-form">
        <div class="form-group">
          <label for="fullName">שם מלא</label>
          <input type="text" id="fullName" name="fullName" required>
        </div>

        <div class="form-group">
          <label for="email">כתובת מייל</label>
          <input type="email" id="email" name="email" required>
        </div>

        <div class="form-group">
          <label for="password">סיסמה</label>
          <input type="password" id="password" name="password" required 
                 minlength="8" autocomplete="new-password">
          <div class="password-strength">
            <div class="strength-meter"></div>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">אימות סיסמה</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required>
          <div class="error-message" id="signup-error"></div>
        </div>

        <button type="submit" class="submit-button">הרשמה</button>

        <div class="divider">או</div>

        <button type="button" class="gsi-material-button">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span class="gsi-material-button-contents">הרשמה עם Google</span>
          </div>
        </button>
      </form>
    `}setupEventListeners(){const t=this.shadowRoot.querySelector(".signup-form"),e=this.shadowRoot.getElementById("password"),o=this.shadowRoot.getElementById("confirmPassword"),r=this.shadowRoot.querySelector(".gsi-material-button");e.addEventListener("input",()=>this.checkPasswordStrength()),t.addEventListener("submit",s=>this.handleSubmit(s)),r.addEventListener("click",()=>this.handleGoogleSignup()),o.addEventListener("input",()=>this.checkPasswordsMatch())}checkPasswordStrength(){const t=this.shadowRoot.getElementById("password").value,e=this.shadowRoot.querySelector(".strength-meter");if(e.classList.remove("weak","medium","strong"),t.length>=8){let o=0;t.match(/[a-z]/)&&o++,t.match(/[A-Z]/)&&o++,t.match(/[0-9]/)&&o++,t.match(/[^a-zA-Z0-9]/)&&o++,o<=2?e.classList.add("weak"):o===3?e.classList.add("medium"):e.classList.add("strong")}}checkPasswordsMatch(){const t=this.shadowRoot.getElementById("password").value,e=this.shadowRoot.getElementById("confirmPassword").value;e&&t!==e?this.showError("הסיסמאות אינן תואמות"):this.clearError()}async handleSubmit(t){t.preventDefault();const e=this.shadowRoot.getElementById("fullName").value,o=this.shadowRoot.getElementById("email").value,r=this.shadowRoot.getElementById("password").value,s=this.shadowRoot.getElementById("confirmPassword").value;if(!e.trim()){this.showError("נא להזין שם מלא");return}if(r!==s){this.showError("הסיסמאות אינן תואמות");return}try{await this.closest("auth-controller").handleSignup(o,r,e),this.dispatchEvent(new CustomEvent("signup-success",{bubbles:!0,composed:!0}))}catch(i){this.showError(i.message)}}async handleGoogleSignup(){try{await this.closest("auth-controller").handleGoogleSignIn(),this.dispatchEvent(new CustomEvent("signup-success",{bubbles:!0,composed:!0}))}catch(t){this.showError(t.message)}}showError(t){const e=this.shadowRoot.getElementById("signup-error");e.textContent=t,e.classList.add("visible")}clearError(){const t=this.shadowRoot.getElementById("signup-error");t.textContent="",t.classList.remove("visible")}reset(){this.shadowRoot.querySelector(".signup-form").reset(),this.clearError(),this.shadowRoot.querySelector(".strength-meter").classList.remove("weak","medium","strong")}}customElements.define("signup-form",a);
