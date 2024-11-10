// missing-image-upload-demo.js
class MissingImageUploadDemo {
  constructor() {
      this.uploader = document.getElementById('demo-uploader');
      this.openButton = document.querySelector('.open-uploader');
      this.customizationControls = {
          recipeId: document.getElementById('recipe-id')
      };
      
      this.initializeDemo();
  }

  initializeDemo() {
      if (this.openButton) {
          this.openButton.addEventListener('click', () => {
              this.uploader.openModalForRecipe(this.customizationControls.recipeId.value);
          });
      }

      const applyButton = document.querySelector('.customization-sidebar .apply-customization');
      if (applyButton) {
          applyButton.addEventListener('click', () => {
              this.uploader.openModalForRecipe(this.customizationControls.recipeId.value);
          });
      }

      this.setupEventLogging();
      this.setupMockFirebase();
  }

  updateCodeSnippet(recipeId = 'recipe-123') {
      const code = `
const uploader = document.querySelector('missing-image-upload');
uploader.openModalForRecipe('${recipeId}');`.trim();

      window.gallery.updateCodeSnippet('missing-image-upload', code);
  }

  setupEventLogging() {
      const eventLog = document.getElementById('uploader-event-log');
      
      ['modal-opened', 'modal-closed'].forEach(eventName => {
          this.uploader.addEventListener(eventName, () => {
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

  setupMockFirebase() {
      // Mock Firebase operations for demo purposes
      this.uploader.uploadImageToFirebase = async function(file) {
          return new Promise((resolve) => {
              setTimeout(() => {
                  console.log('Mock image upload completed');
                  resolve({
                      fullSizeUrl: 'mock-full-url',
                      compressedUrl: 'mock-compressed-url'
                  });
              }, 1000);
          });
      };
  }
}

new MissingImageUploadDemo();