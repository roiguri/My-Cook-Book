import { collectRecipeFormData } from './form-data-collector.js';
import '../../../lib/modals/confirmation_modal/confirmation_modal.js';

class FormProtectionManager {
  constructor() {
    this.isActive = false;
    this.shadowRoot = null;
    this.initialData = null;
    this.isDirty = false;
    this.onBeforeUnload = this.onBeforeUnload.bind(this);
    this.checkDirtyState = this.checkDirtyState.bind(this);
    this.confirmationModal = null;
  }

  initialize(shadowRoot, initialData = null) {
    if (this.isActive) {
      this.cleanup();
    }

    this.shadowRoot = shadowRoot;
    this.initialData = initialData || this.captureCurrentData();
    this.isDirty = false;
    this.isActive = true;

    window.addEventListener('beforeunload', this.onBeforeUnload);

    const router = this.getRouter();
    if (router && typeof router.addNavigationGuard === 'function') {
      router.addNavigationGuard('form-protection', this.checkNavigationGuard.bind(this));
    } else {
      console.warn('Router not available for navigation guard registration');
    }
  }

  captureCurrentData() {
    if (!this.shadowRoot) return null;
    return collectRecipeFormData(this.shadowRoot);
  }

  checkDirtyState() {
    if (!this.shadowRoot || !this.initialData) {
      return false;
    }

    const currentData = this.captureCurrentData();
    const isDirty = !this.deepEqual(this.initialData, currentData);

    if (isDirty !== this.isDirty) {
      this.isDirty = isDirty;
      this.dispatchDirtyStateChange(isDirty);
    }

    return this.isDirty;
  }

  deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    // Treat null, undefined, empty arrays, and empty strings as equivalent (no data)
    const isEmpty1 = obj1 == null || obj1 === '' || (Array.isArray(obj1) && obj1.length === 0);
    const isEmpty2 = obj2 == null || obj2 === '' || (Array.isArray(obj2) && obj2.length === 0);

    if (isEmpty1 && isEmpty2) return true;
    if (isEmpty1 || isEmpty2) return false;

    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Get all unique keys from both objects
    const allKeys = new Set([...keys1, ...keys2]);

    // Compare each key, treating missing keys as undefined
    for (const key of allKeys) {
      const val1 = obj1[key];
      const val2 = obj2[key];
      if (!this.deepEqual(val1, val2)) return false;
    }

    return true;
  }

  onBeforeUnload(event) {
    if (!this.isActive || !this.checkDirtyState()) {
      return;
    }

    const message = 'You have unsaved changes. Are you sure you want to leave?';
    event.preventDefault();
    event.returnValue = message;
    return message;
  }

  async checkNavigationGuard(targetPath) {
    if (!this.isActive || !this.checkDirtyState()) {
      return true;
    }

    return new Promise((resolve) => {
      this.showConfirmationModal(resolve);
    });
  }

  showConfirmationModal(resolve) {
    if (!this.confirmationModal) {
      this.confirmationModal = this.createConfirmationModal();
    }

    const modal = this.confirmationModal;
    const handleApproved = () => {
      this.discardAndNavigate(resolve);
      modal.removeEventListener('confirm-approved', handleApproved);
      modal.removeEventListener('confirm-rejected', handleRejected);
    };

    const handleRejected = () => {
      resolve(false);
      modal.removeEventListener('confirm-approved', handleApproved);
      modal.removeEventListener('confirm-rejected', handleRejected);
    };

    modal.addEventListener('confirm-approved', handleApproved);
    modal.addEventListener('confirm-rejected', handleRejected);
    modal.confirm(
      'יש לך שינויים שלא נשמרו שיאבדו. האם אתה בטוח שברצונך לעזוב את הדף?',
      'שינויים לא נשמרו',
      'המשך בכל זאת',
      'ביטול',
    );
  }

  createConfirmationModal() {
    let modal = document.querySelector('confirmation-modal');
    if (!modal) {
      modal = document.createElement('confirmation-modal');
      document.body.appendChild(modal);
    }
    return modal;
  }

  discardAndNavigate(resolve) {
    this.isDirty = false;
    this.dispatchDirtyStateChange(false);
    resolve(true);
  }

  updateInitialData() {
    this.initialData = this.captureCurrentData();
    this.isDirty = false;
    this.dispatchDirtyStateChange(false);
  }

  dispatchDirtyStateChange(isDirty) {
    if (!this.shadowRoot) return;

    const dirtyEvent = new CustomEvent('form-dirty-state-changed', {
      bubbles: true,
      composed: true,
      detail: { isDirty },
    });

    this.shadowRoot.dispatchEvent(dirtyEvent);
  }

  markAsSaved() {
    this.updateInitialData();
  }

  markAsDirty() {
    this.isDirty = true;
    this.dispatchDirtyStateChange(true);
  }

  temporaryDisable() {
    this.isActive = false;
  }

  enable() {
    this.isActive = true;
  }

  cleanup() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);

    const router = this.getRouter();
    if (router && typeof router.removeNavigationGuard === 'function') {
      router.removeNavigationGuard('form-protection');
    }

    this.isActive = false;
    this.shadowRoot = null;
    this.initialData = null;
    this.isDirty = false;
    this.confirmationModal = null;
  }

  getRouter() {
    return window.spa && window.spa.router ? window.spa.router : null;
  }

  getStatus() {
    return {
      isActive: this.isActive,
      isDirty: this.isDirty,
      hasInitialData: !!this.initialData,
    };
  }
}

export const formProtectionManager = new FormProtectionManager();
export default formProtectionManager;
