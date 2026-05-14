import { jest } from '@jest/globals';

let authStore;
let _setUser;
let _resetForUserSwitch;
let _patchUserData;
let _resetAll;

beforeEach(async () => {
  jest.resetModules();
  ({ authStore, _setUser, _resetForUserSwitch, _patchUserData, _resetAll } = await import(
    '../../../src/js/state/auth-store.js'
  ));
});

describe('authStore', () => {
  test('initial state is unauthenticated and unresolved', () => {
    expect(authStore.get()).toEqual({
      user: null,
      userData: null,
      isAuthenticated: false,
      isAuthResolved: false,
      isManager: false,
      isApproved: false,
      avatarUrl: null,
    });
  });

  test('_setUser derives isManager, isApproved, avatarUrl from role/photoURL', () => {
    _setUser({ uid: 'u1', photoURL: 'https://avatar/u1.png' }, { role: 'manager', favorites: [] });
    const s = authStore.get();
    expect(s.isAuthenticated).toBe(true);
    expect(s.isManager).toBe(true);
    expect(s.isApproved).toBe(true);
    expect(s.avatarUrl).toBe('https://avatar/u1.png');
    expect(s.isAuthResolved).toBe(true);
  });

  test('approved role is isApproved but not isManager', () => {
    _setUser({ uid: 'u1' }, { role: 'approved' });
    const s = authStore.get();
    expect(s.isManager).toBe(false);
    expect(s.isApproved).toBe(true);
  });

  test('avatarUrl from userData overrides user.photoURL', () => {
    _setUser(
      { uid: 'u1', photoURL: 'https://photo' },
      { role: 'user', avatarUrl: 'https://custom-avatar' },
    );
    expect(authStore.get().avatarUrl).toBe('https://custom-avatar');
  });

  test('subscribers are notified on _setUser', () => {
    const listener = jest.fn();
    authStore.subscribe(listener);
    listener.mockClear();

    _setUser({ uid: 'u1' }, { role: 'user' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].user.uid).toBe('u1');
  });

  test('_resetForUserSwitch clears userData but keeps new user and marks unresolved', () => {
    _setUser({ uid: 'old' }, { role: 'manager', avatarUrl: 'old-avatar' });

    const newUser = { uid: 'new', photoURL: null };
    _resetForUserSwitch(newUser);

    const s = authStore.get();
    expect(s.user).toBe(newUser);
    expect(s.userData).toBeNull();
    expect(s.isAuthResolved).toBe(false);
    expect(s.isManager).toBe(false);
    expect(s.isApproved).toBe(false);
    expect(s.avatarUrl).toBeNull();
  });

  test('_resetForUserSwitch fires subscribers (so UIs can render loading state)', () => {
    _setUser({ uid: 'old' }, { role: 'manager' });
    const listener = jest.fn();
    authStore.subscribe(listener);
    listener.mockClear();

    _resetForUserSwitch({ uid: 'new' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].userData).toBeNull();
  });

  test('_patchUserData merges into existing userData and re-derives', () => {
    _setUser({ uid: 'u1' }, { role: 'user', favorites: ['r1'] });
    _patchUserData({ favorites: ['r1', 'r2'] });

    const s = authStore.get();
    expect(s.userData.favorites).toEqual(['r1', 'r2']);
    expect(s.userData.role).toBe('user'); // preserved
  });

  test('_patchUserData re-derives isManager when role changes', () => {
    _setUser({ uid: 'u1' }, { role: 'user' });
    _patchUserData({ role: 'manager' });
    expect(authStore.get().isManager).toBe(true);
  });

  test('_patchUserData when userData is null seeds a new object', () => {
    _setUser({ uid: 'u1' }, null);
    _patchUserData({ favorites: ['r1'] });
    expect(authStore.get().userData).toEqual({ favorites: ['r1'] });
  });

  test('_resetAll returns to initial state', () => {
    _setUser({ uid: 'u1' }, { role: 'manager' });
    _resetAll();
    expect(authStore.get()).toEqual({
      user: null,
      userData: null,
      isAuthenticated: false,
      isAuthResolved: false,
      isManager: false,
      isApproved: false,
      avatarUrl: null,
    });
  });
});
