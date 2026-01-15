## 2025-10-18 - [Code Splitting for SPA]

**Learning:** Static imports of page modules in the main entry point (`src/app.js`) defeat the purpose of lazy loading logic in `PageManager`. Vite bundles everything imported statically into the main chunk.
**Action:** Always use dynamic `import()` inside route handlers for page components to ensure they are split into separate chunks.

## 2025-10-24 - [Web Components Data Passing]

**Learning:** Web Components often default to fetching their own data based on ID attributes. This causes N+1 fetch cascades in lists.
**Action:** Always implement a property setter (e.g., `set data(val)`) on list item components to allow parent lists to pass pre-fetched data directly, bypassing the internal fetch.

## 2025-10-25 - [Firebase Storage URL Caching]

**Learning:** `getDownloadURL` from Firebase Storage SDK performs a network request every time it is called, even for the same path. In lists with repeated images (e.g., avatars, placeholders), this causes redundant network traffic.
**Action:** Implement a static in-memory cache for storage Promises to deduplicate simultaneous requests and cache results for the session duration.
