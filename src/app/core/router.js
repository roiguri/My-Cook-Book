export class AppRouter {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.defaultRoute = '/home';
    this.isInitialized = false;
    
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
  }

  initialize() {
    if (this.isInitialized) return;
    
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('popstate', this.handlePopState);
    
    this.isInitialized = true;
    
    // Parse initial route or navigate to default
    const initialRoute = this.parseCurrentRoute();
    if (!initialRoute || initialRoute === '/') {
      this.navigate(this.defaultRoute);
    } else if (this.routes.has(initialRoute)) {
      this.currentRoute = initialRoute;
      this.executeRoute(initialRoute);
    } else {
      this.handleNotFound(initialRoute);
    }
  }

  destroy() {
    if (!this.isInitialized) return;
    
    window.removeEventListener('hashchange', this.handleHashChange);
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

  navigate(path) {
    if (typeof path !== 'string') {
      throw new Error('Navigation path must be a string');
    }
    
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Update URL with hash
    this.updateURL(normalizedPath);
    
    // Set current route and execute handler
    this.currentRoute = normalizedPath;
    this.executeRoute(normalizedPath);
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getCurrentParams() {
    if (!this.currentRoute) return {};
    
    // Extract parameters from current route
    // For now, simple implementation - can be enhanced for complex routing
    const routeParts = this.currentRoute.split('/').filter(Boolean);
    const params = {};
    
    // Simple parameter extraction (route/param format)
    if (routeParts.length > 1) {
      params.id = routeParts[1];
    }
    
    return params;
  }

  handleHashChange(event) {
    const newRoute = this.parseCurrentRoute();
    
    if (newRoute === this.currentRoute) return;
    
    if (this.routes.has(newRoute)) {
      this.currentRoute = newRoute;
      this.executeRoute(newRoute);
    } else {
      this.handleNotFound(newRoute);
    }
  }

  handlePopState(event) {
    // Handle browser back/forward buttons
    this.handleHashChange(event);
  }

  updateURL(path) {
    const newHash = `#${path}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }

  parseCurrentRoute() {
    const hash = window.location.hash;
    
    // Remove # and normalize
    const route = hash ? hash.substring(1) : '/';
    
    // Ensure route starts with /
    return route.startsWith('/') ? route : `/${route}`;
  }

  executeRoute(path) {
    const handler = this.routes.get(path);
    if (handler) {
      try {
        const params = this.getCurrentParams();
        handler(params);
      } catch (error) {
        console.error(`Error executing route handler for ${path}:`, error);
        this.handleError(error, path);
      }
    } else {
      this.handleNotFound(path);
    }
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
}

// Export singleton instance for convenience
export const router = new AppRouter();