/**
 * <ai-image-enhancer>
 *
 * Self-contained component for AI-enhancing a recipe image. The user picks a
 * recipe, picks one of its images, runs the enhancement, then either keeps the
 * result (replacing the recipe image; the previous file is preserved with an
 * `_original` suffix) or discards it.
 *
 * Backend access is gated by the `enhanceFoodImage` callable (auth + role).
 * The component itself performs no role check — mount it only where allowed.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirestoreService } from '../../../js/services/firestore-service.js';
import { StorageService } from '../../../js/services/storage-service.js';
import { getOptimizedImageUrl } from '../../../js/utils/recipes/recipe-image-utils.js';

const MAX_INPUT_DIMENSION = 1536; // px, downscale before send to keep payload small
const JPEG_QUALITY = 0.92;

class AiImageEnhancer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.recipes = [];
    this.filteredRecipes = [];
    this.selectedRecipe = null;
    this.selectedImage = null;
    this.enhancedResult = null; // { blob, dataUrl, mimeType }
    this.isLoading = false;
    this.statusMessage = '';
  }

  connectedCallback() {
    this.render();
    this.loadRecipes();
  }

  async loadRecipes() {
    try {
      this.setStatus('טוען מתכונים...');
      const recipes = await FirestoreService.queryDocuments('recipes', {
        where: [['approved', '==', true]],
      });
      this.recipes = recipes
        .filter((r) => Array.isArray(r.images) && r.images.length > 0)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
      this.filteredRecipes = this.recipes;
      this.setStatus('');
      this.renderRecipeList();
    } catch (error) {
      console.error('Failed to load recipes:', error);
      this.setStatus('שגיאה בטעינת מתכונים');
    }
  }

  setStatus(message) {
    this.statusMessage = message;
    const el = this.shadowRoot.getElementById('status');
    if (el) el.textContent = message;
  }

  filterRecipes(term) {
    const t = (term || '').trim().toLowerCase();
    this.filteredRecipes = t
      ? this.recipes.filter((r) => (r.name || '').toLowerCase().includes(t))
      : this.recipes;
    this.renderRecipeList();
  }

  renderRecipeList() {
    const list = this.shadowRoot.getElementById('recipe-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.filteredRecipes.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'אין מתכונים להצגה';
      list.appendChild(empty);
      return;
    }

    for (const recipe of this.filteredRecipes) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'recipe-item';
      if (this.selectedRecipe && this.selectedRecipe.id === recipe.id) {
        item.classList.add('selected');
      }

      const name = document.createElement('span');
      name.className = 'recipe-name';
      name.textContent = recipe.name;

      const count = document.createElement('span');
      count.className = 'recipe-count';
      count.textContent = `${recipe.images.length} תמונות`;

      item.appendChild(name);
      item.appendChild(count);
      item.addEventListener('click', () => this.handleSelectRecipe(recipe));
      list.appendChild(item);
    }
  }

  async handleSelectRecipe(recipe) {
    this.selectedRecipe = recipe;
    this.selectedImage = null;
    this.enhancedResult = null;
    this.renderRecipeList();
    this.renderEnhancedPreview();
    await this.renderImageGrid();
    this.updateActionState();
  }

  async renderImageGrid() {
    const grid = this.shadowRoot.getElementById('image-grid');
    const wrap = this.shadowRoot.getElementById('image-picker');
    if (!grid || !wrap) return;
    grid.innerHTML = '';

    if (!this.selectedRecipe) {
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = 'block';
    const heading = this.shadowRoot.getElementById('image-picker-title');
    if (heading) heading.textContent = `בחר תמונה — ${this.selectedRecipe.name}`;

    for (const image of this.selectedRecipe.images) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'image-tile';
      if (this.selectedImage && this.selectedImage.id === image.id) {
        tile.classList.add('selected');
      }

      const img = document.createElement('img');
      img.alt = image.fileName || image.id;
      img.loading = 'lazy';
      tile.appendChild(img);

      if (image.isPrimary) {
        const badge = document.createElement('span');
        badge.className = 'primary-badge';
        badge.textContent = 'ראשית';
        tile.appendChild(badge);
      }

      tile.addEventListener('click', () => this.handleSelectImage(image));
      grid.appendChild(tile);

      getOptimizedImageUrl(image, '400x400')
        .then((url) => {
          if (url) img.src = url;
        })
        .catch(() => {});
    }
  }

  handleSelectImage(image) {
    this.selectedImage = image;
    this.enhancedResult = null;
    this.renderImageGrid();
    this.renderEnhancedPreview();
    this.updateActionState();
  }

  updateActionState() {
    const enhanceBtn = this.shadowRoot.getElementById('enhance-btn');
    const saveBtn = this.shadowRoot.getElementById('save-btn');
    const discardBtn = this.shadowRoot.getElementById('discard-btn');
    if (!enhanceBtn) return;

    enhanceBtn.disabled = !this.selectedImage || this.isLoading;
    enhanceBtn.textContent = this.isLoading ? 'מעבד...' : 'שפר תמונה';

    const hasResult = !!this.enhancedResult;
    saveBtn.style.display = hasResult ? '' : 'none';
    discardBtn.style.display = hasResult ? '' : 'none';
    saveBtn.disabled = this.isLoading;
    discardBtn.disabled = this.isLoading;
  }

  async renderEnhancedPreview() {
    const beforeImg = this.shadowRoot.getElementById('before-img');
    const afterImg = this.shadowRoot.getElementById('after-img');
    const compareWrap = this.shadowRoot.getElementById('compare');

    if (!this.selectedImage) {
      compareWrap.style.display = 'none';
      return;
    }

    compareWrap.style.display = 'grid';
    try {
      const url = await getOptimizedImageUrl(this.selectedImage, '1080x1080');
      beforeImg.src = url || '';
    } catch {
      beforeImg.src = '';
    }

    if (this.enhancedResult) {
      afterImg.src = this.enhancedResult.dataUrl;
      afterImg.style.opacity = '1';
    } else {
      afterImg.removeAttribute('src');
      afterImg.style.opacity = '0.25';
    }
  }

  async enhanceSelectedImage() {
    if (!this.selectedImage || this.isLoading) return;

    this.isLoading = true;
    this.enhancedResult = null;
    this.updateActionState();
    this.setStatus('שולח לשיפור בעזרת AI...');

    try {
      const downloadUrl = await StorageService.getFileUrl(this.selectedImage.full);
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
      const sourceBlob = await response.blob();

      const { base64, mimeType } = await this.prepareImagePayload(sourceBlob);

      const functions = getFunctions();
      const enhanceFn = httpsCallable(functions, 'enhanceFoodImage');
      const result = await enhanceFn({ image: { base64, mimeType } });

      const data = result?.data;
      if (!data || !data.base64) {
        throw new Error('Empty response from enhancement service');
      }

      const outMime = data.mimeType || 'image/png';
      const enhancedBlob = await this.base64ToBlob(data.base64, outMime);
      const dataUrl = `data:${outMime};base64,${data.base64}`;

      this.enhancedResult = { blob: enhancedBlob, dataUrl, mimeType: outMime };
      this.setStatus('התמונה שופרה. ניתן לשמור או לבטל.');
    } catch (error) {
      console.error('Image enhancement failed:', error);
      this.setStatus(this.formatError(error));
    } finally {
      this.isLoading = false;
      this.updateActionState();
      this.renderEnhancedPreview();
    }
  }

  formatError(error) {
    const code = error?.code || '';
    if (code === 'functions/unauthenticated') return 'יש להתחבר כדי להשתמש בתכונה זו.';
    if (code === 'functions/permission-denied') return 'אין הרשאה — נדרש תפקיד "מאושר" או "מנהל".';
    return error?.message ? `שגיאה: ${error.message}` : 'שגיאה בשיפור התמונה';
  }

  async saveEnhancedImage() {
    if (!this.enhancedResult || !this.selectedRecipe || !this.selectedImage) return;

    this.isLoading = true;
    this.updateActionState();
    this.setStatus('שומר את התמונה החדשה...');

    try {
      const originalPath = this.selectedImage.full;
      const backupPath = this.makeBackupPath(originalPath);

      // Step 1: Back up the original if no backup exists yet.
      let backupExists = false;
      try {
        await StorageService.getMetadata(backupPath);
        backupExists = true;
      } catch {
        backupExists = false;
      }

      if (!backupExists) {
        const originalUrl = await StorageService.getFileUrl(originalPath);
        const originalResponse = await fetch(originalUrl);
        if (!originalResponse.ok) {
          throw new Error(`Failed to fetch original (${originalResponse.status})`);
        }
        const originalBlob = await originalResponse.blob();
        await StorageService.uploadFile(originalBlob, backupPath);
      }

      // Step 2: Overwrite the original path with the enhanced image. Storage
      // triggers will regenerate WebP variants automatically.
      await StorageService.uploadFile(this.enhancedResult.blob, originalPath);

      // Step 3: Best-effort cleanup of stale WebP variants so the carousel
      // reloads from the new full-size file until the trigger republishes them.
      await Promise.all([
        StorageService.deleteFile(originalPath.replace(/\.[^.]+$/, '_400x400.webp')).catch(
          () => {},
        ),
        StorageService.deleteFile(originalPath.replace(/\.[^.]+$/, '_1080x1080.webp')).catch(
          () => {},
        ),
      ]);

      this.setStatus('התמונה הוחלפה. התמונה המקורית נשמרה כגיבוי.');
      this.enhancedResult = null;
      this.dispatchEvent(
        new CustomEvent('image-enhanced-saved', {
          bubbles: true,
          composed: true,
          detail: {
            recipeId: this.selectedRecipe.id,
            imageId: this.selectedImage.id,
            backupPath,
            backupCreated: !backupExists,
          },
        }),
      );

      // Reload the recipe so subsequent enhancements use fresh data.
      await this.refreshSelectedRecipe();
    } catch (error) {
      console.error('Save failed:', error);
      this.setStatus(this.formatError(error));
    } finally {
      this.isLoading = false;
      this.updateActionState();
      this.renderEnhancedPreview();
    }
  }

  async refreshSelectedRecipe() {
    if (!this.selectedRecipe) return;
    try {
      const fresh = await FirestoreService.getDocument('recipes', this.selectedRecipe.id);
      if (fresh) {
        const idx = this.recipes.findIndex((r) => r.id === this.selectedRecipe.id);
        if (idx !== -1) this.recipes[idx] = fresh;
        this.selectedRecipe = fresh;
        this.selectedImage = null;
        this.filterRecipes(this.shadowRoot.getElementById('search-input')?.value || '');
        await this.renderImageGrid();
        this.renderEnhancedPreview();
      }
    } catch (error) {
      console.warn('Failed to refresh recipe:', error);
    }
  }

  discardEnhancedImage() {
    this.enhancedResult = null;
    this.setStatus('');
    this.updateActionState();
    this.renderEnhancedPreview();
  }

  makeBackupPath(fullPath) {
    return fullPath.replace(/(\.[^.]+)$/, '_original$1');
  }

  async prepareImagePayload(blob) {
    // Downscale large images so the callable payload stays well under 10MB.
    const bitmap = await this.blobToBitmap(blob);
    const { width, height } = this.fitWithin(
      bitmap.width,
      bitmap.height,
      MAX_INPUT_DIMENSION,
      MAX_INPUT_DIMENSION,
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close && bitmap.close();

    const outMime = 'image/jpeg';
    const dataUrl = canvas.toDataURL(outMime, JPEG_QUALITY);
    const base64 = dataUrl.split(',')[1];
    return { base64, mimeType: outMime };
  }

  fitWithin(srcW, srcH, maxW, maxH) {
    const ratio = Math.min(1, maxW / srcW, maxH / srcH);
    return { width: Math.round(srcW * ratio), height: Math.round(srcH * ratio) };
  }

  async blobToBitmap(blob) {
    if (typeof createImageBitmap === 'function') {
      return await createImageBitmap(blob);
    }
    return await new Promise((resolve, reject) => {
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

  async base64ToBlob(base64, mimeType) {
    const res = await fetch(`data:${mimeType};base64,${base64}`);
    return await res.blob();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-ui-he, sans-serif);
          color: var(--ink, #1f1d18);
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
          gap: 16px;
        }

        @media (max-width: 720px) {
          .layout { grid-template-columns: 1fr; }
        }

        .panel {
          background: var(--surface-0, #fff);
          border: 1.5px solid var(--hairline, rgba(31, 29, 24, 0.08));
          border-radius: var(--r-md, 14px);
          padding: 12px;
        }

        .panel h3 {
          margin: 0 0 8px;
          font-family: var(--font-ui-he, sans-serif);
          font-size: 14px;
          font-weight: 600;
          color: var(--ink-3, rgba(31, 29, 24, 0.55));
          letter-spacing: 0.04em;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1.5px solid var(--hairline-strong, rgba(31, 29, 24, 0.15));
          border-radius: var(--r-sm, 10px);
          font-family: var(--font-ui-he, sans-serif);
          font-size: 13px;
          background: var(--surface-0, #fff);
          color: var(--ink, #1f1d18);
          outline: none;
          box-sizing: border-box;
          margin-bottom: 8px;
        }

        .recipe-list {
          max-height: 360px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .recipe-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 10px;
          background: transparent;
          border: 1.5px solid transparent;
          border-radius: var(--r-sm, 10px);
          cursor: pointer;
          text-align: start;
          font-family: var(--font-ui-he, sans-serif);
          color: var(--ink, #1f1d18);
          transition: background-color var(--dur-1, 160ms) var(--ease, ease);
        }

        .recipe-item:hover {
          background: var(--surface-2, #f0ede6);
        }

        .recipe-item.selected {
          background: rgba(106, 153, 78, 0.08);
          border-color: var(--primary, #6a994e);
        }

        .recipe-name {
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .recipe-count {
          flex-shrink: 0;
          font-size: 11px;
          color: var(--ink-3, rgba(31, 29, 24, 0.55));
          background: var(--surface-2, #f0ede6);
          padding: 2px 8px;
          border-radius: var(--r-pill, 999px);
        }

        .empty {
          padding: 16px;
          text-align: center;
          color: var(--ink-3, rgba(31, 29, 24, 0.55));
          font-size: 13px;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
          gap: 8px;
        }

        .image-tile {
          position: relative;
          aspect-ratio: 1 / 1;
          border: 2px solid transparent;
          border-radius: var(--r-sm, 10px);
          padding: 0;
          background: var(--surface-2, #f0ede6);
          cursor: pointer;
          overflow: hidden;
          transition: border-color var(--dur-1, 160ms) var(--ease, ease);
        }

        .image-tile:hover {
          border-color: var(--hairline-strong, rgba(31, 29, 24, 0.15));
        }

        .image-tile.selected {
          border-color: var(--primary, #6a994e);
          box-shadow: 0 0 0 2px rgba(106, 153, 78, 0.2);
        }

        .image-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .primary-badge {
          position: absolute;
          top: 4px;
          inset-inline-start: 4px;
          background: var(--primary, #6a994e);
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: var(--r-pill, 999px);
        }

        .compare {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }

        @media (max-width: 540px) {
          .compare { grid-template-columns: 1fr; }
        }

        .compare-pane {
          background: var(--surface-2, #f0ede6);
          border-radius: var(--r-md, 14px);
          overflow: hidden;
          aspect-ratio: 1 / 1;
          position: relative;
        }

        .compare-pane img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: var(--surface-2, #f0ede6);
          transition: opacity var(--dur-2, 280ms) var(--ease, ease);
        }

        .compare-label {
          position: absolute;
          top: 6px;
          inset-inline-start: 6px;
          background: rgba(31, 29, 24, 0.7);
          color: #fff;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: var(--r-pill, 999px);
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        button.action {
          font-family: var(--font-ui-he, sans-serif);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 18px;
          border-radius: var(--r-pill, 999px);
          cursor: pointer;
          border: 1.5px solid transparent;
          transition:
            background-color var(--dur-1, 160ms) var(--ease, ease),
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
          color: var(--secondary-dark, #bc4749);
          border-color: var(--secondary-dark, #bc4749);
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
      </style>

      <div class="layout">
        <div class="panel">
          <h3>בחר מתכון</h3>
          <input id="search-input" class="search-input" type="text" placeholder="חיפוש מתכון..." />
          <div id="recipe-list" class="recipe-list"></div>
        </div>

        <div class="panel">
          <div id="image-picker" style="display: none;">
            <h3 id="image-picker-title">בחר תמונה</h3>
            <div id="image-grid" class="image-grid"></div>
          </div>

          <div id="compare" class="compare" style="display: none;">
            <div class="compare-pane">
              <span class="compare-label">לפני</span>
              <img id="before-img" alt="לפני" />
            </div>
            <div class="compare-pane">
              <span class="compare-label">אחרי</span>
              <img id="after-img" alt="אחרי" style="opacity: 0.25;" />
            </div>
          </div>

          <div class="actions">
            <button id="enhance-btn" class="action primary" disabled>שפר תמונה</button>
            <button id="save-btn" class="action ghost" style="display: none;">שמור והחלף</button>
            <button id="discard-btn" class="action danger" style="display: none;">בטל</button>
          </div>

          <div id="status" class="status"></div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('search-input').addEventListener('input', (e) => {
      this.filterRecipes(e.target.value);
    });
    this.shadowRoot
      .getElementById('enhance-btn')
      .addEventListener('click', () => this.enhanceSelectedImage());
    this.shadowRoot
      .getElementById('save-btn')
      .addEventListener('click', () => this.saveEnhancedImage());
    this.shadowRoot
      .getElementById('discard-btn')
      .addEventListener('click', () => this.discardEnhancedImage());
  }
}

if (!customElements.get('ai-image-enhancer')) {
  customElements.define('ai-image-enhancer', AiImageEnhancer);
}

export default AiImageEnhancer;
