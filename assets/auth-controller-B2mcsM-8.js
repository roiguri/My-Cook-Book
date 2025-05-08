import{a as r}from"./sw-register-nWNmA_5D.js";class c extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.isAuthenticated=!1,this.currentUser=null}connectedCallback(){this.render(),this.setupAuthStateObserver(),r.initialize()}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: contents;
        }
      </style>
      <custom-modal height="auto">
        <slot></slot>
      </custom-modal>
    `}styles(){return`
      :host {
        display: contents;
      }
    `}setupAuthStateObserver(){r.addAuthObserver(e=>{this.isAuthenticated=!!e.user,this.currentUser=e.user,e.user?(this.updateNavigation(e.user,{isManager:e.isManager,isApproved:e.isApproved}),this.dispatchAuthStateChanged({user:e.user,isAuthenticated:!0,isManager:e.isManager,isApproved:e.isApproved})):(this.updateNavigation(null),this.dispatchAuthStateChanged({user:null,isAuthenticated:!1,isManager:!1,isApproved:!1}))})}updateNavigation(e,t={isManager:!1,isApproved:!1}){const s=document.querySelector("nav ul");if(!s||(["profile-tab","documents-tab","dashboard-tab"].forEach(i=>{const o=document.querySelector(`#${i}`);o&&o.remove()}),!e))return;const a=(i,o,h)=>{const d=document.createElement("li");d.id=i;const n=document.createElement("a");return n.href=this.getCorrectPath(h),n.textContent=o,n.classList.add("btn-3d"),d.appendChild(n),d};s.appendChild(a("profile-tab","מועדפים","/pages/profile.html")),(t.isApproved||t.isManager)&&s.appendChild(a("documents-tab","המטעמים של סבתא","/pages/documents.html")),t.isManager&&s.appendChild(a("dashboard-tab","ממשק ניהול","/pages/manager-dashboard.html"))}getCorrectPath(e){return window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/")?"."+e:".."+e}dispatchAuthStateChanged(e){const t=new CustomEvent("auth-state-changed",{bubbles:!0,composed:!0,detail:e});this.dispatchEvent(t)}async handleLogin(e,t,s=!1){try{return await r.login(e,t,s)}catch(a){throw console.log("AuthService Error:",{code:a.code,message:a.message,fullError:a}),a}}async handleSignup(e,t,s){try{return await r.signup(e,t,s)}catch(a){throw a}}async handleGoogleSignIn(){try{return await r.loginWithGoogle()}catch(e){throw e}}async handlePasswordReset(e){try{await r.resetPassword(e)}catch(t){throw t}}async handleLogout(){try{await r.logout()}catch(e){throw e}}async updateUserAvatar(e){try{await r.updateProfile({photoURL:e}),this.dispatchAuthStateChanged({user:r.getCurrentUser(),isAuthenticated:!0})}catch(t){throw t}}openModal(){this.shadowRoot.querySelector("custom-modal").open()}closeModal(){this.shadowRoot.querySelector("custom-modal").close()}}customElements.define("auth-controller",c);
