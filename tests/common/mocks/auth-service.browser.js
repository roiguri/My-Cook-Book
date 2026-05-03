const authService = {
  getCurrentUser: () => ({
    uid: 'test-user',
    email: 'test@example.com',
    displayName: 'Test User',
  }),
  getCurrentAvatarUrl: () =>
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  addAuthObserver: () => {},
};
export default authService;
