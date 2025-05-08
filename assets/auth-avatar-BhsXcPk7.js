import{a as o}from"./sw-register-nWNmA_5D.js";import"./auth-content-DLM3Yd_8.js";class a extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render(),this.setupEventListeners(),this.initializeAuthListener()}render(){this.shadowRoot.innerHTML=`
      <style>
        .avatar {
          height: 100%;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.3s ease;
          background-color: var(--primary-color);
        }

        .avatar.signed-out {
          background-color: var(--primary-color);
          color: var(--button-color);
        }

        .avatar:hover {
          background-color: var(--primary-hover)
            box-shadow:
              inset 0 0 0 3px var(--primary-color), 
              0 4px 0 var(--primary-dark),
              0 6px 4px rgba(0, 0, 0, 0.2);
            }

        .avatar img {
          width: 70%;
          height: 70;
          border-radius: 5px;
          object-fit: cover;
        }

        .initial {
          font-family: var(--body-font);
          color: white;
          background-color: var(--primary-color);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
        }
      </style>
      
      <div class="avatar signed-out" id="auth-trigger">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    `}setupEventListeners(){this.shadowRoot.getElementById("auth-trigger").addEventListener("click",()=>this.handleClick()),document.addEventListener("signup-success",()=>{const t=document.querySelector("auth-content");t&&t.showUserProfile()}),document.addEventListener("profile-updated",()=>{const t=o.getCurrentUser();t&&this.updateAvatar(t)})}initializeAuthListener(){o.addAuthObserver(e=>{this.updateAvatar(e.user)})}updateAvatar(e){const t=this.shadowRoot.getElementById("auth-trigger");e?(t.classList.remove("signed-out"),e.photoURL?t.innerHTML=`<img src="${e.photoURL}" alt="User Avatar">`:t.innerHTML=`<div class="initial">${e.email[0].toUpperCase()}</div>`):(t.classList.add("signed-out"),t.innerHTML=`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      `)}handleClick(){const e=o.getCurrentUser(),t=document.querySelector("auth-controller"),r=document.querySelector("auth-content");if(!t||!r){console.error("Required components not found");return}e?r.showUserProfile():r.showAuthForms(),t.openModal()}}customElements.define("auth-avatar",a);
