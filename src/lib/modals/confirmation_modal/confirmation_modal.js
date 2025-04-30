/**
 * Confirmation Modal Component
 * @class
 * @extends Modal
 *
 * @description
 * A custom web component that extends the Modal component to display a confirmation
 * dialog in RTL (Right-to-Left) layout. Provides customizable title, message, and button text.
 *
 * @dependencies
 * - Requires Modal component as parent class
 * - Uses CSS variables:
 *   - --primary-color (default: #bb6016)
 *   - --primary-hover (default: #5c4033)
 *   - --secondary-color (default: #e6dfd1)
 *
 * @example
 * // HTML
 * <confirmation-modal></confirmation-modal>
 *
 * // JavaScript
 * const modal = document.querySelector('confirmation-modal');
 *
 * modal.addEventListener('confirm-approved', () => {
 *   console.log('Action approved!');
 * });
 *
 * modal.addEventListener('confirm-rejected', () => {
 *   console.log('Action rejected!');
 * });
 *
 * // Basic usage with default Hebrew text
 * modal.confirm();
 *
 * // Custom text usage
 * modal.confirm(
 *   'Delete this item?',    // message
 *   'Confirm Delete',       // title
 *   'Delete',              // approve button
 *   'Cancel'               // reject button
 * );
 *
 * @method confirm(message?, title?, approveButtonText?, rejectButtonText?)
 * @param {string} [message='האם אתה בטוח?'] - The confirmation message to display
 * @param {string} [title=''] - Modal title. If empty, title section is hidden
 * @param {string} [approveButtonText='כן'] - Text for the approve button (default: "Yes" in Hebrew)
 * @param {string} [rejectButtonText='לא'] - Text for the reject button (default: "No" in Hebrew)
 *
 * @event confirm-approved - Fired when the approve button is clicked
 * @event confirm-rejected - Fired when the reject button is clicked
 *
 * @cssProperties
 * - --primary-color: Primary color for approve button and text
 * - --primary-hover: Hover color for buttons
 * - --secondary-color: Background color for reject button
 *
 * @notes
 * - Component uses RTL layout by default
 * - Inherits modal backdrop and close button functionality from Modal component
 * - Event listeners are added on each confirm() call
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

  confirm(
    message = 'האם אתה בטוח?',
    title = '',
    approveButtonText = 'כן',
    rejectButtonText = 'לא',
  ) {
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
