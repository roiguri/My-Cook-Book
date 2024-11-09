/**
 * Confirmation Modal Component
 * @class
 * @extends Modal
 * 
 * @description
 * A custom web component that extends the Modal component to display a confirmation
 * message with approve and reject buttons, and dispatches custom events based on user interaction.
 * 
 * @example
 * // HTML
 * <confirmation-modal></confirmation-modal>
 * <button id="openModalButton">Open Modal</button>
 * <script src="confirmation-modal.js"></script> 
 * 
 * // JavaScript
 * const modal = document.querySelector('confirmation-modal');
 * 
 * modal.addEventListener('confirm-approved', () => {
 *   console.log('Action approved!');
 *   // Perform approve action
 * });
 * 
 * modal.addEventListener('confirm-rejected', () => {
 *   console.log('Action rejected!');
 *   // Perform reject action
 * });
 * 
 * document.getElementById('openModalButton').addEventListener('click', () => {
 *   modal.confirm('Confirm Action', 'Are you sure you want to proceed?', 'Yes', 'No');
 * });
 * 
 * @method confirm(message, title, approveButtonText, rejectButtonText)
 * @param {string} message - The confirmation message to display.
 * @param {string} [title=''] - The optional title of the modal.
 * @param {string} [approveButtonText='Yes'] - The text for the approve button.
 * @param {string} [rejectButtonText='No'] - The text for the reject button.
 * @description Opens the modal with the given message, title, and button texts.
 * 
 * @event confirm-approved - Dispatched when the approve button is clicked.
 * @event confirm-rejected - Dispatched when the reject button is clicked.
 */
class ConfirmationModal extends Modal {
  constructor() {
    super();
  }

  template() {
    return `
      <div dir="rtl" class="modal">
        <div class="modal-content">
          <button class="close-button">&times;</button>
          <div class="confirmation-modal-content">
            <h2 id="modal-title"></h2>
            <p id="modal-message"></p>
            <div class="modal-buttons">
              <button id="modal-reject-button" class="modal-button reject-button"></button>
              <button id="modal-approve-button" class="modal-button approve-button"></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  styles() {
    return `
      ${super.styles()}
      ${super.existingStyles()}
      .confirmation-modal-content {
        text-align: center;
      }
      .modal-buttons {
        display: flex;
        gap: 8px;
      }
      .modal-button {
        padding: 12px;
        width: 45%;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
        min-width: 100px;
      }
      .approve-button {
        background-color: var(--primary-color, #bb6016);
        color: white;
      }
      .approve-button:hover {
        background-color: var(--primary-hover, #5c4033);
      }
      .reject-button {
        background-color: var(--secondary-color, #e6dfd1);
        color: var(--primary-color, #bb6016);
      }
      .reject-button:hover {
        background-color: #5c4033;
        color: white;
      }
    `;
  }

  confirm(message='האם אתה בטוח?', title = '', approveButtonText = 'כן', rejectButtonText = 'לא') {
    this.shadowRoot.getElementById('modal-message').textContent = message;

    const titleDiv = this.shadowRoot.getElementById('modal-title');
    if (title) {
      titleDiv.textContent = title;
      titleDiv.style.display = 'block';
    } else {
      titleDiv.style.display = 'none';
    }

    this.shadowRoot.getElementById('modal-approve-button').textContent = approveButtonText;
    this.shadowRoot.getElementById('modal-reject-button').textContent = rejectButtonText;

    const approveButton = this.shadowRoot.getElementById('modal-approve-button');
    const rejectButton = this.shadowRoot.getElementById('modal-reject-button');

    approveButton.addEventListener('click', () => {
      this.close();
      this.dispatchEvent(new CustomEvent('confirm-approved'));
    });

    rejectButton.addEventListener('click', () => {
      this.close();
      this.dispatchEvent(new CustomEvent('confirm-rejected'));
    });

    this.open();
  }
}

customElements.define('confirmation-modal', ConfirmationModal);