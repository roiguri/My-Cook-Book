import { jest } from '@jest/globals';

jest.unstable_mockModule('src/js/services/firestore-service.js', () => ({
  FirestoreService: {
    getDocument: jest.fn(),
  },
}));

let createRecipeStore;
let FirestoreService;

beforeEach(async () => {
  jest.resetModules();
  ({ createRecipeStore } = await import('../../../src/js/state/recipe-store.js'));
  ({ FirestoreService } = await import('src/js/services/firestore-service.js'));
});

describe('recipeStore', () => {
  test('get() returns null for invalid ids', async () => {
    const store = createRecipeStore({ fetcher: jest.fn() });
    expect(await store.get(null)).toBeNull();
    expect(await store.get(undefined)).toBeNull();
    expect(await store.get({})).toBeNull();
  });

  test('get() fetches and caches on first call', async () => {
    const fetcher = jest.fn().mockResolvedValue({ id: 'r1', name: 'Pasta' });
    const store = createRecipeStore({ fetcher });

    const result = await store.get('r1');
    expect(result).toEqual({ id: 'r1', name: 'Pasta' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('get() hits cache on second call within TTL', async () => {
    const fetcher = jest.fn().mockResolvedValue({ id: 'r1', name: 'Pasta' });
    const store = createRecipeStore({ fetcher, ttlMs: 60000 });

    await store.get('r1');
    await store.get('r1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('get() refetches after TTL expires', async () => {
    const fetcher = jest.fn().mockResolvedValue({ id: 'r1' });
    let t = 1000;
    const store = createRecipeStore({ fetcher, ttlMs: 100, now: () => t });

    await store.get('r1');
    t = 1050;
    await store.get('r1');
    expect(fetcher).toHaveBeenCalledTimes(1);

    t = 2000;
    await store.get('r1');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('get() deduplicates in-flight requests for the same id', async () => {
    let resolveFetch;
    const fetcher = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const store = createRecipeStore({ fetcher });

    const p1 = store.get('r1');
    const p2 = store.get('r1');
    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch({ id: 'r1' });
    const [v1, v2] = await Promise.all([p1, p2]);
    expect(v1).toEqual({ id: 'r1' });
    expect(v2).toEqual({ id: 'r1' });
  });

  test('get() returns null when fetcher returns null (recipe not found)', async () => {
    const fetcher = jest.fn().mockResolvedValue(null);
    const store = createRecipeStore({ fetcher });
    expect(await store.get('missing')).toBeNull();
  });

  test('set() seeds the cache without fetching', async () => {
    const fetcher = jest.fn();
    const store = createRecipeStore({ fetcher });

    store.set('r1', { id: 'r1', name: 'Direct' });
    const result = await store.get('r1');

    expect(result).toEqual({ id: 'r1', name: 'Direct' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test('invalidate() forces refetch on next get', async () => {
    const fetcher = jest.fn().mockResolvedValue({ id: 'r1' });
    const store = createRecipeStore({ fetcher });

    await store.get('r1');
    store.invalidate('r1');
    await store.get('r1');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('invalidateAll() clears every entry and in-flight tracking', async () => {
    const fetcher = jest.fn((id) => Promise.resolve({ id }));
    const store = createRecipeStore({ fetcher });

    await store.get('r1');
    await store.get('r2');
    store.invalidateAll();
    await store.get('r1');
    await store.get('r2');
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  test('has() reports fresh entries only', async () => {
    let t = 1000;
    const fetcher = jest.fn().mockResolvedValue({ id: 'r1' });
    const store = createRecipeStore({ fetcher, ttlMs: 100, now: () => t });

    expect(store.has('r1')).toBe(false);
    await store.get('r1');
    expect(store.has('r1')).toBe(true);

    t = 2000;
    expect(store.has('r1')).toBe(false);
  });

  test('formatter is applied to raw fetched data', async () => {
    const fetcher = jest.fn().mockResolvedValue({ id: 'r1', raw: true });
    const formatter = (raw) => ({ ...raw, formatted: true });
    const store = createRecipeStore({ fetcher, formatter });

    const result = await store.get('r1');
    expect(result).toEqual({ id: 'r1', raw: true, formatted: true });
  });

  test('LRU eviction respects the limit', async () => {
    const fetcher = jest.fn((id) => Promise.resolve({ id }));
    const store = createRecipeStore({ fetcher, limit: 2 });

    await store.get('a');
    await store.get('b');
    await store.get('c'); // evicts 'a'
    expect(store.has('a')).toBe(false);
    expect(store.has('b')).toBe(true);
    expect(store.has('c')).toBe(true);
  });

  test('default fetcher uses FirestoreService.getDocument', async () => {
    FirestoreService.getDocument.mockResolvedValue({ id: 'r1', name: 'Stew' });
    const store = createRecipeStore();

    const result = await store.get('r1');
    expect(FirestoreService.getDocument).toHaveBeenCalledWith('recipes', 'r1');
    expect(result).toEqual({ id: 'r1', name: 'Stew' });
  });

  test('singleton invalidates on document recipe-updated event', async () => {
    FirestoreService.getDocument.mockResolvedValue({ id: 'r1' });
    const { getRecipeStore, _resetDefaultStoreForTest } = await import(
      '../../../src/js/state/recipe-store.js'
    );
    _resetDefaultStoreForTest();
    const store = getRecipeStore();
    await store.get('r1');

    document.dispatchEvent(new CustomEvent('recipe-updated', { detail: { recipeId: 'r1' } }));

    expect(store.has('r1')).toBe(false);
  });
});
