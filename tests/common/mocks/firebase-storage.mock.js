import { jest } from '@jest/globals';

/**
 * Mock for 'firebase/storage'.
 *
 * Purpose: Prevents real Firebase Storage/network calls during tests by mocking:
 *   - getStorage: returns a dummy storage object
 *
 * Use this mock when your code or tests import from 'firebase/storage'.
 */
jest.unstable_mockModule('firebase/storage', () => ({
  getStorage: jest.fn(() => 'mockStorage'),
})); 