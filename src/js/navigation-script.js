function initializeNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navSearchContainer = document.querySelector('.nav-search-container');

  if (navToggle && navSearchContainer) {
    navToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navSearchContainer.classList.toggle('active');
    });
  }

  // Handle SPA navigation for internal links
  initializeSPANavigation();
}

function initializeSPANavigation() {
  // Add click handlers to all internal navigation links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    
    // Only handle internal links that start with /
    if (link && link.href && isInternalLink(link)) {
      // Allow browser default behavior for modifier keys and non-left clicks
      if (
        e.defaultPrevented ||           // Event already handled
        e.button !== 0 ||              // Not a left click (middle/right click)
        e.metaKey ||                   // Cmd/Meta key (Mac)
        e.ctrlKey ||                   // Ctrl key (Windows/Linux)
        e.shiftKey ||                  // Shift key
        e.altKey                       // Alt key
      ) {
        return; // Let browser handle naturally (opens in new tab/window)
      }
      
      e.preventDefault();
      
      const url = new URL(link.href);
      const fullPath = url.pathname + url.search; // Include query parameters
      
      // Use the global SPA router to navigate
      if (window.spa && window.spa.router) {
        window.spa.router.navigate(fullPath);
        // Update active state immediately after navigation
        setTimeout(updateActiveNavigation, 100);
      } else {
        console.warn('SPA router not available, falling back to default navigation');
        window.location.href = link.href;
      }
    }
  });

  // Update active navigation states when route changes
  updateActiveNavigation();
  
  // Listen for route changes to update active states
  window.addEventListener('popstate', updateActiveNavigation);
}

function updateActiveNavigation() {
  const currentPath = window.location.pathname;
  console.log('Current path:', currentPath); // Debug log
  
  // Find all navigation links
  const navLinks = document.querySelectorAll('header nav a');
  console.log('Found nav links:', navLinks.length); // Debug log
  
  navLinks.forEach(link => {
    // Remove active class from all links
    link.classList.remove('active');
    
    // Get the link's path
    try {
      const linkUrl = new URL(link.href);
      const linkPath = linkUrl.pathname;
      console.log('Comparing:', linkPath, 'with', currentPath); // Debug log
      
      // Smart matching for navigation links
      const linkSearchParams = linkUrl.search;
      const currentSearchParams = window.location.search;
      const currentUrlParams = new URLSearchParams(currentSearchParams);
      const linkUrlParams = new URLSearchParams(linkSearchParams);
      
      const pathMatches = linkPath === currentPath || 
                         (linkPath === '/home' && currentPath === '/') ||
                         (linkPath === '/' && currentPath === '/home');
      
      let shouldBeActive = false;
      
      if (pathMatches) {
        // Special handling for categories vs favorites
        if (linkPath === '/categories') {
          if (linkUrlParams.has('favorites')) {
            // This is a favorites link - only match if current page has favorites=true
            shouldBeActive = currentUrlParams.get('favorites') === 'true';
          } else {
            // This is a categories link - match if current page is categories but NOT favorites
            shouldBeActive = !currentUrlParams.has('favorites') || currentUrlParams.get('favorites') !== 'true';
          }
        } else {
          // For non-categories pages, require exact query match
          shouldBeActive = linkSearchParams === currentSearchParams;
        }
      }
      
      if (shouldBeActive) {
        console.log('Setting active for:', link.href); // Debug log
        link.classList.add('active');
      }
    } catch (e) {
      // Skip invalid URLs
      console.warn('Invalid navigation link URL:', link.href);
    }
  });
}

function isInternalLink(link) {
  // Check if link is internal (same origin and starts with /)
  try {
    const linkUrl = new URL(link.href);
    const currentUrl = new URL(window.location.href);
    
    return linkUrl.origin === currentUrl.origin && 
           linkUrl.pathname.startsWith('/') && 
           !linkUrl.pathname.startsWith('/api') &&
           !link.hasAttribute('target') &&
           !link.download;
  } catch (e) {
    return false;
  }
}

// Make updateActiveNavigation available globally for other components
window.updateActiveNavigation = updateActiveNavigation;

// Initialize immediately if DOM is ready, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  initializeNavigation();
}
