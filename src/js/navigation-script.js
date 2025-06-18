function initializeNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navSearchContainer = document.querySelector('.nav-search-container');

  if (navToggle && navSearchContainer) {
    navToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navSearchContainer.classList.toggle('active');
    });
  }

  initializeSPANavigation();
}

function initializeSPANavigation() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    
    if (link && link.href && isInternalLink(link)) {
      if (
        e.defaultPrevented ||           // Event already handled
        e.button !== 0 ||              // Not a left click (middle/right click)
        e.metaKey ||                   // Cmd/Meta key (Mac)
        e.ctrlKey ||                   // Ctrl key (Windows/Linux)
        e.shiftKey ||                  // Shift key
        e.altKey                       // Alt key
      ) {
        return;
      }
      
      e.preventDefault();
      
      const url = new URL(link.href);
      const fullPath = url.pathname + url.search;
      
      if (window.spa && window.spa.router) {
        window.spa.router.navigate(fullPath);
        setTimeout(updateActiveNavigation, 100);
      } else {
        console.warn('SPA router not available, falling back to default navigation');
        window.location.href = link.href;
      }
    }
  });

  updateActiveNavigation();
  
  window.addEventListener('popstate', updateActiveNavigation);
}

function updateActiveNavigation() {
  const currentPath = window.location.pathname;
  
  const navLinks = document.querySelectorAll('header nav a');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    
    try {
      const linkUrl = new URL(link.href);
      const linkPath = linkUrl.pathname;
      
      const linkSearchParams = linkUrl.search;
      const currentSearchParams = window.location.search;
      const currentUrlParams = new URLSearchParams(currentSearchParams);
      const linkUrlParams = new URLSearchParams(linkSearchParams);
      
      const pathMatches = linkPath === currentPath || 
                         (linkPath === '/home' && currentPath === '/') ||
                         (linkPath === '/' && currentPath === '/home');
      
      let shouldBeActive = false;
      
      if (pathMatches) {
        if (linkPath === '/categories') {
          if (linkUrlParams.has('favorites')) {
            shouldBeActive = currentUrlParams.get('favorites') === 'true';
          } else {
            shouldBeActive = !currentUrlParams.has('favorites') || currentUrlParams.get('favorites') !== 'true';
          }
        } else {
          shouldBeActive = linkSearchParams === currentSearchParams;
        }
      }
      
      if (shouldBeActive) {
        link.classList.add('active');
      }
    } catch (e) {
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
