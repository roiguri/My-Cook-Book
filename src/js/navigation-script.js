function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navSearchContainer = document.querySelector('.nav-search-container');

  if (navToggle && navSearchContainer) {
    navToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navSearchContainer.classList.toggle('active');
    });
  } else {
    console.error('Navigation elements not found for initNavigation');
  }
}

document.addEventListener('pageContentLoaded', initNavigation);
