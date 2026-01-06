/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { AppRouter } from '../../../src/app/core/router.js';

describe('AppRouter', () => {
  let router;
  let mockPushState;
  let mockReplaceState;
  let mockAddEventListener;
  let mockRemoveEventListener;
  let mockDispatchEvent;

  beforeEach(() => {
    // 1. Mock window.history
    mockPushState = jest.fn();
    mockReplaceState = jest.fn();

    if (!window.history) {
      window.history = {};
    }
    window.history.pushState = mockPushState;
    window.history.replaceState = mockReplaceState;

    // 2. Mock window.location
    try {
      delete window.location;
    } catch (e) {
      // Ignore
    }

    window.location = {
      pathname: '/',
      search: '',
      href: 'http://localhost/',
      origin: 'http://localhost',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      toString: () => 'http://localhost/',
    };

    // 3. Mock window event listeners
    mockAddEventListener = jest.spyOn(window, 'addEventListener');
    mockRemoveEventListener = jest.spyOn(window, 'removeEventListener');
    mockDispatchEvent = jest.spyOn(window, 'dispatchEvent');

    // 4. Suppress console logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // 5. Initialize Router
    router = new AppRouter();

    // IMPORTANT: Register default route to prevent infinite loops during testing
    router.registerRoute('/home', jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize correctly', () => {
      router.initialize();
      expect(router.isInitialized).toBe(true);
      expect(mockAddEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    });

    test('should not initialize twice', () => {
      router.initialize();
      router.initialize();
      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    });

    test('should navigate to default route if current route is invalid', async () => {
      window.location.pathname = '/invalid-route';
      router.initialize();
      // Wait for async navigate triggered by initialize
      await new Promise((resolve) => setTimeout(resolve, 0));
      // handleNotFound uses navigate() which uses pushState by default
      expect(mockPushState).toHaveBeenCalledWith(null, '', '/home');
    });

    test('should execute matching route on init', () => {
      window.location.pathname = '/test';
      const handler = jest.fn();
      router.registerRoute('/test', handler);
      router.initialize();
      expect(handler).toHaveBeenCalled();
      expect(router.getCurrentRoute()).toBe('/test');
    });
  });

  describe('Route Registration', () => {
    test('should register routes', () => {
      const handler = jest.fn();
      router.registerRoute('/test', handler);
      expect(router.hasRoute('/test')).toBe(true);
      expect(router.getRoutes()).toContain('/test');
    });

    test('should throw error for invalid path or handler', () => {
      expect(() => router.registerRoute(123, () => {})).toThrow();
      expect(() => router.registerRoute('/test', 'not a function')).toThrow();
    });

    test('should normalize paths', () => {
      const handler = jest.fn();
      router.registerRoute('test', handler); // Missing leading slash
      expect(router.hasRoute('/test')).toBe(true);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      router.registerRoute('/about', jest.fn());
      router.initialize(); // Navigates to /home usually
    });

    test('should navigate to valid route', async () => {
      const result = await router.navigate('/about');
      expect(result).toBe(true);
      expect(router.getCurrentRoute()).toBe('/about');
      expect(mockPushState).toHaveBeenCalledWith(null, '', '/about');
    });

    test('should replace history when requested', async () => {
      await router.navigate('/about', { replace: true });
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/about');
    });

    test('should dispatch spa-navigation event', async () => {
      await router.navigate('/about');
      // Check the last call to dispatchEvent
      const calls = mockDispatchEvent.mock.calls;
      const lastCall = calls[calls.length - 1];
      const event = lastCall[0];

      expect(event.type).toBe('spa-navigation');
      expect(event.detail.path).toBe('/about');
    });

    test('should handle query parameters', async () => {
      await router.navigate('/about?foo=bar');
      expect(router.getCurrentRoute()).toBe('/about');
      expect(mockPushState).toHaveBeenCalledWith(null, '', '/about?foo=bar');
    });
  });

  describe('Parameterized Routes', () => {
    test('should match parameterized routes', async () => {
      const handler = jest.fn();
      router.registerRoute('/recipe/:id', handler);
      router.initialize();

      window.location.pathname = '/recipe/123';
      await router.navigate('/recipe/123');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: '123' }));
    });

    test('should handle multiple parameters', async () => {
      const handler = jest.fn();
      router.registerRoute('/category/:cat/item/:id', handler);
      router.initialize();

      await router.navigate('/category/books/item/456');
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ cat: 'books', id: '456' }));
    });
  });

  describe('Navigation Guards', () => {
    test('should allow navigation if guard returns true', async () => {
      router.registerRoute('/protected', jest.fn());
      router.addNavigationGuard('auth', () => true);

      const result = await router.navigate('/protected');
      expect(result).toBe(true);
    });

    test('should block navigation if guard returns false', async () => {
      router.registerRoute('/protected', jest.fn());
      router.addNavigationGuard('auth', () => false);

      const result = await router.navigate('/protected');
      expect(result).toBe(false);
      expect(mockPushState).not.toHaveBeenCalled();
    });

    test('should remove navigation guards', async () => {
      router.registerRoute('/protected', jest.fn());
      const guard = jest.fn(() => false);
      router.addNavigationGuard('auth', guard);
      router.removeNavigationGuard('auth');

      const result = await router.navigate('/protected');
      expect(result).toBe(true);
    });
  });

  describe('URL Helpers', () => {
    test('buildURL should construct correct URLs', () => {
      const url = router.buildURL('/search', { q: 'test', page: 2 });
      expect(url).toBe('/search?q=test&page=2');
    });

    test('updateParams should update URL without navigation', () => {
      window.location.pathname = '/search';
      window.location.search = '';
      router.currentRoute = '/search';

      router.updateParams({ q: 'updated' });
      expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/search?q=updated');
    });
  });

  describe('Error Handling', () => {
    test('should redirect to 404 route if route not found', async () => {
      const notFoundHandler = jest.fn();
      router.registerRoute('/404', notFoundHandler);
      router.initialize();

      await router.navigate('/non-existent');
      expect(notFoundHandler).toHaveBeenCalled();
      expect(router.getCurrentRoute()).toBe('/404');
    });

    test('should redirect to default route if 404 route not defined', async () => {
      router.initialize();
      await router.navigate('/non-existent');
      // Should redirect to /home (default)
      expect(mockPushState).toHaveBeenLastCalledWith(null, '', '/home');
    });

    test('should prevent infinite loop if default route is missing', async () => {
      // Unregister /home (clearing all routes)
      router.routes.clear();

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Navigate to missing route
      await router.navigate('/missing');

      // It should try to go to /home (default)
      // /home is missing.
      // It should NOT try to go to /home again.

      // We expect it to stop or throw.
      // With current code, it loops.
      // We will assert that it logs an error about "Infinite loop detected" or similar (after we fix it).
      // For now, let's see what happens.

      // Since we know it loops, we can't assert yet.
      // But we put this test here to verify the fix later.

      // Assuming we implement a check:
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Infinite redirect loop detected'),
      );
    });
  });
});
