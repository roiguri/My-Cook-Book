## 2025-10-18 - [Code Splitting for SPA]

**Learning:** Static imports of page modules in the main entry point (`src/app.js`) defeat the purpose of lazy loading logic in `PageManager`. Vite bundles everything imported statically into the main chunk.
**Action:** Always use dynamic `import()` inside route handlers for page components to ensure they are split into separate chunks.

## 2025-10-24 - [Web Components Data Passing]

**Learning:** Web Components often default to fetching their own data based on ID attributes. This causes N+1 fetch cascades in lists.
**Action:** Always implement a property setter (e.g., `set data(val)`) on list item components to allow parent lists to pass pre-fetched data directly, bypassing the internal fetch.

## 2025-10-24 - [Firestore Caching for Lists]

**Learning:** When paginating through a list that depends on auxiliary user data (like "favorites"), fetching that data on every page render is redundant and causes UI flashing.
**Action:** Cache the auxiliary data in the parent component (e.g., `_cachedFavorites` Set) and update it via event listeners (`favorite-changed`) to allow instant rendering of item states on subsequent pages.
