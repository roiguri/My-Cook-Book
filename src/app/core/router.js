// Assuming PageManager is the class that manages page loading and instances
import { PageManager } from './page-manager.js';
// MessageModal would also need to be imported if used directly.
// import MessageModal from '../../lib/modals/message-modal/message-modal.js';

export class AppRouter {
  constructor() {
    this.routes = new Map();
    // this.messageModalInstance = null; // For a shared modal instance
    this.currentRoute = null;
    this.defaultRoute = '/home';
    this.isInitialized = false;

    this.handlePopState = this.handlePopState.bind(this);
  }

  initialize() {
    if (this.isInitialized) return;

    window.addEventListener('popstate', this.handlePopState);

    this.isInitialized = true;

    const initialRoute = this.parseCurrentRoute();
    if (!initialRoute || initialRoute === '/') {
      this.navigate(this.defaultRoute, { replace: true });
    } else if (this.routes.has(initialRoute) || this.matchParameterizedRoute(initialRoute)) {
      this.currentRoute = initialRoute;
      this.executeRoute(initialRoute);
    } else {
      this.handleNotFound(initialRoute);
    }
  }

  destroy() {
    if (!this.isInitialized) return;

    window.removeEventListener('popstate', this.handlePopState);

    this.isInitialized = false;
    this.currentRoute = null;
  }

  registerRoute(path, handler) {
    if (typeof path !== 'string' || typeof handler !== 'function') {
      throw new Error('Route path must be a string and handler must be a function');
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    this.routes.set(normalizedPath, handler);
  }

  async navigate(path, options = {}) {
    if (typeof path !== 'string') {
      throw new Error('Navigation path must be a string');
    }

    const currentPageInstance = PageManager.getCurrentPageInstance(); // Conceptual

    // Check #1: Page's own desire to prevent navigation (e.g. its own modal is open)
    // This is slightly different from the PRD's `this.currentPage.hasUnsavedChanges` directly in router,
    // as the page's unmount now handles its own confirmation.
    if (currentPageInstance && typeof currentPageInstance.unmount === 'function') {
      // The unmount method in propose-recipe-page now returns true/false.
      // It needs to be async if it's showing its own modal.
      const canUnmount = await currentPageInstance.unmount();
      if (canUnmount === false) { // Explicitly check for false
        console.log('Router: Navigation prevented by page unmount confirmation.');
        // Attempt to restore URL if popstate changed it. This is tricky.
        // For now, primarily for link clicks, this stops before URL change.
        // If it was a popstate, the URL is already new. We might need to navigate back to this.currentRoute
        // if the URL actually changed.
        // For now, we prevent the route execution and new history state.
        // A robust solution for popstate requires checking if window.location.pathname !== this.currentRoute
        // and then history.pushState(null, '', this.currentRoute) - but this could cause loops if not careful.
        return;
      }
      // If canUnmount is true, it means either no unsaved changes, or user confirmed leaving.
    }

    // Check #2: Generic unsaved changes check if unmount didn't handle it or if page doesn't have complex unmount
    // This aligns more with the PRD's router-level check.
    // This could be redundant if all pages implement the unmount check like propose-recipe-page.
    // Or, it can be a fallback.
    // Let's assume for now that if a page has `hasUnsavedChanges`, its `unmount` will use it.
    // So, the primary check is the `await currentPageInstance.unmount()` above.

    // The PRD also mentions:
    // if (this.currentPage?.hasUnsavedChanges?.()) {
    //   const confirmed = await this.showNavigationConfirmation();
    //   if (!confirmed) return; // Prevent navigation
    // }
    // This is now effectively handled by the page's own unmount method for `propose-recipe-page`.
    // If we need a generic router modal for pages *without* the new unmount logic,
    // we could add that check here. For now, relying on page's unmount.


    let normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const questionMarkIndex = normalizedPath.indexOf('?');
    const routePath =
      questionMarkIndex !== -1 ? normalizedPath.substring(0, questionMarkIndex) : normalizedPath;

    // If navigation was prevented, currentRoute should not change.
    // If it proceeded, then update route and URL.
    const previousRoute = this.currentRoute;
    this.currentRoute = routePath;

    try {
      this.updateURL(normalizedPath, options.replace);
      this.executeRoute(routePath); // This is where PageManager.loadPage would be called by the handler
      this.dispatchNavigationEvent(normalizedPath);
    } catch (error) {
      // If executeRoute fails (e.g. page load error), revert currentRoute
      this.currentRoute = previousRoute;
      console.error("Error during route execution, currentRoute reverted.", error);
      // Potentially navigate to an error page or re-throw
      this.handleError(error, path);
    }
  }

  // Placeholder for router-specific confirmation, if needed for pages not implementing the new unmount.
  // async showNavigationConfirmation() {
  //   // const modal = this.messageModalInstance || document.querySelector('message-modal');
  //   // if (!modal) {
  //   //   console.warn('MessageModal not available for router confirmation.');
  //   //   return window.confirm('You have unsaved changes. Are you sure you want to leave?');
  //   // }
  //   // return new Promise(resolve => {
  //   //   modal.show('You have unsaved changes. Are you sure you want to leave this page?',
  //   //              'Confirm Navigation', 'Leave', () => resolve(true), 'Stay', () => resolve(false));
  //   // });
  //   return window.confirm('Router: You have unsaved changes. Are you sure you want to leave this page?');
  // }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getCurrentParams() {
    const params = {};

    const searchParams = new URLSearchParams(window.location.search);

    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    if (this.currentRoute) {
      const routeParts = this.currentRoute.split('/').filter(Boolean);
      if (routeParts.length > 1) {
        params.id = routeParts[1];
      }
    }

    return params;
  }

