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
    const mockFormElement = (type = 'input', value = '') => {
      const element = {
        type,
        value,
        disabled: false,
        selectedIndex: 0,
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
        },
        reset: jest.fn(),
        textContent: 'Submit Recipe',
      };
      // Make disabled property writable to track changes
      Object.defineProperty(element, 'disabled', {
        writable: true,
        value: false,
      });
      Object.defineProperty(element, 'value', {
        writable: true,
        value: value,
      });
      Object.defineProperty(element, 'selectedIndex', {
        writable: true,
        value: 0,
      });
      Object.defineProperty(element, 'textContent', {
        writable: true,
        value: type === 'button' ? 'Submit Recipe' : '',
      });
      return element;
    };

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
      'instructions-list': {
        clearInstructions: jest.fn(),
      },
      'metadata-fields': {
        setDisabled: jest.fn(),
        clearFields: jest.fn(),
      },
      'ingredients-list': {
        setDisabled: jest.fn(),
        clear: jest.fn(),
      },
      'form-buttons': {
        setDisabled: jest.fn(),
        setLoadingState: jest.fn(),
      },
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
        // Handle complex CSS selectors used by form-state-manager
        if (selector.includes('input:not(') || selector.includes('select:not(') || selector.includes('textarea:not(')) {
          // Return a subset of main form elements (excluding component-managed elements)
          return [mockElements['comments']]; // Only return textarea as it's typically a main component field
        }
        return [];
      }),
    };
  }

  describe('setFormDisabledState', () => {
    it('should disable all form elements when isDisabled is true', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      setFormDisabledState(mockShadowRoot, true);

      // Verify component methods are called
      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');
      const buttonGroup = mockShadowRoot.getElementById('form-buttons');
      const imageHandler = mockShadowRoot.getElementById('recipe-images');
      
      expect(metadataComponent.setDisabled).toHaveBeenCalledWith(true);
      expect(ingredientsComponent.setDisabled).toHaveBeenCalledWith(true);
      expect(buttonGroup.setDisabled).toHaveBeenCalledWith(true);
      expect(imageHandler.setDisabled).toHaveBeenCalledWith(true);

      // Verify main component elements are disabled (using complex selector)
      const mainElements = mockShadowRoot.querySelectorAll('input:not(recipe-metadata-fields input):not(recipe-ingredients-list input), select:not(recipe-metadata-fields select):not(recipe-ingredients-list select), textarea:not(recipe-metadata-fields textarea):not(recipe-ingredients-list textarea)');
      mainElements.forEach(element => {
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

      // Verify component methods are called
      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');
      
      expect(metadataComponent.clearFields).toHaveBeenCalled();
      expect(ingredientsComponent.clear).toHaveBeenCalled();

      // Verify main component fields are cleared (using complex selector)
      const mainElements = mockShadowRoot.querySelectorAll('input:not(recipe-metadata-fields input):not(recipe-ingredients-list input), select:not(recipe-metadata-fields select):not(recipe-ingredients-list select), textarea:not(recipe-metadata-fields textarea):not(recipe-ingredients-list textarea)');
      mainElements.forEach(element => {
        if (element.tagName === 'TEXTAREA') {
          expect(element.value).toBe('');
        }
        expect(element.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });

    it('should reset all select fields', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      // Verify component methods handle their own fields
      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      expect(metadataComponent.clearFields).toHaveBeenCalled();

      // Main component select fields (if any) would be reset
      const mainElements = mockShadowRoot.querySelectorAll('select:not(recipe-metadata-fields select):not(recipe-ingredients-list select)');
      mainElements.forEach(select => {
        expect(select.selectedIndex).toBe(0);
        expect(select.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });

    it('should clear all textarea fields', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      // Verify main component textarea fields are cleared
      const mainElements = mockShadowRoot.querySelectorAll('textarea:not(recipe-metadata-fields textarea):not(recipe-ingredients-list textarea)');
      mainElements.forEach(textarea => {
        expect(textarea.value).toBe('');
        expect(textarea.classList.remove).toHaveBeenCalledWith('recipe-form__input--invalid');
      });
    });

    it('should reset ingredients to initial state', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      clearForm(mockShadowRoot);

      // Verify ingredients component clear method is called
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');
      expect(ingredientsComponent.clear).toHaveBeenCalled();
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

      // Verify form is disabled through component methods
      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');
      const buttonGroup = mockShadowRoot.getElementById('form-buttons');
      const imageHandler = mockShadowRoot.getElementById('recipe-images');
      
      expect(metadataComponent.setDisabled).toHaveBeenCalledWith(true);
      expect(ingredientsComponent.setDisabled).toHaveBeenCalledWith(true);
      expect(buttonGroup.setDisabled).toHaveBeenCalledWith(true);
      expect(imageHandler.setDisabled).toHaveBeenCalledWith(true);

      // Verify loading state is set on button group
      expect(buttonGroup.setLoadingState).toHaveBeenCalledWith(true, 'שולח...');
    });

    it('should enable form and reset submit button when not loading', () => {
      const mockShadowRoot = createMockShadowRoot();
      
      setFormLoadingState(mockShadowRoot, false);

      // Verify form is enabled through component methods
      const metadataComponent = mockShadowRoot.getElementById('metadata-fields');
      const ingredientsComponent = mockShadowRoot.getElementById('ingredients-list');
      const buttonGroup = mockShadowRoot.getElementById('form-buttons');
      const imageHandler = mockShadowRoot.getElementById('recipe-images');
      
      expect(metadataComponent.setDisabled).toHaveBeenCalledWith(false);
      expect(ingredientsComponent.setDisabled).toHaveBeenCalledWith(false);
      expect(buttonGroup.setDisabled).toHaveBeenCalledWith(false);
      expect(imageHandler.setDisabled).toHaveBeenCalledWith(false);

      // Verify loading state is cleared on button group
      expect(buttonGroup.setLoadingState).toHaveBeenCalledWith(false, 'שולח...');
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