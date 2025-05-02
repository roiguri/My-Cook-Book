import { jest } from '@jest/globals';

// This mockDocRef can be used in tests if needed
export const mockDocRef = {};

// Allow tests to set this reference for dynamic behavior
export let firebaseService = {};

jest.unstable_mockModule('firebase/firestore', () => ({
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  doc: jest.fn(() => mockDocRef),
  getDoc: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      exists: () => firebaseService._mockUserDoc.exists,
      data: () => firebaseService._mockUserDoc.data(),
      id: firebaseService._mockUserDoc.id,
    });
  }),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
})); 