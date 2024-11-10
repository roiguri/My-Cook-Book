// message-modal-demo.js
class MessageModalDemo {
  constructor() {
      this.modal = document.getElementById('demo-message');
      this.openDemoButton = document.querySelector('.open-demo');
      this.openCustomButton = document.querySelector('.open-custom');
      this.customizationControls = {
          message: document.getElementById('message-text'),
          title: document.getElementById('title-text')
      };
      
      this.initializeDemo();
  }

  initializeDemo() {
      if (this.openDemoButton) {
          this.openDemoButton.addEventListener('click', () => {
              this.modal.show('This is a default message', 'Default Title');
          });
      }

      if (this.openCustomButton) {
          this.openCustomButton.addEventListener('click', () => {
              this.showCustomMessage();
          });
      }

      const applyButton = document.querySelector('.customization-sidebar .apply-customization');
      if (applyButton) {
          applyButton.addEventListener('click', () => this.showCustomMessage());
      }

      this.setupEventLogging();
  }

  showCustomMessage() {
      const message = this.customizationControls.message.value;
      const title = this.customizationControls.title.value;
      
      this.modal.show(message, title);
      this.updateCodeSnippet(message, title);
  }

  updateCodeSnippet(message = 'Your message here', title = 'Optional Title') {
      const code = `
const modal = document.querySelector('message-modal');
modal.show('${message}', '${title}');`.trim();

      window.gallery.updateCodeSnippet('message-modal', code);
  }

  setupEventLogging() {
      const eventLog = document.getElementById('message-modal-event-log');
      
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

new MessageModalDemo();