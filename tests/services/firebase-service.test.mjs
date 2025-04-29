import { initFirebase } from '../../src/js/services/firebase-service';

describe('firebase-service', () => {
  it('should export initFirebase function', () => {
    expect(typeof initFirebase).toBe('function');
  });
});
