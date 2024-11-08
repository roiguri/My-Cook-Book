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
      <style>${this.styles()}</style>
      <custom-modal height="auto">
        <div id="auth-content"></div>
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
        this.dispatchAuthStateChanged({ 
          user, 
          isAuthenticated: true,
          ...roles
        });
      } else {
        // User is signed out
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
      
      await firebase.auth().setPersistence(persistence);
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async handleSignup(email, password) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
        email,
        role: 'user'
      });
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async handleGoogleSignIn() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await firebase.auth().signInWithPopup(provider);
      return userCredential.user;
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