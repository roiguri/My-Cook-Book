import { jest } from '@jest/globals';

// Define mocks before imports
const mockAuthService = {
  getCurrentUserRole: jest.fn(),
};

const mockRecipeDataUtils = {
  getRecipeById: jest.fn(),
  getLocalizedCategoryName: jest.fn(),
  formatCookingTime: jest.fn(),
};

const mockRecipeImageUtils = {
  getRecipeImages: jest.fn(),
  getImageUrl: jest.fn(),
  getPlaceholderImageUrl: jest.fn(),
};

const mockRecipeIngredientsUtils = {
  formatIngredientAmount: jest.fn(),
  scaleIngredients: jest.fn(),
};

const mockRecipeMediaUtils = {
  getMediaInstructionUrl: jest.fn(),
};

const mockAppConfig = {
    getPageTitle: jest.fn().mockImplementation(title => `My Cook Book | ${title}`)
}

// Mock modules
jest.unstable_mockModule('../../../../src/js/services/auth-service.js', () => ({
  default: mockAuthService,
}));
jest.unstable_mockModule('../../../../src/js/utils/recipes/recipe-data-utils.js', () => mockRecipeDataUtils);
jest.unstable_mockModule('../../../../src/js/utils/recipes/recipe-image-utils.js', () => mockRecipeImageUtils);
jest.unstable_mockModule('../../../../src/js/utils/recipes/recipe-ingredients-utils.js', () => mockRecipeIngredientsUtils);
jest.unstable_mockModule('../../../../src/js/utils/recipes/recipe-media-utils.js', () => mockRecipeMediaUtils);
jest.unstable_mockModule('../../../../src/js/config/app-config.js', () => ({
    AppConfig: mockAppConfig
}));

// Mock inner component which imports CSS
// We need to mock this because Jest doesn't handle CSS imports well in this setup
// and the ?inline query parameter might be causing issues too.
jest.unstable_mockModule('../../../../src/lib/recipes/recipe_component/parts/cook-mode-container.js', () => {
    return {};
});

// Mock other components to avoid deep tree rendering/issues
jest.unstable_mockModule('../../../../src/lib/utilities/image-carousel/image-carousel.js', () => ({}));
jest.unstable_mockModule('../../../../src/lib/utilities/media-scroller/media-scroller.js', () => ({}));
jest.unstable_mockModule('../../../../src/lib/utilities/fullscreen-media-viewer/fullscreen-media-viewer.js', () => ({}));


// We need to import the component to test it
// Note: We're testing the logic, but since it's a web component, we need a DOM environment.
// Jest is configured with jsdom, so `customElements` should be available.
await import('../../../../src/lib/recipes/recipe_component/recipe_component.js');

describe('RecipeComponent Logic', () => {
  let element;
  let mockRecipe;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock data
    mockRecipe = {
      id: 'recipe123',
      name: 'Test Recipe',
      prepTime: 30,
      waitTime: 0,
      difficulty: 'Easy',
      category: 'main',
      servings: 4,
      ingredients: [
        { amount: 1, unit: 'cup', item: 'flour' }
      ],
      instructions: ['Mix', 'Bake'],
      images: []
    };

    mockRecipeDataUtils.getRecipeById.mockResolvedValue(mockRecipe);
    mockRecipeDataUtils.formatCookingTime.mockReturnValue('30 mins');
    mockRecipeDataUtils.getLocalizedCategoryName.mockReturnValue('Main Course');
    mockRecipeIngredientsUtils.formatIngredientAmount.mockReturnValue('1');
    mockRecipeImageUtils.getRecipeImages.mockReturnValue([]);
    mockAuthService.getCurrentUserRole.mockResolvedValue('viewer');

    // Create element
    element = document.createElement('recipe-component');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  test('fetches and populates recipe data on connection', async () => {
    element.setAttribute('recipe-id', 'recipe123');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockRecipeDataUtils.getRecipeById).toHaveBeenCalledWith('recipe123');
    expect(mockRecipeDataUtils.formatCookingTime).toHaveBeenCalledWith(30);
    expect(mockRecipeDataUtils.getLocalizedCategoryName).toHaveBeenCalledWith('main');
  });

  test('updates page title when recipe loads', async () => {
     element.setAttribute('recipe-id', 'recipe123');
     await new Promise(resolve => setTimeout(resolve, 0));

     expect(mockAppConfig.getPageTitle).toHaveBeenCalledWith('Test Recipe');
     expect(document.title).toBe('My Cook Book | Test Recipe');
  });

  test('handles servings adjustment', async () => {
    mockRecipeIngredientsUtils.scaleIngredients.mockReturnValue([
        { amount: 2, unit: 'cup', item: 'flour' }
    ]);

    element.setAttribute('recipe-id', 'recipe123');
    await new Promise(resolve => setTimeout(resolve, 0));

    const input = element.shadowRoot.querySelector('#Recipe_component__servings');
    expect(input.value).toBe('4');

    // Change servings
    input.value = '8';
    input.dispatchEvent(new Event('change'));

    expect(mockRecipeIngredientsUtils.scaleIngredients).toHaveBeenCalledWith(
        mockRecipe.ingredients,
        4,
        8
    );
  });

  test('populates instructions correctly', async () => {
    element.setAttribute('recipe-id', 'recipe123');
    await new Promise(resolve => setTimeout(resolve, 0));

    const instructionsList = element.shadowRoot.getElementById('Recipe_component__instructions-list');
    const items = instructionsList.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe('Mix');
    expect(items[1].textContent).toBe('Bake');
  });

  test('handles active step navigation', async () => {
    element.setAttribute('recipe-id', 'recipe123');
    await new Promise(resolve => setTimeout(resolve, 0));

    const firstStep = element.shadowRoot.querySelector('li[data-step-index="0"]');

    // Test clicking a step
    firstStep.click();
    expect(firstStep.classList.contains('active-step')).toBe(true);

    // Test clicking again to toggle off
    firstStep.click();
    expect(firstStep.classList.contains('active-step')).toBe(false);
  });

  test('handles missing recipe gracefully', async () => {
    mockRecipeDataUtils.getRecipeById.mockResolvedValue(null);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    element.setAttribute('recipe-id', 'missing');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith('No such document!');
    consoleSpy.mockRestore();
  });
});
