import { jest } from '@jest/globals';

/**
 * Mock for global document.dispatchEvent.
 *
 * Purpose: Prevents real DOM events from being dispatched during tests and allows
 * tests to spy on or assert event dispatches.
 *
 * Use this mock when your code dispatches custom events on the document object.
 */
document.dispatchEvent = jest.fn(); 