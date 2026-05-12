/**
 * UploadZone Web Component
 * ========================
 * A focused upload zone with drag-and-drop, click-to-browse, file validation,
 * keyboard accessibility, and loading/disabled states. Consumers handle the
 * accepted files; this component is responsible only for the upload surface.
 *
 * @attribute {string} accept - Comma-separated MIME types (supports wildcards
 *   like "image/*"). Defaults to "*\/*".
 * @attribute {boolean} multiple - Allow selecting multiple files.
 * @attribute {number} max-size - Maximum file size in bytes (0 = no limit).
 * @attribute {string} label - Primary text shown in the zone.
 * @attribute {string} hint - Secondary status text shown below the label.
 * @attribute {string} loading-text - Text shown while loading. Defaults to
 *   "מעלה קבצים...".
 * @attribute {boolean} disabled - Disable interaction.
 * @attribute {boolean} loading - Show loading spinner and block interaction.
 *
 * @fires upload-files-accepted - Files that passed type/size validation.
 *   detail: { files: File[] }
 * @fires upload-files-rejected - Files that failed validation.
 *   detail: { rejected: Array<{ file: File, reasons: string[] }> }
 *
 * @example
 * <upload-zone
 *   accept="image/jpeg,image/png,image/webp"
 *   multiple
 *   max-size="5242880"
 *   label="גרור תמונות לכאן או לחץ להעלאה"
 *   hint="(מקסימום 5 תמונות, גודל מקסימלי 5MB לתמונה)">
 * </upload-zone>
 */

import { uploadZoneStyles } from '../../../styles/components/upload-zone-styles.js';

const DEFAULT_LOADING_TEXT = 'מעלה קבצים...';

function buildAcceptMatcher(accept) {
  const patterns = accept
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (patterns.length === 0 || patterns.includes('*/*')) {
    return () => true;
  }

  return (mime) =>
    patterns.some((pat) => {
      if (pat.endsWith('/*')) {
        return mime.startsWith(pat.slice(0, -1));
      }
      return mime === pat;
    });
}

