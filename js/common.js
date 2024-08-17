firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log('User is signed in:', user.email);
    updateUIForUser(user);
  } else {
    // User is signed out
    console.log('User is signed out');
    updateUIForSignedOutUser();
  }
});

function updateUIForUser(user) {
  // Update UI elements for signed-in state
  const authTrigger = document.getElementById('auth-trigger');
  if (authTrigger) {
    authTrigger.innerHTML = `<div class="avatar">${user.email[0].toUpperCase()}</div>`;
  }
  // Add other UI updates as needed
}

function updateUIForSignedOutUser() {
  // Update UI elements for signed-out state
  const authTrigger = document.getElementById('auth-trigger');
  if (authTrigger) {
    authTrigger.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
  }
  // Add other UI updates as needed
}