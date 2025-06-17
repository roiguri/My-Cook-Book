import { FirestoreService } from '../../js/services/firestore-service.js';
import authService from '../../js/services/auth-service.js';

export default {
  stylePath: '/src/styles/pages/documents-spa.css',

  async render(params) {
    const response = await fetch(new URL('./documents-page.html', import.meta.url));
    if (!response.ok) {
      throw new Error(`Failed to load documents page template: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  },

  async mount(container, params) {
    // Wait for authentication to be ready and check access permissions
    const currentUser = await authService.waitForAuth();
    if (!currentUser) {
      this.redirectToHome();
      return;
    }

    const hasAccess = await this.checkDocumentAccessStatus(currentUser);
    if (!hasAccess) {
      this.redirectToHome();
      return;
    }

    // Import and initialize required components
    await this.importComponents();
    
    // Initialize PDF viewer functionality
    this.initializePDFViewer();
    
    // Set up auth state listener for logout detection
    this.setupAuthListener();
  },

  async unmount() {
    // Clean up auth listener
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  },

  getTitle() {
    return 'ספר המתכונים של סבתא - Our Kitchen Chronicles';
  },

  getMeta() {
    return {
      description: 'ספר המתכונים המקורי של סבתא - אוסף מתכונים משפחתיים עתיקים',
      keywords: 'ספר מתכונים, מתכונים של סבתא, מתכונים משפחתיים, מתכונים עתיקים'
    };
  },

  async importComponents() {
    // Import PDF viewer component
    await import('../../lib/utilities/pdf_viewer/pdf_viewer.js');
    
    // Import modal component if needed
    await import('../../lib/utilities/modal/modal.js');
  },

  async checkDocumentAccessStatus(user) {
    try {
      const userDoc = await FirestoreService.getDocument('users', user.uid);
      if (userDoc) {
        const userRole = userDoc.role;
        return userRole === 'manager' || userRole === 'approved';
      }
      return false;
    } catch (error) {
      console.error('Error checking document access status:', error);
      return false;
    }
  },

  redirectToHome() {
    // Use SPA navigation to redirect to home
    if (window.spa && window.spa.router) {
      window.spa.router.navigate('/home');
    } else {
      // Fallback to traditional redirect
      window.location.href = '/';
    }
  },

  setupAuthListener() {
    // Listen for auth state changes to detect logout
    this.authUnsubscribe = authService.onAuthStateChanged((user) => {
      if (!user) {
        // User logged out, redirect to home
        this.redirectToHome();
      }
    });
  },

  initializePDFViewer() {
    // The PDF viewer component will handle its own initialization
    // when it's added to the DOM via the HTML template
    const pdfViewer = document.querySelector('pdf-viewer');
    if (pdfViewer) {
      console.log('PDF viewer initialized');
    }
  }
};