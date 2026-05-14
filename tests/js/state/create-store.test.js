import { jest } from '@jest/globals';
import { createStore } from '../../../src/js/state/create-store.js';

describe('createStore', () => {
  test('get() returns initial value', () => {
    const store = createStore({ count: 0 });
    expect(store.get()).toEqual({ count: 0 });
  });

  test('set() replaces value and notifies subscribers', () => {
    const store = createStore(0);
    const listener = jest.fn();
    store.subscribe(listener);
    listener.mockClear(); // ignore initial call

    store.set(1);
    expect(store.get()).toBe(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  test('set() does not notify when value is reference-equal', () => {
    const obj = { a: 1 };
    const store = createStore(obj);
    const listener = jest.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.set(obj);
    expect(listener).not.toHaveBeenCalled();
  });

  test('set() does notify when a new object with same shape is passed', () => {
    const store = createStore({ a: 1 });
    const listener = jest.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.set({ a: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('update() applies function to current value', () => {
    const store = createStore(5);
    store.update((v) => v + 1);
    expect(store.get()).toBe(6);
  });

  test('subscribe() calls listener immediately with current value', () => {
    const store = createStore('hello');
    const listener = jest.fn();
    store.subscribe(listener);
    expect(listener).toHaveBeenCalledWith('hello');
  });

  test('subscribe() returns an unsubscribe function', () => {
    const store = createStore(0);
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    listener.mockClear();

    unsubscribe();
    store.set(1);
    expect(listener).not.toHaveBeenCalled();
  });

  test('multiple subscribers all receive updates', () => {
    const store = createStore(0);
    const a = jest.fn();
    const b = jest.fn();
    store.subscribe(a);
    store.subscribe(b);
    a.mockClear();
    b.mockClear();

    store.set(1);
    expect(a).toHaveBeenCalledWith(1);
    expect(b).toHaveBeenCalledWith(1);
  });

  test('a throwing subscriber does not block the others', () => {
    const store = createStore(0);
    const bad = jest.fn(() => {
      throw new Error('boom');
    });
    const good = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    store.subscribe(bad);
    store.subscribe(good);
    bad.mockClear();
    good.mockClear();

    store.set(1);
    expect(bad).toHaveBeenCalledWith(1);
    expect(good).toHaveBeenCalledWith(1);
    consoleError.mockRestore();
  });

  test('subscriber throwing on initial call is caught', () => {
    const store = createStore(0);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const bad = jest.fn(() => {
      throw new Error('boom');
    });

    expect(() => store.subscribe(bad)).not.toThrow();
    consoleError.mockRestore();
  });
});
