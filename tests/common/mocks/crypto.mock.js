/**
 * Crypto API Polyfill for jsdom Test Environment
 * ------------------------------------------------
 * jsdom provides a crypto object but lacks crypto.randomUUID().
 * This polyfill adds the method using Node.js's native crypto module.
 *
 * Context: Production code uses crypto.randomUUID() (available in browsers and Node.js v15+),
 * but Jest's jsdom environment doesn't include this method.
 */

import { randomUUID } from 'crypto';

if (globalThis.crypto && !globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = randomUUID;
}