class UploadZone extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.handleZoneClick = this.handleZoneClick.bind(this);
    this.handleZoneKeyDown = this.handleZoneKeyDown.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
  }

  static get observedAttributes() {
    return [
      'accept',
      'multiple',
      'max-size',
      'label',
      'hint',
      'loading-text',
      'disabled',
      'loading',
    ];
  }

  connectedCallback() {
    this.render();
    this.attachListeners();
    this.applyState();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;

    if (name === 'disabled' || name === 'loading') {
      this.applyState();
      return;
    }

    // Text/config attributes — re-render content but keep the zone element.
    this.updateContent();
    const fileInput = this.shadowRoot.querySelector('.file-input');
    if (fileInput) {
      fileInput.setAttribute('accept', this.accept);
      fileInput.toggleAttribute('multiple', this.multiple);
    }
  }

  // --- Reflected props ---

  get accept() {
    return this.getAttribute('accept') || '*/*';
  }
  get multiple() {
    return this.hasAttribute('multiple');
  }
  get maxSize() {
    return parseInt(this.getAttribute('max-size') || '0', 10);
  }
  get label() {
    return this.getAttribute('label') || '';
  }
  get hint() {
    return this.getAttribute('hint') || '';
  }
  get loadingText() {
    return this.getAttribute('loading-text') || DEFAULT_LOADING_TEXT;
  }
  get disabled() {
    return this.hasAttribute('disabled');
  }
  get loading() {
    return this.hasAttribute('loading');
  }

  // --- Rendering ---

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        ${uploadZoneStyles}

        .upload-zone {
          margin-bottom: 0;
        }

        .upload-zone__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .upload-zone__content[hidden] { display: none; }

        .loading-spinner-inner {
          border: 3px solid var(--surface-2, #f0ede6);
          border-top: 3px solid var(--primary, #6a994e);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: upload-zone-spin 1s linear infinite;
        }

        @keyframes upload-zone-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>

      <div
        class="upload-zone"
        role="button"
        tabindex="0"
        aria-label="${this.label || 'Upload files'}"
      >
        <div class="upload-zone__content upload-zone__default" data-role="default"></div>
        <div class="upload-zone__content upload-zone__loading" data-role="loading" hidden>
          <div class="loading-spinner-inner" aria-hidden="true"></div>
          <div class="upload-zone__loading-text"></div>
        </div>
        <input
          type="file"
          class="file-input"
          accept="${this.accept}"
          ${this.multiple ? 'multiple' : ''}
          aria-hidden="true"
        />
      </div>
    `;

    this.updateContent();
  }

  updateContent() {
    const defaultEl = this.shadowRoot.querySelector('.upload-zone__default');
    if (defaultEl) {
      defaultEl.innerHTML = `
        <div>${this.label}</div>
        ${this.hint ? `<div class="status-message">${this.hint}</div>` : ''}
      `;
    }
    const loadingTextEl = this.shadowRoot.querySelector('.upload-zone__loading-text');
    if (loadingTextEl) {
      loadingTextEl.textContent = this.loadingText;
    }
    const zone = this.shadowRoot.querySelector('.upload-zone');
    if (zone) {
      zone.setAttribute('aria-label', this.label || 'Upload files');
    }
  }

  attachListeners() {
    const zone = this.shadowRoot.querySelector('.upload-zone');
    const fileInput = this.shadowRoot.querySelector('.file-input');
    zone.addEventListener('click', this.handleZoneClick);
    zone.addEventListener('keydown', this.handleZoneKeyDown);
    zone.addEventListener('dragover', this.handleDragOver);
    zone.addEventListener('dragleave', this.handleDragLeave);
    zone.addEventListener('drop', this.handleDrop);
    fileInput.addEventListener('change', this.handleFileChange);
  }

  // --- Interaction handlers ---

  handleZoneClick(e) {
    if (e.target.closest('.file-input')) return;
    this.openPicker();
  }

  handleZoneKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openPicker();
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.disabled || this.loading) return;
    const zone = this.shadowRoot.querySelector('.upload-zone');
    zone.classList.add('drag-over');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = this.shadowRoot.querySelector('.upload-zone');
    zone.classList.remove('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = this.shadowRoot.querySelector('.upload-zone');
    zone.classList.remove('drag-over');
    if (this.disabled || this.loading) return;
    this.processFiles(Array.from(e.dataTransfer.files));
  }

  handleFileChange(e) {
    this.processFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  // --- File validation ---

  processFiles(files) {
    if (!files.length) return;

    const matchesAccept = buildAcceptMatcher(this.accept);
    const maxSize = this.maxSize;

    const accepted = [];
    const rejected = [];

    for (const file of files) {
      const reasons = [];
      if (!matchesAccept(file.type)) reasons.push('type');
      if (maxSize > 0 && file.size > maxSize) reasons.push('size');
      if (reasons.length) {
        rejected.push({ file, reasons });
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length) {
      this.dispatchEvent(
        new CustomEvent('upload-files-accepted', {
          detail: { files: accepted },
          bubbles: true,
          composed: true,
        }),
      );
    }

    if (rejected.length) {
      this.dispatchEvent(
        new CustomEvent('upload-files-rejected', {
          detail: { rejected },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // --- State application ---

  applyState() {
    const zone = this.shadowRoot?.querySelector('.upload-zone');
    if (!zone) return;

    const disabled = this.disabled;
    const loading = this.loading;

    zone.setAttribute('data-disabled', String(disabled));
    zone.classList.toggle('uploading', loading);
    zone.tabIndex = disabled || loading ? -1 : 0;

    const fileInput = this.shadowRoot.querySelector('.file-input');
    if (fileInput) fileInput.disabled = disabled || loading;

    const defaultEl = this.shadowRoot.querySelector('.upload-zone__default');
    const loadingEl = this.shadowRoot.querySelector('.upload-zone__loading');
    if (defaultEl) defaultEl.hidden = loading;
    if (loadingEl) loadingEl.hidden = !loading;
  }

  // --- Public API ---

  openPicker() {
    if (this.disabled || this.loading) return;
    this.shadowRoot.querySelector('.file-input')?.click();
  }

  setLoading(value) {
    this.toggleAttribute('loading', !!value);
  }

  setDisabled(value) {
    this.toggleAttribute('disabled', !!value);
  }
}

customElements.define('upload-zone', UploadZone);

export default UploadZone;
