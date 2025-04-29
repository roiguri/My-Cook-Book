/**
 * ImageProposalModal Component
 * @class
 * @extends HTMLElement
 * 
 * @description
 * A modal interface for proposing new images for existing recipes.
 * Features multiple image upload, preview, and submission handling.
 * 
 * @dependencies
 * - Requires Modal component (`custom-modal`)
 * - Requires ImageHandler component (`image-handler`)
 * - Firebase Storage for image upload
 * - Firebase Firestore for data management
 * 
 * @example
 * // HTML
 * <image-proposal-modal></image-proposal-modal>
 * 
 * // JavaScript
 * const modal = document.querySelector('image-proposal-modal');
 * modal.openForRecipe('recipe-123');
 */
class ImageProposalModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.recipeId = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 1;
        }

        .loading-overlay.active {
          display: flex;
        }

        .proposal-modal {
          position: relative;
          font-family: var(--body-font);
        }
        
        .proposal-content {
          width: 100%;
          max-width: 800px;
        }

        .proposal-header {
          margin-bottom: 20px;
          text-align: center;
        }

        .proposal-header h2 {
          font-family: var(--heading-font-he);
          color: var(--primary-color);
          margin: 0;
        }

        .proposal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .button-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }

        .submit-button,
        .cancel-button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          min-width: 120px;
        }

        .submit-button {
          background-color: var(--primary-color);
          color: white;
        }

        .submit-button:hover {
          background-color: var(--primary-hover);
        }

        .cancel-button {
          background-color: #918772;
          color: white;
        }

        .cancel-button:hover {
          background-color: #5c4033;
        }
      </style>

      <custom-modal>
        <div class="proposal-modal">
          <div class="proposal-content">
            <div class="proposal-header">
              <h2>הצע תמונות למתכון</h2>
            </div>
            <form class="proposal-form">
              <image-handler></image-handler>
              <div class="button-container">
                <button type="button" class="cancel-button">ביטול</button>
                <button type="submit" class="submit-button">שלח תמונות</button>
              </div>
            </form>
            <div class="loading-overlay">
              <loading-spinner size="60px" color="var(--primary-color)"></loading-spinner>
            </div>
          </div>
        </div>
      </custom-modal>
    `;
  }

  setupEventListeners() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    const form = this.shadowRoot.querySelector('.proposal-form');
    const cancelButton = this.shadowRoot.querySelector('.cancel-button');
    
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    cancelButton.addEventListener('click', () => this.close());
  }

  openForRecipe(recipeId) {
    this.recipeId = recipeId;
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.open();
  }

  close() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.close();
  }

  async handleSubmit(event) {
    event.preventDefault();
    const imageHandler = this.shadowRoot.querySelector('image-handler');
    const images = imageHandler.getImages();

    if (!images.length) {
      // TODO: Show error message using message-modal
      return;
    }

    const loadingOverlay = this.shadowRoot.querySelector('.loading-overlay');
    loadingOverlay.classList.add('active');

    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const result = await uploadProposedImages(this.recipeId, images, currentUser.uid);
      
      // Dispatch success event
      this.dispatchEvent(new CustomEvent('images-proposed', {
        detail: { recipeId: this.recipeId, batch: result },
        bubbles: true,
        composed: true
      }));

      this.close();
    } catch (error) {
      console.error('Error uploading images:', error);
      // TODO: Show error message using message-modal
    } finally {
      loadingOverlay.classList.remove('active');
    }
  }
}

customElements.define('image-proposal-modal', ImageProposalModal);