import { jest } from '@jest/globals';

/**
 * Mock for 'firebase/app'.
 *
 * Purpose: Prevents real Firebase app initialization during tests by mocking
 *   - initializeApp: returns a dummy app object
 *   - getApps: returns an empty array
 *
 * Use this mock when your code or tests import from 'firebase/app'.
 */

jest.unstable_mockModule('firebase/app', () => ({
  initializeApp: jest.fn(() => 'mockApp'),
  getApps: jest.fn(() => []),
})); 