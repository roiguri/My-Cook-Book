/**
 * Tiny observable store primitive
 * --------------------------------
 * createStore(initialValue) → { get, set, update, subscribe }
 *
 *   get()              Returns the current value.
 *   set(next)          Replaces the value. Notifies subscribers only if
 *                      next !== current (reference equality).
 *   update(fn)         Shorthand for set(fn(get())).
 *   subscribe(listener)
 *                      Calls listener immediately with the current value,
 *                      then on every change. Returns an unsubscribe function.
 *                      Listener errors are caught and logged so one bad
 *                      subscriber cannot prevent the others from running.
 */
export function createStore(initialValue) {
  let value = initialValue;
  const listeners = new Set();

  const get = () => value;

  const set = (next) => {
    if (next === value) return;
    value = next;
    for (const listener of listeners) {
      try {
        listener(value);
      } catch (error) {
        console.error('[store] subscriber threw:', error);
      }
    }
  };

  const update = (fn) => set(fn(value));

  const subscribe = (listener) => {
    listeners.add(listener);
    try {
      listener(value);
    } catch (error) {
      console.error('[store] initial subscriber call threw:', error);
    }
    return () => listeners.delete(listener);
  };

  return { get, set, update, subscribe };
}
