import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { debounce, throttle, capitalize, generateId } from '../../../src/js/utils/common-utils.js';

describe('Common Utilities', () => {
  describe('capitalize', () => {
    test('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    test('returns empty string for empty input', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize(null)).toBe('');
      expect(capitalize(undefined)).toBe('');
    });

    test('handles single character strings', () => {
      expect(capitalize('a')).toBe('A');
    });

    test('does not change already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('generateId', () => {
    test('generates an ID of the specified length', () => {
      expect(generateId(8)).toHaveLength(8);
      expect(generateId(16)).toHaveLength(16);
    });

    test('generates an ID of default length 8 if no length provided', () => {
      expect(generateId()).toHaveLength(8);
    });

    test('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('executes function after specified wait time', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(func).toHaveBeenCalledTimes(1);
    });

    test('resets timer on subsequent calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      jest.advanceTimersByTime(500);
      debouncedFunc();
      jest.advanceTimersByTime(500);
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('executes function immediately and then waits', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    test('limits execution rate', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      // First call executes immediately
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      // Subsequent calls within 1000ms are ignored
      jest.advanceTimersByTime(500);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(501);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });
  });
});
