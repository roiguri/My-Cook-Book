// image-approval-demo.js
class ImageApprovalDemo {
  constructor() {
      this.approvalModal = document.getElementById('demo-approval');
      this.openDemoButton = document.querySelector('.open-demo');
      this.customizationControls = {
          recipeName: document.getElementById('demo-recipe-name'),
          imageUrl: document.getElementById('demo-image-url')
      };

      // Sample data for demo purposes
      this.demoRecipeId = 'demo-recipe-123';
      
      this.initializeDemo();
  }

  initializeDemo() {
      // Setup demo button
      if (this.openDemoButton && this.approvalModal) {
          this.openDemoButton.addEventListener('click', () => {
              this.openWithDefaultData();
          });
      }

      // Setup customization controls
      const applyButton = document.querySelector('.customization-sidebar .apply-customization');
      if (applyButton) {
          applyButton.addEventListener('click', () => this.openWithCustomData());
      }

      // Setup event logging
      this.setupEventLogging();
      
      // Initial code snippet update
      this.updateCodeSnippet();
  }

  openWithDefaultData() {
      const defaultData = {
          imageUrl: '/api/placeholder/400/300',
          recipeId: this.demoRecipeId,
          recipeName: 'Sample Recipe'
      };

      this.approvalModal.openModalForImage(defaultData);
  }

  openWithCustomData() {
      const customData = {
          imageUrl: this.customizationControls.imageUrl.value,
          recipeId: this.demoRecipeId,
          recipeName: this.customizationControls.recipeName.value
      };

      this.approvalModal.openModalForImage(customData);
      this.updateCodeSnippet(customData);
  }

  updateCodeSnippet(data = null) {
      const sampleData = data || {
          imageUrl: '/api/placeholder/400/300',
          recipeId: this.demoRecipeId,
          recipeName: 'Sample Recipe'
      };

      const code = `
const approvalModal = document.querySelector('image-approval-component');

// Open modal with image data
approvalModal.openModalForImage({
  imageUrl: '${sampleData.imageUrl}',
  recipeId: '${sampleData.recipeId}',
  recipeName: '${sampleData.recipeName}'
});

// Handle approval/rejection events
approvalModal.addEventListener('image-approved', (e) => {
  console.log('Image approved for recipe:', e.detail.recipeId);
});

approvalModal.addEventListener('image-rejected', (e) => {
  console.log('Image rejected for recipe:', e.detail.recipeId);
});`.trim();

      window.gallery.updateCodeSnippet('image-approval', code);
  }

  setupEventLogging() {
      const eventLog = document.getElementById('approval-event-log');
      
      ['image-approved', 'image-rejected', 'modal-opened', 'modal-closed'].forEach(eventName => {
          this.approvalModal.addEventListener(eventName, (e) => {
              const timestamp = new Date().toLocaleTimeString();
              const eventEntry = document.createElement('div');
              eventEntry.className = 'event-entry';
              
              let detailText = '';
              if (e.detail && e.detail.recipeId) {
                  detailText = ` (Recipe ID: ${e.detail.recipeId})`;
              }
              
              eventEntry.textContent = `${timestamp}: ${eventName}${detailText}`;
              
              const emptyMessage = eventLog.querySelector('.event-log-empty');
              if (emptyMessage) {
                  eventLog.removeChild(emptyMessage);
              }
              
              eventLog.insertBefore(eventEntry, eventLog.firstChild);
          });
      });

      // For demo purposes, override Firebase operations with mock functions
      this.setupMockOperations();
  }

  setupMockOperations() {
      // Override Firebase operations for demo purposes
      this.approvalModal.handleApprove = async function() {
          // Simulate successful approval
          this.dispatchEvent(new CustomEvent('image-approved', {
              bubbles: true,
              composed: true,
              detail: { recipeId: this.imageData.recipeId }
          }));
          
          // Close the modal
          this.closeModal();
      };

      this.approvalModal.handleReject = async function() {
          // Simulate successful rejection
          this.dispatchEvent(new CustomEvent('image-rejected', {
              bubbles: true,
              composed: true,
              detail: { recipeId: this.imageData.recipeId }
          }));
          
          // Close the modal
          this.closeModal();
      };
  }
}

// Initialize demo when script loads
new ImageApprovalDemo();