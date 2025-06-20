/**
 * AuthService - Centralized Authentication Manager
 *
 * This service provides a unified interface for authentication and user management,
 * abstracting Firebase Auth and Firestore details.
 *
 * Public Methods:
 *   - initialize(): Initializes the service and sets up the authentication state listener.
 *   - getCurrentUser(): Returns the current authenticated user (or null if not authenticated).
 *   - isAuthenticated(): Returns true if a user is currently authenticated.
 *   - login(email, password, remember = false): Logs in a user with email and password. Optionally persists the session.
 *   - loginWithGoogle(): Logs in a user using Google authentication.
 *   - signup(email, password, fullName): Registers a new user with email, password, and full name.
 *   - logout(): Logs out the current user.
 *   - resetPassword(email): Sends a password reset email to the specified address.
 *   - updateProfile(profileData): Updates the current user's profile (display name, photo, etc).
 *   - deleteAccount(): Deletes the current user's account and associated Firestore document.
 *   - hasRole(role): Checks if the current user has a specific role.
 *   - isManager(): Checks if the current user has the 'manager' role.
 *   - isApproved(): Checks if the current user is 'approved' or a 'manager'.
 *   - onAuthStateChanged(callback): Registers a callback for authentication state changes.
 *   - addAuthObserver(observer): Adds an observer function for auth state changes.
 *   - removeAuthObserver(observer): Removes a previously added auth observer.
 *   - getCurrentUserRole(): Gets the current user's role.
 *   - waitForAuth(timeout): Waits for authentication to initialize, returns authenticated user or null.
 *   - getCurrentAvatarUrl(): Returns the current user's avatar URL.
 */
