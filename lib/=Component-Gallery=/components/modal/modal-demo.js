// components/modal/modal-demo.js

class ModalDemo {
  constructor() {
      this.modal = document.getElementById('demo-modal');
      this.openButton = document.querySelector('.open-modal');
      this.customizationControls = {
          width: document.getElementById('modal-width'),
          height: document.getElementById('modal-height'),
          bgColor: document.getElementById('modal-bg-color')
      };
      
      this.initializeDemo();
  }

  initializeDemo() {
      // Setup modal open button
      if (this.openButton && this.modal) {
          this.openButton.addEventListener('click', () => this.modal.open());
      }

      // Setup customization controls
      const applyButton = document.querySelector('.customization-sidebar .apply-customization');
      if (applyButton) {
          applyButton.addEventListener('click', () => this.applyCustomizations());
      }

      // Setup event logging
      this.setupEventLogging();
  }

  applyCustomizations() {
      if (!this.modal) return;

      const { width, height, bgColor } = this.customizationControls;
      
      this.modal.style.setProperty('--modal-width', width.value);
      this.modal.style.setProperty('--modal-height', height.value);
      this.modal.style.setProperty('--modal-background-color', bgColor.value);

      this.updateCodeSnippet();
  }

  updateCodeSnippet() {
      const { width, height, bgColor } = this.customizationControls;
      const code = `
<button class="open-modal">Open Modal</button>

<custom-modal 
  style="
      --modal-width: ${width.value}; 
      --modal-height: ${height.value}; 
      --modal-background-color: ${bgColor.value};"
>
  <h3>Modal Content</h3>
</custom-modal>
      `.trim();

      window.gallery.updateCodeSnippet('modal', code);
  }

  setupEventLogging() {
      const eventLog = document.getElementById('modal-event-log');
      
      ['modal-opened', 'modal-closed'].forEach(eventName => {
          this.modal.addEventListener(eventName, () => {
              const timestamp = new Date().toLocaleTimeString();
              const eventEntry = document.createElement('div');
              eventEntry.className = 'event-entry';
              eventEntry.textContent = `${timestamp}: ${eventName} event fired`;
              
              const emptyMessage = eventLog.querySelector('.event-log-empty');
              if (emptyMessage) {
                  eventLog.removeChild(emptyMessage);
              }
              
              eventLog.insertBefore(eventEntry, eventLog.firstChild);
          });
      });
  }
}

// Initialize modal demo when script loads
new ModalDemo();