import{M as o}from"./modal-CJCcv8_f.js";class l extends o{constructor(){super()}template(){return`
      <div dir="rtl" class="modal">
        <div class="modal-content">
          <button class="close-button">&times;</button>
          <div class="message-modal-content">
            <h2 id="modal-title"></h2>
            <p id="modal-message"></p>
          </div>
        </div>
      </div>
    `}styles(){return`
      ${super.styles()}
      ${super.existingStyles()}
      h2 {
        margin: 0;
      }
      .message-modal-content {
        text-align: center; /* Center the content */
      }
    `}show(s,t=""){this.shadowRoot.getElementById("modal-message").textContent=s;const e=this.shadowRoot.getElementById("modal-title");t?(e.textContent=t,e.style.display="block"):e.style.display="none",this.open()}}customElements.define("message-modal",l);
