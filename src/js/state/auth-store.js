/**
 * authStore — single source of truth for authentication state.
 *
 * State shape:
 *   {
 *     user: FirebaseUser | null,   // Firebase Auth user object
 *     userData: object | null,      // Firestore users/{uid} document
 *     isAuthenticated: boolean,
 *     isAuthResolved: boolean,      // initial onAuthStateChanged has fired
 *     isManager: boolean,
 *     isApproved: boolean,          // approved OR manager
 *     avatarUrl: string | null,     // userData.avatarUrl ?? user.photoURL
 *   }
 *
 * Public API (for any consumer):
 *   - authStore.get()         Current snapshot.
 *   - authStore.subscribe(fn) Calls fn(state) immediately and on every change.
 *                             Returns an unsubscribe function.
 *
 * Writer API (intended for AuthService only — underscore prefix denotes the
 * internal contract):
 *   - _setUser(user, userData, { resolved })
 *       Lands a complete state for the given user. Derived fields recomputed.
 *   - _resetForUserSwitch()
 *       Clears userData and marks unresolved, keeping the new Firebase user.
 *       This is what fixes the stale-profile-on-account-switch FIXME: UI
 *       subscribed to the store sees a loading state instead of the previous
 *       user's data while the new user's Firestore doc is fetched.
 *   - _patchUserData(partial)
 *       Shallow merge into userData (used by updateProfile / favorites events).
 */
import { createStore } from './create-store.js';

const INITIAL_STATE = Object.freeze({
  user: null,
  userData: null,
  isAuthenticated: false,
  isAuthResolved: false,
  isManager: false,
  isApproved: false,
  avatarUrl: null,
});

function derive(user, userData, isAuthResolved) {
  const role = userData?.role ?? null;
  return {
    user: user ?? null,
    userData: userData ?? null,
    isAuthenticated: !!user,
    isAuthResolved: !!isAuthResolved,
    isManager: role === 'manager',
    isApproved: role === 'approved' || role === 'manager',
    avatarUrl: userData?.avatarUrl ?? user?.photoURL ?? null,
  };
}

const _store = createStore(INITIAL_STATE);

export const authStore = {
  get: _store.get,
  subscribe: _store.subscribe,
};

export function _setUser(user, userData, { resolved = true } = {}) {
  _store.set(derive(user, userData, resolved));
}

export function _resetForUserSwitch(user) {
  // Keep the new Firebase user but drop the previous user's Firestore doc so
  // no subscriber can render stale data while the new doc is being fetched.
  _store.set(derive(user, null, false));
}

export function _patchUserData(partial) {
  const current = _store.get();
  if (!current.userData) {
    _store.set(derive(current.user, { ...partial }, current.isAuthResolved));
    return;
  }
  _store.set(derive(current.user, { ...current.userData, ...partial }, current.isAuthResolved));
}

export function _resetAll() {
  _store.set(INITIAL_STATE);
}
