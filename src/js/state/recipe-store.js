/**
 * recipeStore — process-wide cache of fetched recipes.
 *
 * Why this exists:
 *   Without a shared cache, navigating /home → /recipe/:id → back to /home
 *   re-runs the same Firestore reads, and `getRecipeById()` (heavily used by
 *   recipe cards and my-meal-page) has no memoization at all.
 *
 * Behavior:
 *   - get(id) returns a Promise<Recipe | null>. Caches by id with a TTL.
 *   - In-flight requests are deduplicated (same pattern as FavoritesService).
 *   - LRU eviction caps memory (200 entries by default).
 *   - Listens for the global `recipe-updated` event (dispatched by the manager
 *     dashboard when a recipe is edited) and invalidates the matching id.
 *   - set(id, recipe) lets bulk-fetch paths (like `getRecipesForCards`)
 *     populate the cache so subsequent single-recipe reads hit it.
 *
 * Stale-while-revalidate is intentionally NOT implemented; after the TTL
 * expires the next get() fetches again. Keep it boring.
 */
import { LRUCache } from '../utils/lru-cache.js';
import { FirestoreService } from '../services/firestore-service.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_LIMIT = 200;

export function createRecipeStore({
  ttlMs = DEFAULT_TTL_MS,
  limit = DEFAULT_LIMIT,
  now = () => Date.now(),
  fetcher = null, // injectable for tests; defaults to FirestoreService
  formatter = (raw) => raw, // injectable; production uses formatRecipeData
} = {}) {
  const cache = new LRUCache(limit);
  const inflight = new Map(); // id → Promise<Recipe | null>

  const isFresh = (entry) => !!entry && now() - entry.fetchedAt < ttlMs;

  const fetchRecipe = async (id) => {
    const doc = fetcher ? await fetcher(id) : await FirestoreService.getDocument('recipes', id);
    return doc ? formatter(doc) : null;
  };

  const get = async (id) => {
    if (!id || (typeof id !== 'string' && typeof id !== 'number')) return null;

    const entry = cache.get(id);
    if (isFresh(entry)) return entry.data;

    if (inflight.has(id)) return inflight.get(id);

    const promise = (async () => {
      try {
        const data = await fetchRecipe(id);
        cache.set(id, { data, fetchedAt: now() });
        return data;
      } finally {
        inflight.delete(id);
      }
    })();

    inflight.set(id, promise);
    return promise;
  };

  const set = (id, data) => {
    if (!id) return;
    cache.set(id, { data, fetchedAt: now() });
  };

  const invalidate = (id) => {
    cache.delete(id);
  };

  const invalidateAll = () => {
    cache.clear();
    inflight.clear();
  };

  const has = (id) => isFresh(cache.get(id));

  return { get, set, invalidate, invalidateAll, has };
}

// Default singleton wired to FirestoreService and the recipe formatter.
// Imported in a getter to avoid a circular dep with recipe-data-utils.js.
let _default = null;
let _eventsBound = false;

export function getRecipeStore() {
  if (!_default) {
    _default = createRecipeStore();
    if (typeof document !== 'undefined' && !_eventsBound) {
      // Manager dashboard dispatches `recipe-updated` on edits; invalidate so
      // the next read picks up the new data.
      document.addEventListener('recipe-updated', (event) => {
        const id = event?.detail?.recipeId ?? event?.detail?.id;
        if (id) _default.invalidate(id);
      });
      _eventsBound = true;
    }
  }
  return _default;
}

// Test helper — exported only for use in tests.
export function _resetDefaultStoreForTest() {
  _default = null;
  _eventsBound = false;
}