  handlePopState() {
    const newRoute = this.parseCurrentRoute();

    if (newRoute === this.currentRoute) return;

    // For popstate, the URL has already changed.
    // We must call `navigate` to run all guards and lifecycle hooks.
    // `navigate` will then call `executeRoute` if it's allowed to proceed.
    // Using an IIFE because `handlePopState` itself is not async.
    (async () => {
      // Pass `isPopState: true` if `navigate` needs to handle popstate differently (e.g., not pushing history)
      // For now, `replace: true` should suffice to prevent adding to history.
      await this.navigate(newRoute, { replace: true });
    })();
  }

  updateURL(path, replace = false) {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== path) {
      if (replace) {
        history.replaceState(null, '', path);
      } else {
        history.pushState(null, '', path);
      }
    }
  }

  parseCurrentRoute() {
    let route = window.location.pathname;

    if (!route.startsWith('/')) {
      route = `/${route}`;
    }

    if (route === '') {
      route = '/';
    }

    return route;
  }

  executeRoute(path) {
    let handler = this.routes.get(path);
    let params = this.getCurrentParams();

    if (!handler) {
      const matchResult = this.matchParameterizedRoute(path);
      if (matchResult) {
        handler = matchResult.handler;
        params = { ...params, ...matchResult.params };
      }
    }

    if (handler) {
      try {
        handler(params);
      } catch (error) {
        console.error(`Error executing route handler for ${path}:`, error);
        this.handleError(error, path);
      }
    } else {
      this.handleNotFound(path);
    }
  }

  matchParameterizedRoute(path) {
    for (const [routePattern, handler] of this.routes.entries()) {
      if (routePattern.includes(':')) {
        const pathSegments = path.split('/').filter(Boolean);
        const patternSegments = routePattern.split('/').filter(Boolean);

        if (pathSegments.length !== patternSegments.length) continue;

        const params = {};
        let isMatch = true;

        for (let i = 0; i < patternSegments.length; i++) {
          const patternSegment = patternSegments[i];
          const pathSegment = pathSegments[i];

          if (patternSegment.startsWith(':')) {
            const paramName = patternSegment.substring(1);
            params[paramName] = pathSegment;
          } else if (patternSegment !== pathSegment) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          return { handler, params };
        }
      }
    }

    return null;
  }

  handleNotFound(path) {
    console.warn(`Route not found: ${path}`);

    if (this.routes.has('/404')) {
      this.currentRoute = '/404';
      this.executeRoute('/404');
    } else {
      console.warn(`No 404 handler found, redirecting to default route: ${this.defaultRoute}`);
      this.navigate(this.defaultRoute);
    }
  }

  handleError(error, path) {
    console.error(`Router error for path ${path}:`, error);

    if (this.routes.has('/error')) {
      this.currentRoute = '/error';
      this.executeRoute('/error');
    } else {
      this.navigate(this.defaultRoute);
    }
  }

  hasRoute(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return this.routes.has(normalizedPath);
  }

  getRoutes() {
    return Array.from(this.routes.keys());
  }

  setDefaultRoute(path) {
    this.defaultRoute = path.startsWith('/') ? path : `/${path}`;
  }

  buildURL(path, params = {}) {
    let url = path.startsWith('/') ? path : `/${path}`;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.set(key, value);
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  updateParams(params = {}) {
    const currentPath = this.parseCurrentRoute();
    const newURL = this.buildURL(currentPath, params);
    const currentFullPath = window.location.pathname + window.location.search;

    if (currentFullPath !== newURL) {
      history.replaceState(null, '', newURL);
    }
  }

  navigateWithParams(path, params = {}) {
    const url = this.buildURL(path, params);
    this.navigate(url);
  }

  dispatchNavigationEvent(path) {
    // Dispatch a custom event that navigation script can listen to
    const navigationEvent = new CustomEvent('spa-navigation', {
      detail: { path },
    });
    window.dispatchEvent(navigationEvent);
  }

  // Categories page specific URL helpers
  buildCategoriesParams(currentCategory, currentSearchQuery, activeFilters) {
    const params = {};

    if (currentCategory && currentCategory !== 'all') {
      params.category = currentCategory;
    }

    if (currentSearchQuery) {
      params.q = currentSearchQuery;
    }

    if (activeFilters.favoritesOnly) {
      params.favorites = 'true';
    }

    return params;
  }

  updateCategoriesParams(currentCategory, currentSearchQuery, activeFilters) {
    const params = this.buildCategoriesParams(currentCategory, currentSearchQuery, activeFilters);
    this.updateParams(params);
  }

  navigateToCategoriesWithParams(currentCategory, currentSearchQuery, activeFilters) {
    const params = this.buildCategoriesParams(currentCategory, currentSearchQuery, activeFilters);
    this.navigateWithParams('/categories', params);
  }
}

export const router = new AppRouter();
