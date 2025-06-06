import authService from '../../src/js/services/auth-service.js';
import '../../src/lib/modals/message-modal/message-modal.js'; // Define message-modal
import '../../src/lib/auth/auth-controller.js'; // Define auth-controller
// Import the script we are testing AFTER mocks are set up for authService
// import '../../src/pages/propose-recipe.js';

// Mock AuthService
let mockIsAuthenticated = false;
let authObserverCallback = null;
const mockAuthService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  isAuthenticated: jest.fn(() => mockIsAuthenticated),
  addAuthObserver: jest.fn((callback) => {
    authObserverCallback = callback;
  }),
  // Add any other methods from authService that might be called, mocking them as needed
  getCurrentUser: jest.fn(() => null)
};
jest.mock('../../src/js/services/auth-service.js', () => ({
  __esModule: true,
  default: mockAuthService,
  AuthService: jest.fn(() => mockAuthService) // If AuthService class is ever instantiated
}));

describe('Propose Recipe Page Authentication Flow', () => {
  let proposeRecipeForm;
  let loginPromptModal;
  let authController;

  beforeEach(() => {
    // Reset mocks and DOM before each test
    mockIsAuthenticated = false;
    authObserverCallback = null;
    jest.clearAllMocks();

    // Set up mock DOM
    document.body.innerHTML = `
      <propose-recipe-component></propose-recipe-component>
      <message-modal id="login-prompt-modal"></message-modal>
      <auth-controller></auth-controller>
    `;

    proposeRecipeForm = document.querySelector('propose-recipe-component');
    if (proposeRecipeForm) {
      proposeRecipeForm.setFormDisabled = jest.fn();
      proposeRecipeForm.style.display = 'block'; // Form should always be 'block' now
    } else {
      console.error('propose-recipe-component not found in DOM for testing');
    }

    loginPromptModal = document.querySelector('#login-prompt-modal');
    authController = document.querySelector('auth-controller');

    if (loginPromptModal) {
        loginPromptModal.show = jest.fn();
        loginPromptModal.close = jest.fn();
    }
    if (authController) {
        authController.openModal = jest.fn();
    }

    // Dynamically import the script to test after mocks and DOM are set up
    require('../../src/pages/propose-recipe.js');

    // Trigger DOMContentLoaded manually
    document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
  });

  test('Unauthenticated user: shows login prompt, disables form, and login button works', () => {
    mockIsAuthenticated = false;
    if (authObserverCallback) authObserverCallback({ isAuthenticated: false });

    expect(proposeRecipeForm.setFormDisabled).toHaveBeenCalledWith(true);
    expect(loginPromptModal.show).toHaveBeenCalledWith(
      'Only logged-in users can propose recipes. Please log in or sign up to continue.',
      'Login Required',
      'Log In / Sign Up',
      expect.any(Function)
    );

    const showCallArgs = loginPromptModal.show.mock.calls[0];
    const loginButtonCallback = showCallArgs[3];

    loginButtonCallback();

    expect(loginPromptModal.close).toHaveBeenCalled();
    expect(authController.openModal).toHaveBeenCalled();
     // Ensure no redirect happens when login button is clicked
    expect(window.location.href).not.toBe('/');
  });

  test('Authenticated user: shows form, enables form, and login prompt is not shown/closed', () => {
    mockIsAuthenticated = true;
    if (authObserverCallback) authObserverCallback({ isAuthenticated: true });

    expect(proposeRecipeForm.style.display).toBe('block');
    expect(proposeRecipeForm.setFormDisabled).toHaveBeenCalledWith(false);
    // If loginPromptModal was shown before, it should be closed.
    // If it was never shown, close wouldn't be called.
    // So, we check that it's not shown, or if shown, it's closed.
    if (loginPromptModal.show.mock.calls.length > 0) {
        expect(loginPromptModal.close).toHaveBeenCalled();
    }
    // More direct: ensure show is not called after auth, or if it was, it's for a different state.
    // For this test, we want to make sure it's NOT being called for the authenticated state.
    // A simple way is to check call counts if other tests might have called it.
    // Resetting mock call counts in beforeEach helps here.
    const showCallsForUnauthenticated = loginPromptModal.show.mock.calls.filter(
        call => call[1] === 'Login Required' // Check based on title or message
    );
    if(mockAuthService.isAuthenticated()){
        expect(loginPromptModal.show).not.toHaveBeenCalledWith(expect.anything(), 'Login Required', expect.anything(), expect.anything());
    }
  });

  test('Transition: Unauthenticated to Authenticated', () => {
    mockIsAuthenticated = false;
    if (authObserverCallback) authObserverCallback({ isAuthenticated: false });

    expect(proposeRecipeForm.setFormDisabled).toHaveBeenCalledWith(true);
    expect(loginPromptModal.show).toHaveBeenCalledTimes(1);

    mockIsAuthenticated = true;
    if (authObserverCallback) authObserverCallback({ isAuthenticated: true });

    expect(proposeRecipeForm.setFormDisabled).toHaveBeenCalledWith(false);
    expect(loginPromptModal.close).toHaveBeenCalled();
  });

  test('Unauthenticated user closes login prompt modal and is redirected', () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    mockIsAuthenticated = false;
    if (authObserverCallback) authObserverCallback({ isAuthenticated: false });

    loginPromptModal.dispatchEvent(new CustomEvent('modal-closed-by-user', { bubbles: true, composed: true }));

    expect(window.location.href).toBe('/');

    window.location = originalLocation;
  });
});
