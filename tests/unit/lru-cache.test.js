import { LRUCache } from '../../src/js/utils/lru-cache.js';

describe('LRUCache', () => {
  let cache;

  beforeEach(() => {
    cache = new LRUCache(3); // Small limit for testing
  });

  test('set() and get() basics', () => {
    cache.set('a', 1);
    cache.set('b', 2);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBeUndefined();
  });

  test('has() checks existence', () => {
    cache.set('a', 1);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('z')).toBe(false);
  });

  test('size property', () => {
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    expect(cache.size).toBe(1);
  });

  test('delete() removes item', () => {
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.has('a')).toBe(false);
  });

  test('LRU Eviction Policy', () => {
    // Fill to limit
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Access 'a' to make it most recent
    cache.get('a');

    // Add 'd', should evict 'b' (not 'a' which was just used, not 'c' which is newer than 'b')
    // Wait: Insertion order was A, B, C.
    // Access A: B, C, A
    // Add D: C, A, D (evicts B)
    cache.set('d', 4);

    expect(cache.has('b')).toBe(false); // B evicted
    expect(cache.has('a')).toBe(true); // A kept
    expect(cache.has('c')).toBe(true); // C kept
    expect(cache.has('d')).toBe(true); // D added
  });

  test('Update existing key moves it to end', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // Cache: A, B, C

    cache.set('a', 99); // Cache: B, C, A(99)

    cache.set('d', 4); // Evicts B

    expect(cache.has('b')).toBe(false);
    expect(cache.has('a')).toBe(true);
    expect(cache.get('a')).toBe(99);
  });
});
