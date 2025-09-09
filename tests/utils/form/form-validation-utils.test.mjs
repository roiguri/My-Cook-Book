import { jest } from '@jest/globals';

// Mock the recipe-data-utils module
const mockValidateRecipeData = jest.fn();
jest.unstable_mockModule('../../../src/js/utils/recipes/recipe-data-utils.js', () => ({
  validateRecipeData: mockValidateRecipeData,
}));

// Import utilities to test
let validateRecipeForm, clearValidationErrors, validateField;

describe('form-validation-utils', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    const utils = await import('../../../src/js/utils/form/form-validation-utils.js');
    validateRecipeForm = utils.validateRecipeForm;
    clearValidationErrors = utils.clearValidationErrors;
    validateField = utils.validateField;
  });

  // Mock DOM elements and shadow root
  function createMockShadowRoot() {
    const mockElement = (className, id) => ({
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => (className ? true : false)),
      },
      style: { display: 'block' },
      textContent: '',
      id,
    });

    const mockElements = {
      'recipe-form__error-message': mockElement('recipe-form__error-message'),
      'metadata-fields': {
        setValidationState: jest.fn(),
        validate: jest.fn(() => ({ isValid: true, errors: {} })),
      },
      'ingredients-list': {
        setValidationState: jest.fn(),
        validate: jest.fn(() => ({ isValid: true, errors: {} })),
      },
      'instructions-list': {
        setValidationState: jest.fn(),
        validate: jest.fn(() => ({ isValid: true, errors: {} })),
      },
      comments: mockElement(null, 'comments'),
    };

    return {
      querySelector: jest.fn((selector) => {
        if (selector === '.recipe-form__error-message')
          return mockElements['recipe-form__error-message'];
        return null;
      }),
      getElementById: jest.fn((id) => mockElements[id] || null),
      querySelectorAll: jest.fn((selector) => {
        if (
          selector === '.recipe-form__stages input[type="text"], .recipe-form__input--stage-name'
        ) {
          return [mockElement('stage-input'), mockElement('stage-input')];
        }
        return [];
      }),
    };
  }

  describe('validateRecipeForm', () => {
    it('should return true when recipe data is valid', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = { name: 'Test Recipe' };

      mockValidateRecipeData.mockReturnValue({ isValid: true, errors: null });

      const result = validateRecipeForm(recipeData, mockShadowRoot);

      expect(result).toBe(true);
      expect(mockValidateRecipeData).toHaveBeenCalledWith(recipeData);
      expect(mockShadowRoot.querySelector).toHaveBeenCalledWith('.recipe-form__error-message');
    });

    it('should return false and show errors when recipe data is invalid', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = { name: '' };
      const errors = { name: 'Name is required' };

      mockValidateRecipeData.mockReturnValue({ isValid: false, errors });

      const result = validateRecipeForm(recipeData, mockShadowRoot);

      expect(result).toBe(false);
      expect(mockShadowRoot.querySelector('.recipe-form__error-message').style.display).toBe(
        'block',
      );
    });

    it('should call setValidationState on ingredients component for ingredient errors', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = { name: 'Test' };
      const errors = { 'ingredients[0].amount': 'Amount is required' };

      mockValidateRecipeData.mockReturnValue({ isValid: false, errors });

      validateRecipeForm(recipeData, mockShadowRoot);

      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');
      expect(ingredientsComponent.setValidationState).toHaveBeenCalledWith({
        'ingredients[0].amount': true,
      });
    });

    it('should call setValidationState on metadata component for metadata field errors', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = { name: '' };
      const errors = { name: 'Name is required' };

      mockValidateRecipeData.mockReturnValue({ isValid: false, errors });

      validateRecipeForm(recipeData, mockShadowRoot);

      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      expect(metadataComponent.setValidationState).toHaveBeenCalledWith({ name: true });
    });

    it('should clear previous error states before validation', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = { name: 'Test' };

      mockValidateRecipeData.mockReturnValue({ isValid: true, errors: null });

      validateRecipeForm(recipeData, mockShadowRoot);

      // Check that components received clear validation states
      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');

      expect(metadataComponent.setValidationState).toHaveBeenCalledWith({});
      expect(ingredientsComponent.setValidationState).toHaveBeenCalledWith({});
    });
  });

  describe('clearValidationErrors', () => {
    it('should clear validation state on all components', () => {
      const mockShadowRoot = createMockShadowRoot();

      clearValidationErrors(mockShadowRoot);

      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');

      expect(metadataComponent.setValidationState).toHaveBeenCalledWith({});
      expect(ingredientsComponent.setValidationState).toHaveBeenCalledWith({});
    });

    it('should call querySelectorAll with correct stage selector', () => {
      const mockShadowRoot = createMockShadowRoot();

      clearValidationErrors(mockShadowRoot);

      expect(mockShadowRoot.querySelectorAll).toHaveBeenCalledWith(
        '.recipe-form__stages input[type="text"], .recipe-form__input--stage-name',
      );
    });
  });

  describe('validateField', () => {
    beforeEach(() => {
      // Add a mock element for field validation testing
      const mockShadowRoot = createMockShadowRoot();
      const mockFieldElement = {
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
        },
      };
      mockShadowRoot.getElementById.mockImplementation((id) => {
        if (id === 'name') return mockFieldElement;
        return mockShadowRoot.getElementById.mockReturnValue(null);
      });
    });

    it('should validate field with valid value', () => {
      const mockShadowRoot = createMockShadowRoot();
      const mockElement = { classList: { add: jest.fn(), remove: jest.fn() } };
      mockShadowRoot.getElementById.mockReturnValue(mockElement);

      const result = validateField('name', 'Valid Name', mockShadowRoot);

      expect(result).toBe(true);
      expect(mockElement.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
    });

    it('should invalidate field with empty value', () => {
      const mockShadowRoot = createMockShadowRoot();
      const mockElement = { classList: { add: jest.fn(), remove: jest.fn() } };
      mockShadowRoot.getElementById.mockReturnValue(mockElement);

      const result = validateField('name', '', mockShadowRoot);

      expect(result).toBe(false);
      expect(mockElement.classList.add).toHaveBeenCalledWith('recipe-form__input--invalid');
    });

    it('should return true for unknown field names', () => {
      const mockShadowRoot = createMockShadowRoot();

      const result = validateField('unknownField', 'value', mockShadowRoot);

      expect(result).toBe(true);
    });
  });

  describe('error highlighting', () => {
    it('should validate ingredients component when it exists', () => {
      const mockShadowRoot = createMockShadowRoot();
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');
      ingredientsComponent.validate.mockReturnValue({
        isValid: false,
        errors: { 'ingredient-error': 'Missing ingredient' },
      });

      const recipeData = { name: 'Test' };
      mockValidateRecipeData.mockReturnValue({ isValid: true, errors: {} });

      const result = validateRecipeForm(recipeData, mockShadowRoot);

      expect(result).toBe(false);
      expect(ingredientsComponent.validate).toHaveBeenCalled();
      expect(ingredientsComponent.setValidationState).toHaveBeenCalledWith({
        'ingredient-error': 'Missing ingredient',
      });
    });

    it('should validate instructions component when it exists', () => {
      const mockShadowRoot = createMockShadowRoot();
      const instructionsComponent = mockShadowRoot.getElementById('instructions-list');
      instructionsComponent.validate.mockReturnValue({
        isValid: false,
        errors: { 'instruction-error': 'Missing instruction' },
      });

      const recipeData = { name: 'Test' };
      mockValidateRecipeData.mockReturnValue({ isValid: true, errors: {} });

      const result = validateRecipeForm(recipeData, mockShadowRoot);

      expect(result).toBe(false);
      expect(instructionsComponent.validate).toHaveBeenCalled();
      expect(instructionsComponent.setValidationState).toHaveBeenCalledWith({
        'instruction-error': 'Missing instruction',
      });
    });
  });
});
