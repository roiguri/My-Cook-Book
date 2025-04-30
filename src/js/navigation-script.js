document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navSearchContainer = document.querySelector('.nav-search-container');

  navToggle.addEventListener('click', function () {
    this.classList.toggle('active');
    navSearchContainer.classList.toggle('active');
  });
});
