// FIXME: leave favorites page when a user logs out
/**
 * AuthController Component
 * @class
 * @extends HTMLElement
 * 
 * @description
 * A custom web component that manages authentication state and provides
 * core authentication functionality for the application.
 * 
 * @example
 * // HTML
 * <auth-controller>
 *   <custom-modal>
 *     <!-- Auth content will be rendered here -->
 *   </custom-modal>
 * </auth-controller>
 * 
 * @property {boolean} isAuthenticated - Indicates whether a user is currently authenticated
 * @property {Object} currentUser - The currently authenticated user object
 * 
 * @fires auth-state-changed - When the authentication state changes
 * @fires user-role-changed - When the user's role changes
 * 
 * @requires firebase
 * @requires ./modal.js
 */

class AuthController extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  connectedCallback() {
    this.render();
    this.setupAuthStateObserver();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: contents;
        }
      </style>
      <custom-modal height="auto">
        <slot></slot>
      </custom-modal>
    `;
  }

  styles() {
    return `
      :host {
        display: contents;
      }
    `;
  }

  setupAuthStateObserver() {
    firebase.auth().onAuthStateChanged(async (user) => {
      this.isAuthenticated = !!user;
      this.currentUser = user;

      if (user) {
        // User is signed in
        const roles = await this.checkUserRoles(user);
        this.updateNavigation(user, roles);
        this.dispatchAuthStateChanged({ 
          user, 
          isAuthenticated: true,
          ...roles
        });
      } else {
        // User is signed out
        this.updateNavigation(null);
        this.dispatchAuthStateChanged({ 
          user: null, 
          isAuthenticated: false,
          isManager: false,
          isApproved: false
        });
      }
    });
  }

  async checkUserRoles(user) {
    try {
      const doc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (doc.exists) {
        const role = doc.data().role;
        return {
          isManager: role === 'manager',
          isApproved: role === 'approved' || role === 'manager'
        };
      }
      return { isManager: false, isApproved: false };
    } catch (error) {
      console.error('Error checking user roles:', error);
      return { isManager: false, isApproved: false };
    }
  }


  updateNavigation(user, roles = { isManager: false, isApproved: false }) {
    const navMenu = document.querySelector('nav ul');
    if (!navMenu) return;

    // Remove dynamic tabs first
    ['profile-tab', 'documents-tab', 'dashboard-tab'].forEach(id => {
        const tab = document.querySelector(`#${id}`);
        if (tab) tab.remove();
    });

    if (!user) return; // If no user, stop here with basic navigation

    // Helper function to create navigation item
    const createNavItem = (id, text, href) => {
        const item = document.createElement('li');
        item.id = id;
        const link = document.createElement('a');
        link.href = this.getCorrectPath(href);
        link.textContent = text;
        link.classList.add('btn-3d');
        item.appendChild(link);
        return item;
    };

    // Add Favorites tab for all logged in users
    navMenu.appendChild(
        createNavItem('profile-tab', 'מועדפים', '/pages/profile.html')
    );

    // Add Grandmother's Recipes for approved users and managers
    if (roles.isApproved || roles.isManager) {
        navMenu.appendChild(
            createNavItem('documents-tab', 'המטעמים של סבתא', '/pages/documents.html')
        );
    }

    // Add Management Interface for managers
    if (roles.isManager) {
        navMenu.appendChild(
            createNavItem('dashboard-tab', 'ממשק ניהול', '/pages/manager-dashboard.html')
        );
    }
  }

  getCorrectPath(path) {
      // Check if we're on index page or in a subdirectory
      if (window.location.pathname.endsWith('index.html') || 
          window.location.pathname.endsWith('/')) {
          return '.' + path;
      }
      return '..' + path;
  }

  dispatchAuthStateChanged(detail) {
    const event = new CustomEvent('auth-state-changed', {
      bubbles: true,
      composed: true,
      detail
    });
    this.dispatchEvent(event);
  }

  // Authentication Methods
  async handleLogin(email, password, remember = false) {
    try {
        const persistence = remember 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        console.log('Setting persistence:', persistence);
        await firebase.auth().setPersistence(persistence);
        
        console.log('Attempting login with:', { email });
        return await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
        // Log the complete error object
        console.log('Firebase Error:', {
            code: error.code,
            message: error.message,
            fullError: error
        });
        throw error;  // Re-throw the original error
    }
  }



  async handleSignup(email, password, fullName) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update Auth Profile and create Firestore document
      await Promise.all([
          // Update Auth Profile
          user.updateProfile({ displayName: fullName }),
          
          // Create Firestore Document
          firebase.firestore().collection('users').doc(user.uid).set({
              email: email,
              fullName: fullName,
              role: 'user',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          })
      ]);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async handleGoogleSignIn() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await firebase.auth().signInWithPopup(provider);
      const user = userCredential.user;

      // Check if user document exists
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      
      // Only create document if it doesn't exist
      if (!userDoc.exists) {
          await firebase.firestore().collection('users').doc(user.uid).set({
              email: user.email,
              fullName: user.displayName,
              role: 'user',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async handlePasswordReset(email) {
    try {
      await firebase.auth().sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  }

  async handleLogout() {
    try {
      await firebase.auth().signOut();
    } catch (error) {
      throw error;
    }
  }

  async updateUserAvatar(avatarUrl) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) throw new Error('No user is currently signed in');

      await user.updateProfile({ photoURL: avatarUrl });
      await firebase.firestore().collection('users').doc(user.uid).set({
        avatarUrl
      }, { merge: true });

      this.dispatchAuthStateChanged({
        user: firebase.auth().currentUser,
        isAuthenticated: true
      });
    } catch (error) {
      throw error;
    }
  }

  // Modal Control Methods
  openModal() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.open();
  }

  closeModal() {
    const modal = this.shadowRoot.querySelector('custom-modal');
    modal.close();
  }
}

customElements.define('auth-controller', AuthController);