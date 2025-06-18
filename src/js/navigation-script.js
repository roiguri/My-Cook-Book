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
      } else {
        console.warn('SPA router not available, falling back to default navigation');
        window.location.href = link.href;
      }
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

// Initialize immediately if DOM is ready, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  initializeNavigation();
}
