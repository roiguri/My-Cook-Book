// Get recipe ID from URL and initialize component
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  const recipeContainer = document.querySelector('.recipe-container');
  const recipeComponent = document.createElement('recipe-component');
  recipeComponent.setAttribute('recipe-id', recipeId);
  recipeContainer.appendChild(recipeComponent);
});
