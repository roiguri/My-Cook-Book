import { jest } from '@jest/globals';

// Import utilities to test
let setFormDisabledState, clearForm, populateFormWithData, setFormLoadingState;

describe('form-state-manager', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    const utils = await import('../../../src/js/utils/form/form-state-manager.js');
    setFormDisabledState = utils.setFormDisabledState;
    clearForm = utils.clearForm;
    populateFormWithData = utils.populateFormWithData;
    setFormLoadingState = utils.setFormLoadingState;
  });

  // Mock DOM elements and shadow root
  function createMockShadowRoot() {
    const mockFormElement = (type = 'input', value = '') => ({
      type,
      value,
      disabled: false,
      selectedIndex: 0,
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
      },
      reset: jest.fn(),
    });

    const mockIngredientEntry = {
      querySelector: jest.fn((selector) => {
        if (selector.includes('quantity')) return mockFormElement('input', 'test-amount');
        if (selector.includes('unit')) return mockFormElement('input', 'test-unit');
        if (selector.includes('item')) return mockFormElement('input', 'test-item');
        if (selector === 'button') return mockFormElement('button');
        return null;
      }),
      remove: jest.fn(),
    };

    const mockStep = {
      querySelector: jest.fn((selector) => {
        if (selector === 'input[type="text"]') return mockFormElement('input', 'test-step');
        if (selector === 'button') return mockFormElement('button');
        return null;
      }),
      remove: jest.fn(),
    };

    const mockStage = {
      querySelector: jest.fn((selector) => {
        if (selector === '.recipe-form__stage-header') return { remove: jest.fn() };
        if (selector === '.recipe-form__input--stage-name') return { remove: jest.fn() };
        return null;
      }),
      querySelectorAll: jest.fn((selector) => {
        if (selector === '.recipe-form__step') return [mockStep];
        return [];
      }),
      remove: jest.fn(),
    };

    const mockImageHandler = {
      setDisabled: jest.fn(),
      clearImages: jest.fn(),
      populateImages: jest.fn(),
    };

    const mockElements = {
      'name': mockFormElement('input'),
      'dish-type': mockFormElement('select'),
      'prep-time': mockFormElement('input'),
      'wait-time': mockFormElement('input'),
      'servings-form': mockFormElement('input'),
      'difficulty': mockFormElement('select'),
      'main-ingredient': mockFormElement('input'),
      'tags': mockFormElement('input'),
      'comments': mockFormElement('textarea'),
      'recipe-form': { reset: jest.fn() },
      'submit-button': mockFormElement('button'),
      'recipe-images': mockImageHandler,
      'stages-container': {
        querySelectorAll: jest.fn(() => [mockStage]),
      },
    };

    const mockErrorMessage = {
      style: { display: 'block' },
    };

    return {
      getElementById: jest.fn((id) => mockElements[id] || null),
      querySelector: jest.fn((selector) => {
        if (selector === '.recipe-form__error-message') return mockErrorMessage;
        if (selector === '.recipe-form__ingredients') {
          return {
            querySelectorAll: jest.fn(() => [mockIngredientEntry]),
          };
        }
        return null;
      }),
      querySelectorAll: jest.fn((selector) => {
        if (selector === 'input, select, textarea, button') {
          return [mockElements['name'], mockElements['dish-type'], mockElements['submit-button']];
        }
        if (selector === 'input') {
          return [mockElements['name'], mockElements['prep-time']];
        }
        if (selector === 'select') {
          return [mockElements['dish-type'], mockElements['difficulty']];
        }
        if (selector === 'textarea') {
          return [mockElements['comments']];
        }
        return [];
      }),
    };
  }

  describe('setFormDisabledState', () => {
    it('should disable all form elements when isDisabled is true', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      setFormDisabledState(mockShadowRoot, true);

      const elements = mockShadowRoot.querySelectorAll('input, select, textarea, button');
      elements.forEach(element => {
        expect(element.disabled).toBe(true);
      });
    });

    it('should enable all form elements when isDisabled is false', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      setFormDisabledState(mockShadowRoot, false);

      const elements = mockShadowRoot.querySelectorAll('input, select, textarea, button');
      elements.forEach(element => {
        expect(element.disabled).toBe(false);
      });
    });

    it('should call setDisabled on image handler if available', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      setFormDisabledState(mockShadowRoot, true);

      const imageHandler = mockShadowRoot.getElementById('recipe-images');
      expect(imageHandler.setDisabled).toHaveBeenCalledWith(true);
    });

    it('should handle missing image handler gracefully', () => {
      const mockShadowRoot = createMockShadowRoot();
      mockShadowRoot.getElementById.mockImplementation((id) => {
        if (id === 'recipe-images') return null;
        return createMockShadowRoot().getElementById(id);
      });
      
      expect(() => setFormDisabledState(mockShadowRoot, true)).not.toThrow();
    });
  });

  describe('clearForm', () => {
    it('should clear all input fields and remove validation states', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      const inputs = mockShadowRoot.querySelectorAll('input');
      inputs.forEach(input => {
        expect(input.value).toBe('');
        expect(input.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });

    it('should reset all select fields', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      const selects = mockShadowRoot.querySelectorAll('select');
      selects.forEach(select => {
        expect(select.selectedIndex).toBe(0);
        expect(select.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });

    it('should clear all textarea fields', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      const textareas = mockShadowRoot.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        expect(textarea.value).toBe('');
        expect(textarea.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });

    it('should reset ingredients to initial state', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      expect(mockShadowRoot.querySelector).toHaveBeenCalledWith('.recipe-form__ingredients');
    });

    it('should clear images through image handler', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      const imageHandler = mockShadowRoot.getElementById('recipe-images');
      expect(imageHandler.clearImages).toHaveBeenCalled();
    });

    it('should reset form and hide error messages', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      const form = mockShadowRoot.getElementById('recipe-form');
      expect(form.reset).toHaveBeenCalled();

      const errorMessage = mockShadowRoot.querySelector('.recipe-form__error-message');
      expect(errorMessage.style.display).toBe('none');
    });

    it('should handle missing form elements gracefully', () => {
      const mockShadowRoot = createMockShadowRoot();
      mockShadowRoot.querySelector.mockImplementation((selector) => {
        if (selector === '.recipe-form__ingredients') return null;
        return createMockShadowRoot().querySelector(selector);
      });
      
      expect(() => clearForm(mockShadowRoot)).not.toThrow();
    });
  });

  describe('populateFormWithData', () => {
    it('should populate basic fields correctly', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = {
        name: 'Test Recipe',
        category: 'main-courses',
        prepTime: 30,
        waitTime: 45,
        servings: 4,
        difficulty: 'קלה',
        mainIngredient: 'Chicken',
        tags: ['healthy', 'quick'],
        comments: ['Great recipe', 'Easy to make'],
        ingredients: [
          { amount: '1', unit: 'cup', item: 'rice' }
        ],
      };

      populateFormWithData(mockShadowRoot, recipeData);

      expect(mockShadowRoot.getElementById('name').value).toBe('Test Recipe');
      expect(mockShadowRoot.getElementById('dish-type').value).toBe('main-courses');
      expect(mockShadowRoot.getElementById('prep-time').value).toBe(30);
      expect(mockShadowRoot.getElementById('tags').value).toBe('healthy, quick');
      expect(mockShadowRoot.getElementById('comments').value).toBe('Great recipe\nEasy to make');
    });

    it('should handle missing optional fields', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = {
        name: 'Test Recipe',
        ingredients: [],
      };

      expect(() => populateFormWithData(mockShadowRoot, recipeData)).not.toThrow();
    });

    it('should populate images if provided', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = {
        name: 'Test Recipe',
        ingredients: [],
        images: [
          { id: 'img1', isPrimary: true }
        ],
      };

      populateFormWithData(mockShadowRoot, recipeData);

      const imageHandler = mockShadowRoot.getElementById('recipe-images');
      expect(imageHandler.populateImages).toHaveBeenCalledWith(recipeData.images);
    });

    it('should handle non-array tags', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = {
        name: 'Test Recipe',
        tags: 'single-tag',
        ingredients: [],
      };

      populateFormWithData(mockShadowRoot, recipeData);

      expect(mockShadowRoot.getElementById('tags').value).toBe('single-tag');
    });

    it('should handle non-array comments', () => {
      const mockShadowRoot = createMockShadowRoot();
      const recipeData = {
        name: 'Test Recipe',
        comments: 'Single comment',
        ingredients: [],
      };

      populateFormWithData(mockShadowRoot, recipeData);

      expect(mockShadowRoot.getElementById('comments').value).toBe('Single comment');
    });
  });

  describe('setFormLoadingState', () => {
    it('should disable form and update submit button when loading', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      setFormLoadingState(mockShadowRoot, true);

      const elements = mockShadowRoot.querySelectorAll('input, select, textarea, button');
      elements.forEach(element => {
        expect(element.disabled).toBe(true);
      });

      const submitButton = mockShadowRoot.getElementById('submit-button');
      expect(submitButton.textContent).toBe('שולח...');
      expect(submitButton.classList.add).toHaveBeenCalledWith('loading');
    });

    it('should enable form and reset submit button when not loading', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      setFormLoadingState(mockShadowRoot, false);

      const elements = mockShadowRoot.querySelectorAll('input, select, textarea, button');
      elements.forEach(element => {
        expect(element.disabled).toBe(false);
      });

      const submitButton = mockShadowRoot.getElementById('submit-button');
      expect(submitButton.classList.remove).toHaveBeenCalledWith('loading');
    });

    it('should handle missing submit button gracefully', () => {
      const mockShadowRoot = createMockShadowRoot();
      mockShadowRoot.getElementById.mockImplementation((id) => {
        if (id === 'submit-button') return null;
        return createMockShadowRoot().getElementById(id);
      });
      
      expect(() => setFormLoadingState(mockShadowRoot, true)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle null shadowRoot gracefully', () => {
      expect(() => setFormDisabledState(null, true)).not.toThrow();
      expect(() => clearForm(null)).not.toThrow();
      expect(() => populateFormWithData(null, {})).not.toThrow();
      expect(() => setFormLoadingState(null, true)).not.toThrow();
    });

    it('should handle empty querySelectorAll results', () => {
      const mockShadowRoot = createMockShadowRoot();
      mockShadowRoot.querySelectorAll.mockReturnValue([]);
      
      expect(() => setFormDisabledState(mockShadowRoot, true)).not.toThrow();
      expect(() => clearForm(mockShadowRoot)).not.toThrow();
    });
  });
});