import"./auth-content-DLM3Yd_8.js";import"./message-modal-BCf8-UxT.js";import{a as n,g as u,d as v,b as h,h as p,r as g,m,k as b}from"./sw-register-nWNmA_5D.js";import"./modal-CJCcv8_f.js";class x extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.selectedAvatarUrl=null}connectedCallback(){this.render(),this.setupEventListeners(),this.loadAvatars(),n.addAuthObserver(t=>{t.user&&this.updateWelcomeText()})}render(){var r;const t=n.getCurrentUser();t!=null&&t.displayName||(r=t==null?void 0:t.email)!=null&&r.split("@")[0],this.shadowRoot.innerHTML=`
      <style>
        .profile-container {
          display: flex;
          flex-direction: column;
          padding: 20px;
          gap: 20px;
        }

        .welcome-text {
          font-size: 1.5em;
          color: var(--text-color);
          text-align: center;
          font-family: var(--heading-font-he);
        }

        .section-title {
          font-size: 1.1em;
          color: var(--text-color);
          margin-bottom: 10px;
        }

        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
          padding: 15px;
          background-color: var(--secondary-color);
          border-radius: 10px;
        }

        .avatar-button {
          background: none;
          border: 3px solid transparent;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.3s ease;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-button:hover {
          background-color: color-mix(in srgb, var(--primary-color), white 40%);
        }

        .avatar-button.selected {
          border-color: var(--primary-dark);
          background-color: color-mix(in srgb, var(--primary-color), white 40%);  
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 5px;
          object-fit: cover;
        }

        .buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .save-button {
          background-color: var(--primary-color);
          color: white;
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .save-button:hover {
          background-color: var(--primary-hover);
        }

        .signout-button {
          background-color: color-mix(in srgb, var(--background-color), black 10%);
          color: var(--primary-color);
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .signout-button:hover {
          background-color: color-mix(in srgb, var(--background-color), black 20%);
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: var(--text-color);
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

      <div class="profile-container">
        <div class="welcome-text">ברוך הבא!</div>

        <div>
          <div class="section-title">בחר תמונת פרופיל:</div>
          <div class="avatar-grid">
            <div class="loading">טוען תמונות פרופיל...</div>
          </div>
          <div class="error-message" id="avatar-error"></div>
        </div>

        <div class="buttons">
          <button class="save-button">שמור שינויים</button>
          <button class="signout-button">התנתק</button>
        </div>
      </div>
    `,this.updateWelcomeText()}setupEventListeners(){const t=this.shadowRoot.querySelector(".save-button"),r=this.shadowRoot.querySelector(".signout-button");t.addEventListener("click",()=>this.handleSave()),r.addEventListener("click",()=>this.handleSignout())}updateWelcomeText(){var a;const t=n.getCurrentUser(),r=(t==null?void 0:t.displayName)||((a=t==null?void 0:t.email)==null?void 0:a.split("@")[0])||"",e=this.shadowRoot.querySelector(".welcome-text");e&&(e.textContent=`ברוך הבא ${r}!`)}async loadAvatars(){var t;try{const r=n.getCurrentUser(),e=this.shadowRoot.querySelector(".avatar-grid");let a=null;if(r){const i=u(),s=v(i,"users",r.uid);a=(t=(await h(s)).data())==null?void 0:t.avatarUrl}const l=p(),c=g(l,"Avatars"),d=await m(c);e.innerHTML="",this.selectedAvatarUrl=a||null;for(const i of d.items){const s=await b(i),o=document.createElement("button");o.className="avatar-button",s===a&&(o.classList.add("selected"),this.selectedAvatarUrl=s),o.innerHTML=`<img src="${s}" alt="Avatar" class="avatar-image">`,o.addEventListener("click",()=>this.selectAvatar(o,s)),e.appendChild(o)}}catch(r){console.error("Error loading avatars:",r),this.showError("שגיאה בטעינת תמונות הפרופיל. אנא נסה שנית.")}}selectAvatar(t,r){this.shadowRoot.querySelectorAll(".avatar-button").forEach(e=>{e.classList.remove("selected")}),t.classList.add("selected"),this.selectedAvatarUrl=r}async handleSave(){if(!this.selectedAvatarUrl){this.showError("אנא בחר תמונת פרופיל");return}try{const t=this.closest("auth-controller");await t.updateUserAvatar(this.selectedAvatarUrl),this.dispatchEvent(new CustomEvent("profile-updated",{bubbles:!0,composed:!0})),t.closeModal()}catch(t){console.error("Error saving avatar:",t),this.showError("שגיאה בשמירת תמונת הפרופיל. אנא נסה שנית.")}}async handleSignout(){try{const t=this.closest("auth-controller");await t.handleLogout();const r=this.closest("auth-content");r==null||r.showAuthForms(),t.closeModal()}catch(t){console.error("Error signing out:",t),this.showError("שגיאה בהתנתקות. אנא נסה שנית.")}}showError(t){const r=this.shadowRoot.getElementById("avatar-error");r.textContent=t,r.classList.add("visible")}clearError(){const t=this.shadowRoot.getElementById("avatar-error");t.textContent="",t.classList.remove("visible")}}customElements.define("user-profile",x);
