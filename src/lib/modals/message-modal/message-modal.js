import { Modal } from '../../utilities/modal/modal.js';

/**
 * Message Modal Component
 * @class
 * @extends Modal
 *
 * @description
 * A simple modal component for displaying messages with optional title.
 * Extends Modal functionality and supports RTL (Right-to-Left) layout by default.
 *
 * @dependencies
 * - Requires Modal component (`custom-modal`)
 *
 * @example
 * // HTML
 * <message-modal></message-modal>
 *
 * // JavaScript
 * const modal = document.querySelector('message-modal');
 * modal.show('Your message here', 'Optional Title');
 *
 * @method show(message, title)
 * @param {string} message - The message to display
 * @param {string} [title=''] - Optional title for the message
 *
 * @fires modal-opened - Inherited from Modal component
 * @fires modal-closed - Inherited from Modal component
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
            <div class="modal-actions"></div>
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
      .modal-actions {
        margin-top: 15px;
        text-align: center;
      }
      .modal-actions button {
        padding: 10px 20px;
        background-color: var(--primary-color);
        color: var(--button-color);
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      .modal-actions button:hover {
        background-color: var(--primary-hover);
      }
    `;
  }

  show(message, title = '', buttonText = null, buttonAction = null) {
    this.shadowRoot.getElementById('modal-message').textContent = message;

    const titleDiv = this.shadowRoot.getElementById('modal-title');
    if (title) {
      titleDiv.textContent = title;
      titleDiv.style.display = 'block'; // Show the title if it exists
    } else {
      titleDiv.style.display = 'none'; // Hide the title if it's empty
    }

    const actionsContainer = this.shadowRoot.querySelector('.modal-actions');
    actionsContainer.innerHTML = ''; // Clear previous buttons

    if (buttonText && typeof buttonAction === 'function') {
      const button = document.createElement('button');
      button.textContent = buttonText;
      button.classList.add('action-button'); // Add class for styling if needed
      button.addEventListener('click', () => {
        buttonAction();
      });
      actionsContainer.appendChild(button);
    }

    this.open();
  }
}

customElements.define('message-modal', MessageModal);
