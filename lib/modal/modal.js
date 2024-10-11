class Modal extends HTMLElement {
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
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.4);
      }
      .modal-content {
        background-color: var(--background-color, #f5f2e9);
        margin: 15% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 300px;
        max-width: 80%;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .close-button {
        background-color: var(--secondary-color, #e6dfd1);
        border: none;
        padding: 10px;
        cursor: pointer;
        flex-grow: 0;

        font-size: 18px;
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
        color: white;
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
      this.shadowRoot.querySelector('.modal').style.display = 'block';
      this.isOpen = true;
      this.setFocusableElements();
      this.firstFocusableElement?.focus();
      window.addEventListener('keydown', this.handleKeyDown);
      this.dispatchEvent(new CustomEvent('modal-opened'));
    }
  }

  close() {
    if (this.isOpen) {
      this.shadowRoot.querySelector('.modal').style.display = 'none';
      this.isOpen = false;
      window.removeEventListener('keydown', this.handleKeyDown);
      this.dispatchEvent(new CustomEvent('modal-closed'));
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
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = [...this.shadowRoot.querySelectorAll(focusableSelectors)];
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
  }

}

customElements.define('custom-modal', Modal);