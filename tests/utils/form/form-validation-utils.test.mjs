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
        contains: jest.fn(() => className ? true : false),
      },
      style: { display: 'block' },
      textContent: '',
      id,
    });

    const mockElements = {
      'recipe-form__error-message': mockElement('recipe-form__error-message'),
      'name': mockElement(null, 'name'),
      'dish-type': mockElement(null, 'dish-type'),
      'prep-time': mockElement(null, 'prep-time'),
    };

    const mockIngredientEntry = {
      querySelector: jest.fn((selector) => {
        if (selector.includes('quantity')) return mockElement('recipe-form__input--quantity');
        if (selector.includes('unit')) return mockElement('recipe-form__input--unit');
        if (selector.includes('item')) return mockElement('recipe-form__input--item');
        return null;
      })
    };

    return {
      querySelector: jest.fn((selector) => {
        if (selector === '.recipe-form__error-message') return mockElements['recipe-form__error-message'];
        return null;
      }),
      getElementById: jest.fn((id) => mockElements[id] || null),
      querySelectorAll: jest.fn((selector) => {
        if (selector === '.recipe-form__input, .recipe-form__select, .recipe-form__textarea') {
          return [mockElements['name'], mockElements['dish-type'], mockElements['prep-time']];
        }
        if (selector === '.recipe-form__ingredient-entry') {
          return [mockIngredientEntry];
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
      expect(mockShadowRoot.querySelector('.recipe-form__error-message').style.display).toBe('block');
    });

    it('should highlight ingredient field errors correctly', () => {
      const mockShadowRoot = createMockShadowRoot();
      const mockEntry = {
        querySelector: jest.fn((selector) => {
          if (selector === '.recipe-form__input--quantity') return { classList: { add: jest.fn() } };
          if (selector === '.recipe-form__input--unit') return { classList: { add: jest.fn() } };
          if (selector === '.recipe-form__input--item') return { classList: { add: jest.fn() } };
          return null;
        })
      };
      
      mockShadowRoot.querySelectorAll.mockImplementation((selector) => {
        if (selector === '.recipe-form__ingredient-entry') return [mockEntry];
        return [];
      });
      
      const recipeData = { name: 'Test' };
      const errors = { 'ingredients[0].amount': 'Amount is required' };
      
      mockValidateRecipeData.mockReturnValue({ isValid: false, errors });

      validateRecipeForm(recipeData, mockShadowRoot);

      expect(mockShadowRoot.querySelectorAll).toHaveBeenCalledWith('.recipe-form__ingredient-entry');
      expect(mockEntry.querySelector).toHaveBeenCalledWith('.recipe-form__input--quantity');
    });

    it('should highlight main field errors correctly', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = { name: '' };
      const errors = { name: 'Name is required' };
      
      mockValidateRecipeData.mockReturnValue({ isValid: false, errors });

      validateRecipeForm(recipeData, mockShadowRoot);

      expect(mockShadowRoot.getElementById).toHaveBeenCalledWith('name');
    });

    it('should clear previous error states before validation', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = { name: 'Test' };
      
      mockValidateRecipeData.mockReturnValue({ isValid: true, errors: null });

      validateRecipeForm(recipeData, mockShadowRoot);

      const elements = mockShadowRoot.querySelectorAll('.recipe-form__input, .recipe-form__select, .recipe-form__textarea');
      elements.forEach(element => {
        expect(element.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });
  });

  describe('clearValidationErrors', () => {
    it('should remove invalid class from all form elements', () => {
      const mockShadowRoot = createMockShadowRoot();

      clearValidationErrors(mockShadowRoot);

      const elements = mockShadowRoot.querySelectorAll('.recipe-form__input, .recipe-form__select, .recipe-form__textarea');
      elements.forEach(element => {
        expect(element.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });

    it('should call querySelectorAll with correct selector', () => {
      const mockShadowRoot = createMockShadowRoot();

      clearValidationErrors(mockShadowRoot);

      expect(mockShadowRoot.querySelectorAll).toHaveBeenCalledWith(
        '.recipe-form__input, .recipe-form__select, .recipe-form__textarea'
      );
    });
  });

  describe('validateField', () => {
    it('should validate field with valid value', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      const result = validateField('name', 'Valid Name', mockShadowRoot);

      expect(result).toBe(true);
      expect(mockShadowRoot.getElementById).toHaveBeenCalledWith('name');
    });

    it('should invalidate field with empty value', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      const result = validateField('name', '', mockShadowRoot);

      expect(result).toBe(false);
      expect(mockShadowRoot.getElementById).toHaveBeenCalledWith('name');
      expect(mockShadowRoot.getElementById('name').classList.add).toHaveBeenCalledWith('recipe-form__input--invalid');
    });

    it('should remove invalid class for valid fields', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      validateField('name', 'Valid Name', mockShadowRoot);

      expect(mockShadowRoot.getElementById('name').classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
    });

    it('should return true for unknown field names', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      const result = validateField('unknownField', 'value', mockShadowRoot);

      expect(result).toBe(true);
    });
  });

  describe('error highlighting', () => {
    it('should highlight instruction field errors', () => {
      const mockShadowRoot = createMockShadowRoot();
      mockShadowRoot.querySelectorAll.mockImplementation((selector) => {
        if (selector === '.recipe-form__stages input[type="text"]') {
          return [{ classList: { add: jest.fn() } }];
        }
        return [];
      });

      const recipeData = { name: 'Test' };
      const errors = { 'instructions[0]': 'Instruction is required' };
      
      mockValidateRecipeData.mockReturnValue({ isValid: false, errors });

      validateRecipeForm(recipeData, mockShadowRoot);

      expect(mockShadowRoot.querySelectorAll).toHaveBeenCalledWith('.recipe-form__stages input[type="text"]');
    });

    it('should highlight stage field errors', () => {
      const mockShadowRoot = createMockShadowRoot();
      const mockStage = {
        querySelector: jest.fn(() => ({ classList: { add: jest.fn() } }))
      };
      
      mockShadowRoot.querySelectorAll.mockImplementation((selector) => {
        if (selector === '.recipe-form__steps') {
          return [mockStage];
        }
        return [];
      });

      const recipeData = { name: 'Test' };
      const errors = { 'stages[0].title': 'Stage title is required' };
      
      mockValidateRecipeData.mockReturnValue({ isValid: false, errors });

      validateRecipeForm(recipeData, mockShadowRoot);

      expect(mockStage.querySelector).toHaveBeenCalledWith('.recipe-form__input--stage-name');
    });
  });
});