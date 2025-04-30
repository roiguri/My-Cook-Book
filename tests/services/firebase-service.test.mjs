import { jest } from '@jest/globals';

jest.unstable_mockModule('firebase/app', () => ({
  initializeApp: jest.fn(() => 'mockApp'),
  getApps: jest.fn(() => []),
}));
jest.unstable_mockModule('firebase/auth', () => ({
  getAuth: jest.fn(() => 'mockAuth'),
}));
jest.unstable_mockModule('firebase/firestore', () => ({
  getFirestore: jest.fn(() => 'mockFirestore'),
}));
jest.unstable_mockModule('firebase/storage', () => ({
  getStorage: jest.fn(() => 'mockStorage'),
}));

describe('firebase-service', () => {
  let firebaseService;

  beforeEach(async () => {
    jest.resetModules();
    firebaseService = await import('../../src/js/services/firebase-service.js');
  });

  it('should export initFirebase function', () => {
    const type = typeof firebaseService.initFirebase;

    expect(type).toBe('function');
  });

  it('should initialize and return all services', () => {
    const config = { apiKey: 'test' };

    const result = firebaseService.initFirebase(config);

    expect(result).toEqual({
      app: 'mockApp',
      auth: 'mockAuth',
      db: 'mockFirestore',
      storage: 'mockStorage',
    });
  });

  it('getter functions should return correct instances after init', () => {
    const config = { apiKey: 'test' };
    firebaseService.initFirebase(config);

    const app = firebaseService.getFirebaseApp();
    const auth = firebaseService.getAuthInstance();
    const db = firebaseService.getFirestoreInstance();
    const storage = firebaseService.getStorageInstance();

    expect(app).toBe('mockApp');
    expect(auth).toBe('mockAuth');
    expect(db).toBe('mockFirestore');
    expect(storage).toBe('mockStorage');
  });
});