import { getAuthInstance, getFirestoreInstance } from './firebase-service.js';
import { serverTimestamp, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';

class AuthService {
  /**
   * Constructor initializes the service
   */
  constructor() {
    this._initialized = false;
    this._currentUser = null;
    this._userRoles = null;
    this._currentAvatarUrl = null;
    this._observers = [];
    this._unsubscribeFromAuth = null;

    // Create singleton reference
    if (AuthService.instance) {
      return AuthService.instance;
    }

    AuthService.instance = this;
  }

  /**
   * Initialize the auth service
   * Sets up Firebase Auth listener and initializes state
   */
  initialize() {
    if (this._initialized) return;

    // Set up auth state listener
    const auth = getAuthInstance();
    this._unsubscribeFromAuth = auth.onAuthStateChanged(async (user) => {
      const prevUser = this._currentUser;
      this._currentUser = user;

      if (user) {
        // Fetch user roles from Firestore when logged in
        this._userRoles = await this._fetchUserRoles(user);
        this._currentAvatarUrl = await this._fetchAvatarUrl(user);
      } else {
        this._userRoles = null;
        this._currentAvatarUrl = null;
      }

      // Notify observers of the auth state change
      this._notifyObservers({
        user: this._currentUser,
        isAuthenticated: !!this._currentUser,
        roles: this._userRoles,
        avatarUrl: this._currentAvatarUrl,
        isManager: this._userRoles?.role === 'manager',
        isApproved: this._userRoles?.role === 'approved' || this._userRoles?.role === 'manager',
        previousUser: prevUser,
      });

      // Dispatch custom event for components to listen to
      this._dispatchAuthEvent({
        user: this._currentUser,
        isAuthenticated: !!this._currentUser,
        roles: this._userRoles,
        avatarUrl: this._currentAvatarUrl,
        isManager: this._userRoles?.role === 'manager',
        isApproved: this._userRoles?.role === 'approved' || this._userRoles?.role === 'manager',
        previousUser: prevUser,
      });
    });

    this._initialized = true;
  }

  /**
   * Get the current authenticated user
   * @returns {Object|null} Firebase user object or null if not authenticated
   */
  getCurrentUser() {
    return this._currentUser;
  }

  /**
   * Check if a user is currently authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!this._currentUser;
  }

  /**
   * Get the current user's avatar URL
   * @returns {string|null} Current avatar URL or null if not available
   */
  getCurrentAvatarUrl() {
    return this._currentAvatarUrl;
  }

  /**
   * Login with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {boolean} [remember=false] - Whether to persist the session
   * @returns {Promise<Object>} Promise resolving to user object
   */
  async login(email, password, remember = false) {
    try {
      const auth = getAuthInstance();
      // Set persistence based on remember preference
      const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      this._handleAuthError('login', error);
      throw error;
    }
  }

  /**
   * Login with Google
   * @returns {Promise<Object>} Promise resolving to user object
   */
  async loginWithGoogle() {
    try {
      const auth = getAuthInstance();
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user document exists in Firestore
      const db = getFirestoreInstance();
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // If user doesn't exist in Firestore, create a new document
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          fullName: user.displayName,
          role: 'user',
          createdAt: serverTimestamp(),
        });
      }

      return user;
    } catch (error) {
      this._handleAuthError('google-login', error);
      throw error;
    }
  }

  /**
   * Sign up a new user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {string} fullName - User's full name
   * @returns {Promise<Object>} Promise resolving to user object
   */
  async signup(email, password, fullName) {
    try {
      const auth = getAuthInstance();
      const db = getFirestoreInstance();
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile (modular API)
      await updateProfile(user, { displayName: fullName });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: email,
        fullName: fullName,
        role: 'user',
        createdAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      this._handleAuthError('signup', error);
      throw error;
    }
  }

  /**
   * Log out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      const auth = getAuthInstance();
      await signOut(auth);
    } catch (error) {
      this._handleAuthError('logout', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User's email address
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      const auth = getAuthInstance();
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      this._handleAuthError('reset-password', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Promise resolving to updated user
   */
  async updateProfile(profileData) {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('No user is signed in');
      const db = getFirestoreInstance();
      // Update auth profile if displayName or photoURL provided
      if (profileData.displayName || profileData.photoURL) {
        await updateProfile(user, {
          displayName: profileData.displayName || user.displayName,
          photoURL: profileData.photoURL || user.photoURL,
        });
      }
      // Update user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
      });
      // Update cached avatar URL if it was changed
      if (profileData.avatarUrl !== undefined) {
        this._currentAvatarUrl = profileData.avatarUrl;
      }
      // Dispatch profile updated event
      const event = new CustomEvent('profile-updated', {
        detail: {
          user: user,
          updatedFields: Object.keys(profileData),
        },
        bubbles: true,
        composed: true,
      });
      document.dispatchEvent(event);
      return user;
    } catch (error) {
      this._handleAuthError('update-profile', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * @returns {Promise<void>}
   */
  async deleteAccount() {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('No user is signed in');
      const db = getFirestoreInstance();
      // Delete user document from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
      // Delete user from Firebase Auth
      await user.delete();
    } catch (error) {
      this._handleAuthError('delete-account', error);
      throw error;
    }
  }

  /**
   * Check if current user has a specific role
   * @param {string} role - Role to check (user, approved, manager)
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    if (!this._currentUser || !this._userRoles) return false;
    return this._userRoles.role === role;
  }

  /**
   * Check if current user has manager role
   * @returns {boolean} True if user is a manager
   */
  isManager() {
    return this.hasRole('manager');
  }

  /**
   * Check if current user has approved role
   * @returns {boolean} True if user is approved or manager
   */
  isApproved() {
    return this.hasRole('approved') || this.hasRole('manager');
  }

  /**
   * Listen for auth state changes
   * @param {Function} callback - Function to call when auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    const auth = getAuthInstance();
    return auth.onAuthStateChanged(callback);
  }

  /**
   * Add auth state observer
   * @param {Function} observer - Function to call when auth state changes
   */
  addAuthObserver(observer) {
    if (typeof observer !== 'function') {
      console.error('Observer must be a function');
      return;
    }

    this._observers.push(observer);

    // Call the observer immediately with current state if already authenticated
    if (this._initialized) {
      observer({
        user: this._currentUser,
        isAuthenticated: !!this._currentUser,
        roles: this._userRoles,
        isManager: this._userRoles?.role === 'manager',
        isApproved: this._userRoles?.role === 'approved' || this._userRoles?.role === 'manager',
      });
    }
  }

  /**
   * Remove auth state observer
   * @param {Function} observer - Observer function to remove
   */
  removeAuthObserver(observer) {
    const index = this._observers.indexOf(observer);
    if (index !== -1) {
      this._observers.splice(index, 1);
    }
  }

  /**
   * Get the current user's role
   * @returns {string} The current user's role
   */
  async getCurrentUserRole() {
    // FIXME: remove this once state management is implemented
    this._userRoles = await this._fetchUserRoles(this._currentUser);
    return this._userRoles?.role || 'public';
  }

  /**
   * Wait for authentication to initialize
   * Useful for page components that need to ensure auth state is ready
   * @param {number} timeout - Maximum time to wait in milliseconds (default: 5000)
   * @returns {Promise<Object|null>} Promise resolving to authenticated user or null
   */
  async waitForAuth(timeout = 5000) {
    return new Promise((resolve) => {
      // If already authenticated, return immediately
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        resolve(currentUser);
        return;
      }

      // Wait for auth state to initialize
      let timeoutId;
      const unsubscribe = this.onAuthStateChanged((user) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(user);
      });

      // Timeout fallback
      timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, timeout);
    });
  }

  /* ===== PRIVATE METHODS ===== */

  /**
   * Fetch user roles from Firestore
   * @private
   * @param {Object} user - Firebase user object
   * @returns {Promise<Object>} Promise resolving to user roles
   */
  async _fetchUserRoles(user) {
    try {
      const db = getFirestoreInstance();
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists) {
        return docSnap.data();
      }
      return { role: 'user' }; // Default role
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return { role: 'user' }; // Default role on error
    }
  }

  /**
   * Fetch user avatar URL from Firestore with fallback to Firebase Auth
   * @private
   * @param {Object} user - Firebase user object
   * @returns {Promise<string|null>} Promise resolving to avatar URL or null
   */
  async _fetchAvatarUrl(user) {
    try {
      const db = getFirestoreInstance();
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        return userData.avatarUrl || user.photoURL || null;
      }
      return user.photoURL || null;
    } catch (error) {
      console.warn('Error fetching avatar URL from Firestore, using photoURL:', error);
      return user.photoURL || null;
    }
  }

  /**
   * Notify all observers of auth state changes
   * @private
   * @param {Object} authState - Current auth state
   */
  _notifyObservers(authState) {
    this._observers.forEach((observer) => {
      try {
        observer(authState);
      } catch (error) {
        console.error('Error in auth observer:', error);
      }
    });
  }

  /**
   * Dispatch auth state changed event
   * @private
   * @param {Object} detail - Event detail object
   */
  _dispatchAuthEvent(detail) {
    this._dispatchEvent('auth-state-changed', detail);
  }

  /**
   * Dispatch custom event
   * @private
   * @param {string} name - Event name
   * @param {Object} detail - Event detail object
   */
  _dispatchEvent(name, detail) {
    const event = new CustomEvent(name, {
      detail: detail,
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle authentication errors
   * @private
   * @param {string} operation - Operation that caused the error
   * @param {Error} error - Error object
   */
  _handleAuthError(operation, error) {
    console.error(`Auth error during ${operation}:`, error);

    // Dispatch auth error event
    this._dispatchEvent('auth-error', {
      operation: operation,
      code: error.code,
      message: error.message,
      error: error,
    });
  }

  // For testing purposes only
  static _resetInstanceForTest() {
    AuthService.instance = null;
  }
}

// Ensure there's only one instance (singleton pattern)
AuthService.instance = null;

// Create and export the singleton instance
const authService = new AuthService();

// Export both the class and the singleton instance
export { AuthService, authService as default };
