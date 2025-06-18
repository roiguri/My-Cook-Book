export class AppRouter {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.defaultRoute = '/home';
    this.isInitialized = false;

    this.handlePopState = this.handlePopState.bind(this);
  }

  initialize() {
    if (this.isInitialized) return;

    window.addEventListener('popstate', this.handlePopState);

    this.isInitialized = true;

    // Parse initial route or navigate to default
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

    // Normalize path to always start with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    this.routes.set(normalizedPath, handler);
  }

  navigate(path, options = {}) {
    if (typeof path !== 'string') {
      throw new Error('Navigation path must be a string');
    }

    // Normalize path
    let normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Extract route path (before query string) for route matching
    const questionMarkIndex = normalizedPath.indexOf('?');
    const routePath =
      questionMarkIndex !== -1 ? normalizedPath.substring(0, questionMarkIndex) : normalizedPath;

    // Set current route before updating URL to prevent duplicate execution
    this.currentRoute = routePath;

    // Update URL using History API
    this.updateURL(normalizedPath, options.replace);

    // Execute handler
    this.executeRoute(routePath);
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getCurrentParams() {
    const params = {};

    // Parse URL parameters from current URL
    const searchParams = new URLSearchParams(window.location.search);

    // Convert URLSearchParams to regular object
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    // Also extract path parameters if needed (route/param format)
    if (this.currentRoute) {
      const routeParts = this.currentRoute.split('/').filter(Boolean);
      if (routeParts.length > 1) {
        params.id = routeParts[1];
      }
    }

    return params;
  }


  handlePopState() {
    // Handle browser back/forward buttons
    const newRoute = this.parseCurrentRoute();

    if (newRoute === this.currentRoute) return;

    if (this.routes.has(newRoute)) {
      this.currentRoute = newRoute;
      this.executeRoute(newRoute);
    } else {
      this.handleNotFound(newRoute);
    }
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

    // Ensure route starts with /
    if (!route.startsWith('/')) {
      route = `/${route}`;
    }

    // Default to root if empty
    if (route === '') {
      route = '/';
    }

    return route;
  }

  executeRoute(path) {
    // First try exact match
    let handler = this.routes.get(path);
    let params = this.getCurrentParams();

    // If no exact match, try parameterized routes
    if (!handler) {
      const matchResult = this.matchParameterizedRoute(path);
      if (matchResult) {
        handler = matchResult.handler;
        params = { ...params, ...matchResult.params };
      }
    }

    if (handler) {
      try {
        console.log(`Executing route ${path} with params:`, params);
        handler(params);
      } catch (error) {
        console.error(`Error executing route handler for ${path}:`, error);
        this.handleError(error, path);
      }
    } else {
      this.handleNotFound(path);
    }
  }

  // Match parameterized routes like /recipe/:id with /recipe/123
  matchParameterizedRoute(path) {
    for (const [routePattern, handler] of this.routes.entries()) {
      // Check if route pattern has parameters (contains :)
      if (routePattern.includes(':')) {
        const pathSegments = path.split('/').filter(Boolean);
        const patternSegments = routePattern.split('/').filter(Boolean);

        // Must have same number of segments
        if (pathSegments.length !== patternSegments.length) continue;

        const params = {};
        let isMatch = true;

        // Check each segment
        for (let i = 0; i < patternSegments.length; i++) {
          const patternSegment = patternSegments[i];
          const pathSegment = pathSegments[i];

          if (patternSegment.startsWith(':')) {
            // Parameter segment - extract value
            const paramName = patternSegment.substring(1);
            params[paramName] = pathSegment;
          } else if (patternSegment !== pathSegment) {
            // Literal segment must match exactly
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

    // Try to navigate to 404 page if registered
    if (this.routes.has('/404')) {
      this.currentRoute = '/404';
      this.executeRoute('/404');
    } else {
      // Fallback to default route
      console.warn(`No 404 handler found, redirecting to default route: ${this.defaultRoute}`);
      this.navigate(this.defaultRoute);
    }
  }

  handleError(error, path) {
    console.error(`Router error for path ${path}:`, error);

    // Try to navigate to error page if registered
    if (this.routes.has('/error')) {
      this.currentRoute = '/error';
      this.executeRoute('/error');
    } else {
      // Fallback to default route
      this.navigate(this.defaultRoute);
    }
  }

  // Utility method to check if a route is registered
  hasRoute(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return this.routes.has(normalizedPath);
  }

  // Get all registered routes
  getRoutes() {
    return Array.from(this.routes.keys());
  }

  // Set default route
  setDefaultRoute(path) {
    this.defaultRoute = path.startsWith('/') ? path : `/${path}`;
  }

  // Build URL with parameters
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

  // Update URL parameters without triggering navigation
  updateParams(params = {}) {
    const currentPath = this.parseCurrentRoute();
    const newURL = this.buildURL(currentPath, params);
    const currentFullPath = window.location.pathname + window.location.search;

    if (currentFullPath !== newURL) {
      history.replaceState(null, '', newURL);
    }
  }

  // Navigate with parameters
  navigateWithParams(path, params = {}) {
    const url = this.buildURL(path, params);
    this.navigate(url);
  }
}

// Export singleton instance for convenience
export const router = new AppRouter();
