import { jest } from '@jest/globals';

/**
 * Mock for 'firebase/auth'.
 *
 * Purpose: Prevents real authentication/network calls during tests by mocking:
 *   - Auth persistence constants
 *   - Auth methods (signIn, signOut, etc.)
 *   - GoogleAuthProvider
 *   - getAuth: returns a dummy auth object
 *
 * Use this mock when your code or tests import from 'firebase/auth'.
 */

jest.unstable_mockModule('firebase/auth', () => ({
  browserLocalPersistence: 'local',
  browserSessionPersistence: 'session',
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({ addScope: jest.fn() })),
  setPersistence: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  setPersistence: jest.fn(),
  getAuth: jest.fn(() => 'mockAuth'),
  updateProfile: jest.fn(),
})); 