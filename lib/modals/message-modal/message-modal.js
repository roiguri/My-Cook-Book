/**
 * Message Modal Component
 * @class
 * @extends Modal
 * 
 * @description
 * A custom web component that extends the Modal component to display a message
 * with an optional title and an OK button.
 * 
 * @example
 * // HTML
 * <message-modal></message-modal>
 * <button id="openModalButton">Open Modal</button>
 * <script src="message-modal.js"></script> 
 * 
 * // JavaScript
 * const modal = document.querySelector('message-modal');
 * document.getElementById('openModalButton').addEventListener('click', () => {
 *   modal.show('This is the message!', 'This is the title', 'Close');
 * });
 * 
 * @method show(message, title, buttonText)
 * @param {string} message - The message to display in the modal.
 * @param {string} [title=''] - The optional title of the modal.
 * @param {string} [buttonText='OK'] - The text of the OK button.
 * @description Opens the modal with the given message, title, and button text.
 */
class MessageModal extends Modal {
  constructor() {
    super();
  }

  template() {
    return `
      <div dir="rtl" class="modal">
        <div class="modal-content">
          <button class="close-button">&times;</button>
          <div class="message-modal-content">
            <h2 id="modal-title"></h2>
            <p id="modal-message"></p>
          </div>
        </div>
      </div>
    `;
  }

  styles() {
    return `
      ${super.styles()}
      ${super.existingStyles()}
      h2 {
        margin: 0;
      }
      .message-modal-content {
        text-align: center; /* Center the content */
      }
    `;
  }

  show(message, title = '') {
    this.shadowRoot.getElementById('modal-message').textContent = message;
  
    const titleDiv = this.shadowRoot.getElementById('modal-title');
    if (title) {
      titleDiv.textContent = title;
      titleDiv.style.display = 'block'; // Show the title if it exists
    } else {
      titleDiv.style.display = 'none'; // Hide the title if it's empty
    }
  
    this.open();
  }
}

customElements.define('message-modal', MessageModal);