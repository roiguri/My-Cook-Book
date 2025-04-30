/**
 * Modal Component
 * @class
 * @extends HTMLElement
 *
 * @description
 * A custom web component that creates a flexible, accessible, and stylable modal dialog
 * that can be easily integrated into web pages. It provides open/close functionality,
 * customizable appearance, and event handling.
 *
 * @example
 * // HTML
 * <custom-modal id="myModal" width="400px" height="300px" background-color="#f0f0f0">
 *   <h2>Welcome to My Modal</h2>
 *   <p>This is a basic modal example.</p>
 *   <button onclick="document.getElementById('myModal').close()">Close</button>
 * </custom-modal>
 *
 * // JavaScript
 * const modal = document.getElementById('myModal');
 * modal.addEventListener('modal-opened', () => console.log('Modal opened'));
 * modal.addEventListener('modal-closed', () => console.log('Modal closed'));
 *
 * // Open the modal
 * modal.open();
 *
 * @property {boolean} isOpen - Indicates whether the modal is currently open.
 *
 * @method open
 * @description Opens the modal and dispatches the 'modal-opened' event.
 *
 * @method close
 * @description Closes the modal and dispatches the 'modal-closed' event after the closing animation.
 *
 * @method setWidth
 * @param {string} value - The width of the modal (e.g., '400px', '50%').
 * @description Sets the width of the modal.
 *
 * @method setHeight
 * @param {string} value - The height of the modal (e.g., '300px', 'auto').
 * @description Sets the height of the modal.
 *
 * @method setBackgroundColor
 * @param {string} value - The background color of the modal (e.g., '#ffffff', 'rgb(255, 255, 255)').
 * @description Sets the background color of the modal.
 *
 * @fires modal-opened - When the modal is opened.
 * @fires modal-closed - When the modal is closed (after closing animation).
 *
 * @attr {string} width - Sets the width of the modal.
 * @attr {string} height - Sets the height of the modal.
 * @attr {string} background-color - Sets the background color of the modal.
 */

export class Modal extends HTMLElement {
  /**
   * ##Set-up
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;

    // Accesibility Enhancements
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setFocusableElements();

    // Check for attributes and set custom properties
    if (this.hasAttribute('width')) {
      this.setWidth(this.getAttribute('width'));
    }
    if (this.hasAttribute('height')) {
      this.setHeight(this.getAttribute('height'));
    }
    if (this.hasAttribute('background-color')) {
      this.setBackgroundColor(this.getAttribute('background-color'));
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${this.styles()}
      </style>
      ${this.template()}
    `;
  }

  styles() {
    return `
      ${this.existingStyles()}
      .modal-content {
        width: var(--modal-width, 300px);
        height: var(--modal-height, auto);
        background-color: var(--modal-background-color, var(--background-color, #f5f2e9));
      }
    `;
  }

  existingStyles() {
    return `
      .modal {
        display: flex;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        align-items: start;
        background-color: rgba(0,0,0,0.4);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .modal.open {
        opacity: 1;
        visibility: visible;
      }
      .modal-content {
        background-color: var(--background-color, #f5f2e9);
        margin: auto;
        padding: 20px;
        border: 1px solid #888;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        transform: scale(0.7);
        transition: transform 0.3s ease;
      }
      .modal.open .modal-content {
        transform: scale(1);
      }
      .close-button {
        background-color: color-mix(in srgb, var(--background-color), black 10%);
        border: none;
        padding: 10px;
        padding-left: 22px;
        cursor: pointer;
        flex-grow: 0;

        font-size: var(--size-icon, 18px);
        font-weight: bold;
        
        align-self: start;
        position: relative;
        top: -20px;
        right: -20px;
        width: 30px;
        border-bottom-left-radius: 10px;
        border-top-right-radius: 10px;
        margin-bottom: -20px;
        text-align: center;
        transition: background-color 0.3s ease;
      }
      .close-button:hover {
        color: var(--button-color, white);
        background-color: var(--primary-color, #bb6016);
      }
    `;
  }

  template() {
    return `
      <div dir="rtl" class="modal">
        <div class="modal-content">
          <button class="close-button">&times;</button>
          <slot></slot>
        </div>
      </div>
    `;
  }

  /**
   * ##Functionality
   */
  setupEventListeners() {
    const closeButton = this.shadowRoot.querySelector('.close-button');
    closeButton.addEventListener('click', () => this.close());

    const modal = this.shadowRoot.querySelector('.modal');
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.close();
      }
    });
  }

  open() {
    if (!this.isOpen) {
      const modalElement = this.shadowRoot.querySelector('.modal');
      modalElement.style.display = 'flex';
      // Force a reflow before adding the 'open' class
      modalElement.offsetWidth;
      modalElement.classList.add('open');
      this.isOpen = true;
      this.setFocusableElements();
      this.firstFocusableElement?.focus();
      window.addEventListener('keydown', this.handleKeyDown);
      this.dispatchEvent(new CustomEvent('modal-opened'));
      this.lockScroll();
    }
  }

  close() {
    if (this.isOpen) {
      const modalElement = this.shadowRoot.querySelector('.modal');
      modalElement.classList.remove('open');
      this.isOpen = false;
      window.removeEventListener('keydown', this.handleKeyDown);
      // Wait for the transition to finish before hiding the modal
      setTimeout(() => {
        if (!this.isOpen) {
          modalElement.style.display = 'none';
        }
      }, 300); // This should match the transition duration
      this.dispatchEvent(new CustomEvent('modal-closed'));
      this.unlockScroll();
    }
  }

  /**
   * Customization
   */
  setCustomProperty(property, value) {
    this.style.setProperty(`--modal-${property}`, value);
  }

  setWidth(value) {
    this.setCustomProperty('width', value);
  }

  setHeight(value) {
    this.setCustomProperty('height', value);
  }

  setBackgroundColor(value) {
    this.setCustomProperty('background-color', value);
  }

  /**
   * ##Accesibility
   */
  handleKeyDown(event) {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'Tab':
        this.handleTabKey(event);
        break;
    }
  }

  handleTabKey(event) {
    if (!this.firstFocusableElement || !this.lastFocusableElement) return;

    if (event.shiftKey && document.activeElement === this.firstFocusableElement) {
      event.preventDefault();
      this.lastFocusableElement.focus();
    } else if (!event.shiftKey && document.activeElement === this.lastFocusableElement) {
      event.preventDefault();
      this.firstFocusableElement.focus();
    }
  }

  setFocusableElements() {
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = [...this.shadowRoot.querySelectorAll(focusableSelectors)];
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
  }

  /**
   * ##Scroll-lock
   */
  lockScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
  }

  unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }
}

customElements.define('custom-modal', Modal);
