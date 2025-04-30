// FIXME: leave favorites page when a user logs out
// FIXME: when user logging in with different account, when opening modal for the first time, it shows the previous user's profile
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

import { getAuthInstance, getFirestoreInstance } from '../../js/services/firebase-service.js';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
    const auth = getAuthInstance();
    onAuthStateChanged(auth, async (user) => {
      this.isAuthenticated = !!user;
      this.currentUser = user;

      if (user) {
        const roles = await this.checkUserRoles(user);
        this.updateNavigation(user, roles);
        this.dispatchAuthStateChanged({ 
          user, 
          isAuthenticated: true,
          ...roles
        });
      } else {
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
      const db = getFirestoreInstance();
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const role = docSnap.data().role;
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
      const auth = getAuthInstance();
      const persistence = remember 
        ? browserLocalPersistence 
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.log('Firebase Error:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      throw error;
    }
  }



  async handleSignup(email, password, fullName) {
    try {
      const auth = getAuthInstance();
      const db = getFirestoreInstance();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await Promise.all([
        updateProfile(user, { displayName: fullName }),
        setDoc(doc(db, 'users', user.uid), {
          email: email,
          fullName: fullName,
          role: 'user',
          createdAt: serverTimestamp()
        })
      ]);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async handleGoogleSignIn() {
    try {
      const auth = getAuthInstance();
      const db = getFirestoreInstance();
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          fullName: user.displayName,
          role: 'user',
          createdAt: serverTimestamp()
        });
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async handlePasswordReset(email) {
    try {
      const auth = getAuthInstance();
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }

  async handleLogout() {
    try {
      const auth = getAuthInstance();
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  async updateUserAvatar(avatarUrl) {
    try {
      const user = getAuthInstance().currentUser;
      if (!user) throw new Error('No user is currently signed in');

      await updateProfile(user, { photoURL: avatarUrl });
      const db = getFirestoreInstance();
      await updateDoc(doc(db, 'users', user.uid), {
        avatarUrl
      });

      this.dispatchAuthStateChanged({
        user: getAuthInstance().currentUser,
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