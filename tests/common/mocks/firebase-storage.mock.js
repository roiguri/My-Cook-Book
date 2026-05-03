import { jest } from '@jest/globals';

const mockStorage = 'mockStorage';

/**
 * Mock for 'firebase/storage'.
 *
 * Purpose: Prevents real network calls during tests by mocking storage methods.
 */
jest.unstable_mockModule('firebase/storage', () => ({
  getDownloadURL: jest.fn(async () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
  getStorage: jest.fn(() => mockStorage),
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(),
  uploadBytesResumable: jest.fn(),
  deleteObject: jest.fn(),
  listAll: jest.fn(),
  getMetadata: jest.fn(),
}));

// Also export them for regular imports
export const getDownloadURL = async () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
export const getStorage = () => mockStorage;
export const ref = () => ({});
export const uploadBytes = async () => {};
export const uploadBytesResumable = () => {};
export const deleteObject = async () => {};
export const listAll = async () => ({ items: [], prefixes: [] });
export const getMetadata = async () => ({});
