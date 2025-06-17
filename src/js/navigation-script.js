function initializeNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navSearchContainer = document.querySelector('.nav-search-container');

  if (navToggle && navSearchContainer) {
    navToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navSearchContainer.classList.toggle('active');
    });
  }
}

// Initialize immediately if DOM is ready, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  initializeNavigation();
}
