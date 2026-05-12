/**
 * <ai-image-enhance-modal>
 *
 * Standalone modal for AI-enhancing a single recipe image. Receives a recipe
 * and image via open(recipe, image). Handles the full enhancement lifecycle:
 * fetch → enhance via Cloud Function → before/after compare → save or discard.
 *
 * Decoupled from any page — mount once (e.g. appended to document.body by the
 * caller) and reuse across invocations. Fires `image-enhanced-saved` (composed)
 * on a successful save.
 */

import { enhanceFoodImage } from '../../../js/services/ai-enhancement-service.js';
import { StorageService } from '../../../js/services/storage-service.js';
import { getOptimizedImageUrl } from '../../../js/utils/recipes/recipe-image-utils.js';
import { icons } from '../../../js/icons.js';

const MAX_INPUT_DIMENSION = 1536;
const JPEG_QUALITY = 0.92;

class AiImageEnhanceModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._recipe = null;
    this._image = null;
    this._enhancedResult = null;
    this._isLoading = false;
    this._beforeUrl = null;
    this._viewer = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._handleKeyDown);
    this._unlockScroll();
    if (this._viewer) {
      this._viewer.remove();
      this._viewer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  open(recipe, image) {
    this._recipe = recipe;
    this._image = image;
    this._enhancedResult = null;
    this._isLoading = false;
    this._beforeUrl = null;

    this._updateTitle();
    this._setStatus('');
    this._clearAfterImage();
    this._setSavingOverlay(false);
    this._updateActions();
    this._loadBeforeImage();

    const backdrop = this.shadowRoot.getElementById('backdrop');
    backdrop.style.display = 'flex';
    backdrop.offsetWidth; // force reflow for transition
    backdrop.classList.add('open');

    window.addEventListener('keydown', this._handleKeyDown);
    this._lockScroll();
  }

  // ---------------------------------------------------------------------------
  // Fullscreen viewer (lazy, singleton per modal instance)
  // ---------------------------------------------------------------------------

  async _getViewer() {
    if (!this._viewer) {
      await import('../../utilities/fullscreen-media-viewer/fullscreen-media-viewer.js');
      this._viewer = document.createElement('fullscreen-media-viewer');
      this._viewer.setAttribute('dir', 'rtl');
      document.body.appendChild(this._viewer);
    }
    return this._viewer;
  }

  async _openViewer(startPane) {
    const items = [];
    if (this._beforeUrl) items.push({ path: this._beforeUrl, caption: 'לפני', type: 'image' });
    if (this._enhancedResult)
      items.push({ path: this._enhancedResult.dataUrl, caption: 'אחרי', type: 'image' });
    if (items.length === 0) return;

    const index =
      startPane === 'after' && this._enhancedResult
        ? items.findIndex((i) => i.caption === 'אחרי')
        : 0;

    const viewer = await this._getViewer();
    viewer.setAttribute('media-data', JSON.stringify(items));
    viewer.open(Math.max(0, index));
  }

  // ---------------------------------------------------------------------------
  // Internal: open / close
  // ---------------------------------------------------------------------------

  _close() {
    const backdrop = this.shadowRoot.getElementById('backdrop');
    backdrop.classList.remove('open');
    window.removeEventListener('keydown', this._handleKeyDown);
    this._unlockScroll();
    setTimeout(() => {
      if (!backdrop.classList.contains('open')) backdrop.style.display = 'none';
    }, 280);
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape') this._close();
  }

  _lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  _unlockScroll() {
    document.body.style.overflow = '';
  }

  // ---------------------------------------------------------------------------
  // Internal: UI helpers
  // ---------------------------------------------------------------------------

  _updateTitle() {
    const el = this.shadowRoot.getElementById('modal-title');
    if (el && this._recipe) el.textContent = `שיפור תמונה — ${this._recipe.name}`;
  }

  async _loadBeforeImage() {
    const img = this.shadowRoot.getElementById('before-img');
    const spinner = this.shadowRoot.getElementById('before-loading');
    if (!img || !this._image) return;

    img.style.display = 'none';
    img.removeAttribute('src');
    if (spinner) spinner.style.display = 'flex';

    try {
      const url = await getOptimizedImageUrl(this._image, '1080x1080');
      if (url) {
        img.onload = () => {
          img.style.display = 'block';
          if (spinner) spinner.style.display = 'none';
          this._beforeUrl = url;
          this._updatePaneHints();
        };
        img.onerror = () => {
          if (spinner) spinner.style.display = 'none';
        };
        img.src = url;
      } else {
        if (spinner) spinner.style.display = 'none';
      }
    } catch {
      if (spinner) spinner.style.display = 'none';
    }
  }

  _clearAfterImage() {
    const img = this.shadowRoot.getElementById('after-img');
    const placeholder = this.shadowRoot.getElementById('after-placeholder');
    const loading = this.shadowRoot.getElementById('after-loading');
    if (img) img.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  _setAfterPaneLoading(isLoading) {
    const img = this.shadowRoot.getElementById('after-img');
    const placeholder = this.shadowRoot.getElementById('after-placeholder');
    const loading = this.shadowRoot.getElementById('after-loading');
    if (isLoading) {
      if (img) img.style.display = 'none';
      if (placeholder) placeholder.style.display = 'none';
      if (loading) loading.style.display = 'block';
    } else if (loading) {
      loading.style.display = 'none';
    }
  }

  _setSavingOverlay(isSaving) {
    const overlay = this.shadowRoot.getElementById('saving-overlay');
    if (overlay) overlay.hidden = !isSaving;
  }

  _updatePaneHints() {
    const beforePane = this.shadowRoot.getElementById('before-pane');
    const afterPane = this.shadowRoot.getElementById('after-pane');
    if (beforePane) beforePane.classList.toggle('pane-clickable', !!this._beforeUrl);
    if (afterPane) afterPane.classList.toggle('pane-clickable', !!this._enhancedResult);
  }

  _setStatus(message) {
    const el = this.shadowRoot.getElementById('status');
    if (el) el.textContent = message;
  }

  _updateActions() {
    const enhanceBtn = this.shadowRoot.getElementById('enhance-btn');
    const saveBtn = this.shadowRoot.getElementById('save-btn');
    const discardBtn = this.shadowRoot.getElementById('discard-btn');
    if (!enhanceBtn) return;

    const hasResult = !!this._enhancedResult;
    enhanceBtn.style.display = hasResult ? 'none' : '';
    enhanceBtn.disabled = this._isLoading;
    enhanceBtn.textContent = this._isLoading ? 'מעבד...' : 'שפר תמונה';

    saveBtn.style.display = hasResult ? '' : 'none';
    discardBtn.style.display = hasResult ? '' : 'none';
    saveBtn.disabled = this._isLoading;
    discardBtn.disabled = this._isLoading;
  }

  // ---------------------------------------------------------------------------
  // Internal: enhancement + save
  // ---------------------------------------------------------------------------

  async _enhance() {
    if (!this._image || this._isLoading) return;

    this._isLoading = true;
    this._enhancedResult = null;
    this._updateActions();
    this._setAfterPaneLoading(true);
    this._setStatus('שולח לשיפור בעזרת AI...');

    try {
      const downloadUrl = await StorageService.getFileUrl(this._image.full);
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
      const sourceBlob = await response.blob();

      const { base64, mimeType } = await this._preparePayload(sourceBlob);
      const data = await enhanceFoodImage({ base64, mimeType });

      const outMime = data.mimeType || 'image/png';
      const enhancedBlob = await this._base64ToBlob(data.base64, outMime);
      const dataUrl = `data:${outMime};base64,${data.base64}`;

      this._enhancedResult = { blob: enhancedBlob, dataUrl, mimeType: outMime };

      const afterImg = this.shadowRoot.getElementById('after-img');
      const afterPlaceholder = this.shadowRoot.getElementById('after-placeholder');
      this._setAfterPaneLoading(false);
      if (afterImg) {
        afterImg.src = dataUrl;
        afterImg.style.display = 'block';
      }
      if (afterPlaceholder) afterPlaceholder.style.display = 'none';
      this._updatePaneHints();
      this._setStatus('התמונה שופרה. ניתן לשמור או לבטל.');
    } catch (error) {
      console.error('Image enhancement failed:', error);
      // Restore the placeholder so the after pane stops looking like it's loading.
      this._clearAfterImage();
      this._setStatus(this._formatError(error));
    } finally {
      this._isLoading = false;
      this._updateActions();
    }
  }

  async _save() {
    if (!this._enhancedResult || !this._recipe || !this._image) return;

    this._isLoading = true;
    this._updateActions();
    this._setSavingOverlay(true);
    this._setStatus('שומר את התמונה החדשה...');

    try {
      const originalPath = this._image.full;
      const backupPath = this._makeBackupPath(originalPath);

      // Back up the original once (idempotent).
      let backupExists = false;
      try {
        await StorageService.getMetadata(backupPath);
        backupExists = true;
      } catch {
        backupExists = false;
      }

      if (!backupExists) {
        const originalUrl = await StorageService.getFileUrl(originalPath);
        const origResponse = await fetch(originalUrl);
        if (!origResponse.ok) throw new Error(`Failed to fetch original (${origResponse.status})`);
        await StorageService.uploadFile(await origResponse.blob(), backupPath);
      }

      // Overwrite original; Storage trigger regenerates WebP variants.
      await StorageService.uploadFile(this._enhancedResult.blob, originalPath);

      // Best-effort stale WebP cleanup so the carousel refreshes promptly.
      await Promise.all([
        StorageService.deleteFile(originalPath.replace(/\.[^.]+$/, '_400x400.webp')).catch(
          () => {},
        ),
        StorageService.deleteFile(originalPath.replace(/\.[^.]+$/, '_1080x1080.webp')).catch(
          () => {},
        ),
      ]);

      this._setStatus('התמונה הוחלפה. התמונה המקורית נשמרה כגיבוי.');

      this.dispatchEvent(
        new CustomEvent('image-enhanced-saved', {
          bubbles: true,
          composed: true,
          detail: {
            recipeId: this._recipe.id,
            imageId: this._image.id,
            backupPath,
            backupCreated: !backupExists,
          },
        }),
      );

      setTimeout(() => this._close(), 1200);
    } catch (error) {
      console.error('Save failed:', error);
      this._setSavingOverlay(false);
      this._setStatus(this._formatError(error));
    } finally {
      this._isLoading = false;
      this._updateActions();
    }
  }

  _discard() {
    this._enhancedResult = null;
    this._clearAfterImage();
    this._updatePaneHints();
    this._setStatus('');
    this._updateActions();
  }

  _formatError(error) {
    const code = error?.code || '';
    if (code === 'functions/unauthenticated') return 'יש להתחבר כדי להשתמש בתכונה זו.';
    if (code === 'functions/permission-denied') return 'אין הרשאה — תכונה זו זמינה למנהלים בלבד.';
    return error?.message ? `שגיאה: ${error.message}` : 'שגיאה בשיפור התמונה';
  }

  _makeBackupPath(fullPath) {
    return fullPath.replace(/(\.[^.]+)$/, '_original$1');
  }

  // ---------------------------------------------------------------------------
  // Internal: image utilities
  // ---------------------------------------------------------------------------

  async _preparePayload(blob) {
    const bitmap = await this._blobToBitmap(blob);
    const { width, height } = this._fitWithin(
      bitmap.width,
      bitmap.height,
      MAX_INPUT_DIMENSION,
      MAX_INPUT_DIMENSION,
    );
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
  }

  _fitWithin(srcW, srcH, maxW, maxH) {
    const ratio = Math.min(1, maxW / srcW, maxH / srcH);
    return { width: Math.round(srcW * ratio), height: Math.round(srcH * ratio) };
  }

  async _blobToBitmap(blob) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  async _base64ToBlob(base64, mimeType) {
    return (await fetch(`data:${mimeType};base64,${base64}`)).blob();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  _bindEvents() {
    const sr = this.shadowRoot;
    sr.getElementById('backdrop').addEventListener('click', (e) => {
      if (e.target === sr.getElementById('backdrop')) this._close();
    });
    sr.getElementById('close-btn').addEventListener('click', () => this._close());
    sr.getElementById('enhance-btn').addEventListener('click', () => this._enhance());
    sr.getElementById('save-btn').addEventListener('click', () => this._save());
    sr.getElementById('discard-btn').addEventListener('click', () => this._discard());
    sr.getElementById('before-pane').addEventListener('click', () => {
      if (this._beforeUrl) this._openViewer('before');
    });
    sr.getElementById('after-pane').addEventListener('click', () => {
      if (this._enhancedResult) this._openViewer('after');
    });
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          font-family: var(--font-ui-he, sans-serif);
        }

        .backdrop {
          position: fixed;
          inset: 0;
          z-index: var(--z-modal, 2000);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(26, 26, 26, 0.55);
          opacity: 0;
          visibility: hidden;
          transition: opacity var(--dur-2, 280ms) var(--ease, ease),
                      visibility var(--dur-2, 280ms) var(--ease, ease);
        }

        .backdrop.open {
          opacity: 1;
          visibility: visible;
        }

        @media (max-width: 540px) {
          .backdrop { padding: 4px; }
        }

        .dialog {
          position: relative;
          width: min(640px, 90vw);
          max-height: 86vh;
          display: flex;
          flex-direction: column;
          background: var(--surface-1, #fff);
          border: 1px solid var(--hairline, rgba(31, 29, 24, 0.12));
          border-radius: var(--r-xl, 20px);
          box-shadow: var(--shadow-3, 0 8px 32px rgba(31,29,24,0.18), 0 2px 8px rgba(31,29,24,0.08));
          box-sizing: border-box;
          direction: rtl;
          transform: translateY(16px) scale(0.98);
          transition: transform var(--dur-2, 280ms) var(--ease, ease);
        }

        .dialog-body {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 28px 32px 32px;
        }

        .backdrop.open .dialog {
          transform: none;
        }

        .close-btn {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid var(--hairline, rgba(31,29,24,0.12));
          background: var(--surface-0, #fafaf8);
          cursor: pointer;
          color: var(--ink, #1f1d18);
          font-size: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background var(--dur-1, 160ms);
          line-height: 1;
          padding: 0;
        }

        .close-btn:hover {
          background: var(--surface-2, #f0ede6);
        }

        .title {
          margin: 0 0 16px;
          font-family: var(--font-ui-he, sans-serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--ink, #1f1d18);
          padding-inline-end: 40px;
        }

        .compare {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 480px) {
          .compare { grid-template-columns: 1fr; }
        }

        .compare-pane {
          position: relative;
          background: var(--surface-2, #f0ede6);
          border-radius: var(--r-md, 14px);
          overflow: hidden;
          aspect-ratio: 1 / 1;
        }

        .compare-pane img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          background: var(--surface-2, #f0ede6);
        }

        .pane-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            var(--surface-2, #f0ede6) 0%,
            rgba(255, 255, 255, 0.65) 50%,
            var(--surface-2, #f0ede6) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .after-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--ink-4, rgba(31, 29, 24, 0.35));
          font-size: 12px;
          text-align: center;
          padding: 12px;
          box-sizing: border-box;
          user-select: none;
        }

        .placeholder-icon {
          font-size: 32px;
          opacity: 0.4;
          line-height: 1;
        }

        .compare-label {
          position: absolute;
          top: 6px;
          inset-inline-start: 6px;
          z-index: 1;
          background: rgba(31, 29, 24, 0.7);
          color: #fff;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: var(--r-pill, 999px);
          pointer-events: none;
        }

        .compare-pane.pane-clickable {
          cursor: zoom-in;
        }

        .compare-pane.pane-clickable:hover img {
          filter: brightness(1.06);
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        button.action {
          font-family: var(--font-ui-he, sans-serif);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 18px;
          border-radius: var(--r-pill, 999px);
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: background-color var(--dur-1, 160ms) var(--ease, ease),
                      color var(--dur-1, 160ms) var(--ease, ease);
        }

        button.action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        button.primary {
          background: var(--primary, #6a994e);
          color: #fff;
        }

        button.primary:hover:not(:disabled) {
          background: var(--primary-dark, #557a3e);
        }

        button.ghost {
          background: transparent;
          color: var(--primary-dark, #557a3e);
          border-color: var(--primary-dark, #557a3e);
        }

        button.ghost:hover:not(:disabled) {
          background: rgba(106, 153, 78, 0.08);
        }

        button.danger {
          background: transparent;
          color: var(--secondary, #bc4749);
          border-color: var(--secondary, #bc4749);
        }

        button.danger:hover:not(:disabled) {
          background: rgba(188, 71, 73, 0.08);
        }

        .status {
          margin-top: 10px;
          font-size: 12px;
          color: var(--ink-3, rgba(31, 29, 24, 0.55));
          min-height: 16px;
        }

        .saving-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.88);
          border-radius: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          z-index: 3;
        }

        .saving-overlay[hidden] {
          display: none;
        }

        .spinner {
          width: 38px;
          height: 38px;
          border: 3px solid var(--hairline, rgba(31, 29, 24, 0.12));
          border-top-color: var(--primary, #6a994e);
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .saving-text {
          font-family: var(--font-ui-he, sans-serif);
          font-size: 13px;
          font-weight: 500;
          color: var(--ink, #1f1d18);
        }
      </style>

      <div id="backdrop" class="backdrop" style="display: none;">
        <div class="dialog" role="dialog" aria-modal="true">
          <button id="close-btn" class="close-btn" aria-label="סגור">&times;</button>
          <div class="dialog-body">
            <h2 id="modal-title" class="title"></h2>

            <div class="compare">
              <div id="before-pane" class="compare-pane">
                <span class="compare-label">לפני</span>
                <img id="before-img" alt="לפני" style="display: none;" />
                <div id="before-loading" class="pane-shimmer"></div>
              </div>
              <div id="after-pane" class="compare-pane">
                <span class="compare-label">אחרי</span>
                <img id="after-img" alt="אחרי" style="display: none;" />
                <div id="after-loading" class="pane-shimmer" style="display: none;"></div>
                <div id="after-placeholder" class="after-placeholder">
                  <span class="placeholder-icon">${icons.magic}</span>
                  <span>התמונה המשופרת<br/>תופיע כאן</span>
                </div>
              </div>
            </div>

            <div class="actions">
              <button id="enhance-btn" class="action primary">שפר תמונה</button>
              <button id="save-btn" class="action ghost" style="display: none;">שמור והחלף</button>
              <button id="discard-btn" class="action danger" style="display: none;">בטל</button>
            </div>

            <div id="status" class="status"></div>
          </div>

          <div id="saving-overlay" class="saving-overlay" hidden>
            <div class="spinner" role="status" aria-label="שומר"></div>
            <div class="saving-text">שומר את התמונה...</div>
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('ai-image-enhance-modal')) {
  customElements.define('ai-image-enhance-modal', AiImageEnhanceModal);
}

export default AiImageEnhanceModal;
