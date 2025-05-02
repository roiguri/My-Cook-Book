import { jest } from '@jest/globals';

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
})); 