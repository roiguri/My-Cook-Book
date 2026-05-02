import Cropper from 'cropperjs';
import cropperStyles from 'cropperjs/dist/cropper.css?inline';
import { icons } from '../../js/icons.js';

class ImageEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cropper = null;
    this.imageElement = null;
    this.currentImageData = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${cropperStyles}

        .editor-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: var(--font-ui-he, sans-serif);
        }

        .editor-modal.visible {
          display: flex;
        }

        .editor-content {
          background: var(--surface-1, #fff);
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          border-radius: var(--r-md, 12px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--shadow-3, 0 8px 24px rgba(31,29,24,0.16));
        }

        .editor-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--hairline-strong, rgba(31,29,24,0.2));
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .editor-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--ink, #1f1d18);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--ink-3, rgba(31,29,24,0.55));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: var(--surface-2, #f0ede6);
          color: var(--ink, #1f1d18);
        }

        .editor-body {
          flex: 1;
          overflow: hidden;
          background: #1a1a1a;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .editor-body img {
          max-width: 100%;
          max-height: 60vh;
          display: block;
        }

        .editor-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--hairline-strong, rgba(31,29,24,0.2));
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .toolbar {
          display: flex;
          gap: 8px;
        }

        .tool-btn {
          background: var(--surface-2, #f0ede6);
          border: 1px solid var(--hairline-strong, rgba(31,29,24,0.2));
          color: var(--ink, #1f1d18);
          padding: 8px 12px;
          border-radius: var(--r-sm, 8px);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .tool-btn:hover {
          background: var(--surface-3, #e6e2d6);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 8px 20px;
          border-radius: var(--r-sm, 8px);
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--hairline-strong, rgba(31,29,24,0.2));
          color: var(--ink, #1f1d18);
        }

        .btn-secondary:hover {
          background: var(--surface-2, #f0ede6);
        }

        .btn-primary {
          background: var(--primary, #6a994e);
          border: 1px solid var(--primary, #6a994e);
          color: #fff;
        }

        .btn-primary:hover {
          background: var(--primary-dark, #386641);
        }

        [dir="rtl"] .editor-header,
        [dir="rtl"] .editor-footer {
          direction: rtl;
        }
      </style>

      <div class="editor-modal" id="modal">
        <div class="editor-content">
          <div class="editor-header">
            <h3>עריכת תמונה</h3>
            <button class="close-btn" id="close-x" title="סגור">${icons.times}</button>
          </div>
          <div class="editor-body">
            <img id="edit-image" src="" alt="Edit preview">
          </div>
          <div class="editor-footer">
            <div class="toolbar">
              <button class="tool-btn" id="rotate-left" title="סובב שמאלה">
                ${icons.undoAlt} <span>סובב</span>
              </button>
              <button class="tool-btn" id="rotate-right" title="סובב ימינה">
                ${icons.redoAlt} <span>סובב</span>
              </button>
            </div>
            <div class="action-buttons">
              <button class="btn btn-secondary" id="cancel-btn">ביטול</button>
              <button class="btn btn-primary" id="save-btn">שמור שינויים</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.imageElement = this.shadowRoot.getElementById('edit-image');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot.getElementById('close-x').onclick = () => this.close();
    this.shadowRoot.getElementById('cancel-btn').onclick = () => this.close();
    this.shadowRoot.getElementById('rotate-left').onclick = () => this.cropper?.rotate(-90);
    this.shadowRoot.getElementById('rotate-right').onclick = () => this.cropper?.rotate(90);
    this.shadowRoot.getElementById('save-btn').onclick = () => this.save();

    // Close on click outside
    this.shadowRoot.getElementById('modal').onclick = (e) => {
      if (e.target.id === 'modal') this.close();
    };
  }

  open(imageData) {
    this.currentImageData = imageData;
    this.imageElement.src = imageData.preview;

    const modal = this.shadowRoot.getElementById('modal');
    modal.classList.add('visible');

    if (this.cropper) {
      this.cropper.destroy();
    }

    // Initialize Cropper after image is loaded or immediately if already loaded
    if (this.imageElement.complete) {
      this.initCropper();
    } else {
      this.imageElement.onload = () => this.initCropper();
    }
  }

  initCropper() {
    this.cropper = new Cropper(this.imageElement, {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      responsive: true,
    });
  }

  close() {
    const modal = this.shadowRoot.getElementById('modal');
    modal.classList.remove('visible');
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    this.dispatchEvent(new CustomEvent('editor-closed'));
  }

  save() {
    if (!this.cropper) return;

    const canvas = this.cropper.getCroppedCanvas({
      maxWidth: 2048,
      maxHeight: 2048,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    canvas.toBlob((blob) => {
      const editedPreview = URL.createObjectURL(blob);

      // Create a new File object from the blob
      const originalFile = this.currentImageData.file;
      const fileName = originalFile ? originalFile.name : `edited-${this.currentImageData.id}.jpg`;
      const editedFile = new File([blob], fileName, { type: 'image/jpeg' });

      this.dispatchEvent(new CustomEvent('image-saved', {
        detail: {
          imageId: this.currentImageData.id,
          file: editedFile,
          preview: editedPreview
        }
      }));

      this.close();
    }, 'image/jpeg', 0.9);
  }
}

customElements.define('image-editor', ImageEditor);
export default ImageEditor;
