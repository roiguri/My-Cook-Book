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

  navigate(path, options = {}) {
    if (typeof path !== 'string') {
      throw new Error('Navigation path must be a string');
    }

    let normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const questionMarkIndex = normalizedPath.indexOf('?');
    const routePath =
      questionMarkIndex !== -1 ? normalizedPath.substring(0, questionMarkIndex) : normalizedPath;

    this.currentRoute = routePath;

    this.updateURL(normalizedPath, options.replace);

    this.executeRoute(routePath);
  }

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
}

export const router = new AppRouter();
