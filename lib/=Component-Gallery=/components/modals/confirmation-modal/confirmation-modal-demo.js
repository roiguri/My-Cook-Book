// confirmation-modal-demo.js
class ConfirmationModalDemo {
  constructor() {
      this.modal = document.getElementById('demo-modal');
      this.openDefaultButton = document.querySelector('.open-modal-default');
      this.openCustomButton = document.querySelector('.open-modal-custom');
      this.customizationControls = {
          title: document.getElementById('modal-title'),
          message: document.getElementById('modal-message'),
          approveText: document.getElementById('approve-text'),
          rejectText: document.getElementById('reject-text')
      };
      
      this.initializeDemo();
  }

  initializeDemo() {
      // Setup default modal open button
      if (this.openDefaultButton && this.modal) {
          this.openDefaultButton.addEventListener('click', () => {
              this.modal.confirm(); // Default Hebrew
          });
      }

      // Setup custom modal open button
      if (this.openCustomButton && this.modal) {
          this.openCustomButton.addEventListener('click', () => {
              this.modal.confirm(
                  'Do you want to delete this item?',
                  'Confirm Delete',
                  'Delete',
                  'Cancel'
              );
          });
      }

      // Setup customization controls
      const applyButton = document.querySelector('.customization-sidebar .apply-customization');
      if (applyButton) {
          applyButton.addEventListener('click', () => this.openCustomModal());
      }

      // Setup event logging
      this.setupEventLogging();
      
      // Initial code snippet update
      this.updateCodeSnippet();
  }

  openCustomModal() {
      const { title, message, approveText, rejectText } = this.customizationControls;
      
      this.modal.confirm(
          message.value,
          title.value,
          approveText.value,
          rejectText.value
      );

      this.updateCodeSnippet();
  }

  updateCodeSnippet() {
      const { title, message, approveText, rejectText } = this.customizationControls;
      const code = `
const modal = document.querySelector('confirmation-modal');

modal.confirm(
  '${message.value}',
  '${title.value}',
  '${approveText.value}',
  '${rejectText.value}'
);

modal.addEventListener('confirm-approved', () => {
  console.log('Action approved!');
});

modal.addEventListener('confirm-rejected', () => {
  console.log('Action rejected!');
});`.trim();

      window.gallery.updateCodeSnippet('confirmation-modal', code);
  }

  setupEventLogging() {
      const eventLog = document.getElementById('modal-event-log');
      
      ['modal-opened', 'modal-closed', 'confirm-approved', 'confirm-rejected'].forEach(eventName => {
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

// Initialize demo when script loads
new ConfirmationModalDemo();