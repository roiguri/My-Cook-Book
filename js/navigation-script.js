document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navSearchContainer = document.querySelector('.nav-search-container');
  
    navToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      navSearchContainer.classList.toggle('active');
    });
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}