import { jest } from '@jest/globals';

// Inline FirestoreService mock for this test file
export const mockQueryDocuments = jest.fn();
export const mockGetDocument = jest.fn();
jest.unstable_mockModule('../../../src/js/services/firestore-service.js', () => ({
  FirestoreService: {
    queryDocuments: mockQueryDocuments,
    getDocument: mockGetDocument,
  },
}));

let calculateTotalTime, formatCookingTime, getTimeClass, getDifficultyClass, getLocalizedCategoryName, getCategoryIcon, formatRecipeData, validateRecipeData, getRecipesForCards, getRecipeById;

describe('recipe-data-utils', () => {
  beforeEach(async () => {
    jest.resetModules();
    const utils = await import('../../../src/js/utils/recipes/recipe-data-utils.js');
    calculateTotalTime = utils.calculateTotalTime;
    formatCookingTime = utils.formatCookingTime;
    getTimeClass = utils.getTimeClass;
    getDifficultyClass = utils.getDifficultyClass;
    getLocalizedCategoryName = utils.getLocalizedCategoryName;
    getCategoryIcon = utils.getCategoryIcon;
    formatRecipeData = utils.formatRecipeData;
    validateRecipeData = utils.validateRecipeData;
    getRecipesForCards = utils.getRecipesForCards;
    getRecipeById = utils.getRecipeById;
    mockQueryDocuments.mockReset();
    mockGetDocument.mockReset();
  });

  describe('calculateTotalTime', () => {
    it('returns the sum of prepTime and waitTime', () => {
      expect(calculateTotalTime(10, 20)).toBe(30);
      expect(calculateTotalTime(0, 0)).toBe(0);
      expect(calculateTotalTime(15, 0)).toBe(15);
      expect(calculateTotalTime(undefined, 10)).toBe(10);
      expect(calculateTotalTime(5, undefined)).toBe(5);
    });
  });

  describe('formatCookingTime', () => {
    it('formats times under 60 minutes', () => {
      expect(formatCookingTime(25)).toBe('25 דקות');
      expect(formatCookingTime(60)).toBe('60 דקות');
    });
    it('formats times between 61 and 119 minutes', () => {
      expect(formatCookingTime(75)).toBe('שעה ו-15 דקות');
      expect(formatCookingTime(119)).toBe('שעה ו-59 דקות');
    });
    it('formats exactly 120 minutes', () => {
      expect(formatCookingTime(120)).toBe('שעתיים');
    });
    it('formats times between 121 and 179 minutes', () => {
      expect(formatCookingTime(135)).toBe('שעתיים ו-15 דקות');
    });
    it('formats times that are whole hours', () => {
      expect(formatCookingTime(180)).toBe('3 שעות');
      expect(formatCookingTime(240)).toBe('4 שעות');
    });
    it('formats times that are hours and minutes', () => {
      expect(formatCookingTime(185)).toBe('3 שעות ו-5 דקות');
    });
  });

  describe('getTimeClass', () => {
    it('returns quick for <= 30', () => {
      expect(getTimeClass(10)).toBe('quick');
      expect(getTimeClass(30)).toBe('quick');
    });
    it('returns medium for 31-60', () => {
      expect(getTimeClass(31)).toBe('medium');
      expect(getTimeClass(60)).toBe('medium');
    });
    it('returns long for > 60', () => {
      expect(getTimeClass(61)).toBe('long');
      expect(getTimeClass(120)).toBe('long');
    });
  });

  describe('getDifficultyClass', () => {
    it('returns correct class for Hebrew difficulty', () => {
      expect(getDifficultyClass('קלה')).toBe('easy');
      expect(getDifficultyClass('בינונית')).toBe('medium');
      expect(getDifficultyClass('קשה')).toBe('hard');
    });
    it('returns medium for unknown difficulty', () => {
      expect(getDifficultyClass('unknown')).toBe('medium');
    });
  });

  describe('getLocalizedCategoryName', () => {
    it('returns Hebrew name for known category', () => {
      expect(getLocalizedCategoryName('appetizers')).toBe('מנות ראשונות');
      expect(getLocalizedCategoryName('desserts')).toBe('קינוחים');
    });
    it('returns input for unknown category', () => {
      expect(getLocalizedCategoryName('unknown')).toBe('unknown');
    });
  });

  describe('getCategoryIcon', () => {
    it('returns icon for known category', () => {
      expect(getCategoryIcon('appetizers')).toBe('🥗');
      expect(getCategoryIcon('desserts')).toBe('🍰');
    });
    it('returns default icon for unknown category', () => {
      expect(getCategoryIcon('unknown')).toBe('🍽️');
    });
  });

  describe('formatRecipeData', () => {
    it('returns null for non-object input', () => {
      expect(formatRecipeData(null)).toBeNull();
      expect(formatRecipeData(undefined)).toBeNull();
      expect(formatRecipeData(123)).toBeNull();
    });

    it('normalizes a complete recipe object', () => {
      const raw = {
        id: 'abc',
        name: 'Cake',
        category: 'desserts',
        prepTime: 10,
        waitTime: 20,
        difficulty: 'קלה',
        mainIngredient: 'flour',
        tags: ['sweet'],
        servings: 8,
        ingredients: [{ amount: '1', unit: 'cup', item: 'flour' }],
        stages: [{ title: 'Mix', instructions: ['Do this'] }],
        instructions: ['Step 1'],
        images: [{ file: 'cake.jpg', isPrimary: true, access: 'public', uploadedBy: 'user1' }],
        comments: ['Yum!'],
        approved: true,
        createdAt: 1234567890,
        updatedAt: 1234567891,
      };
      const formatted = formatRecipeData(raw);
      expect(formatted).toEqual(raw);
    });

    it('fills in defaults for missing fields', () => {
      const raw = { name: 'Bread' };
      const formatted = formatRecipeData(raw);
      expect(formatted).toEqual({
        id: '',
        name: 'Bread',
        category: '',
        prepTime: 0,
        waitTime: 0,
        difficulty: '',
        mainIngredient: '',
        tags: [],
        servings: 1,
        ingredients: [],
        stages: undefined,
        instructions: undefined,
        images: [],
        comments: [],
        approved: false,
        createdAt: null,
        updatedAt: null,
      });
    });

    it('handles arrays and booleans correctly', () => {
      const raw = {
        tags: 'not-an-array',
        ingredients: undefined,
        images: null,
        comments: 0,
        approved: 'yes',
      };
      const formatted = formatRecipeData(raw);
      expect(formatted.tags).toEqual([]);
      expect(formatted.ingredients).toEqual([]);
      expect(formatted.images).toEqual([]);
      expect(formatted.comments).toEqual([]);
      expect(formatted.approved).toBe(false);
    });
  });

  describe('validateRecipeData', () => {
    const baseRecipe = {
      name: 'Test',
      category: 'desserts',
      prepTime: 10,
      waitTime: 5,
      difficulty: 'קלה',
      mainIngredient: 'sugar',
      servings: 2,
      ingredients: [{ amount: '1', unit: 'cup', item: 'sugar' }],
      instructions: ['Mix'],
    };

    it('validates a correct recipe', () => {
      const result = validateRecipeData(baseRecipe);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('fails if name is missing', () => {
      const r = { ...baseRecipe, name: '' };
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('fails if category is invalid', () => {
      const r = { ...baseRecipe, category: 'invalid' };
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.category).toBeDefined();
    });

    it('fails if servings is not an integer >= 1', () => {
      expect(validateRecipeData({ ...baseRecipe, servings: 0 }).isValid).toBe(false);
      expect(validateRecipeData({ ...baseRecipe, servings: 1.5 }).isValid).toBe(false);
      expect(validateRecipeData({ ...baseRecipe, servings: '2' }).isValid).toBe(false);
    });

    it('fails if both instructions and stages exist', () => {
      const r = { ...baseRecipe, stages: [{ title: 'Stage', instructions: ['Do'] }] };
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.instructions).toBeDefined();
      expect(result.errors.stages).toBeDefined();
    });

    it('fails if neither instructions nor stages exist', () => {
      const r = { ...baseRecipe };
      delete r.instructions;
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.instructions).toBeDefined();
      expect(result.errors.stages).toBeDefined();
    });

    it('fails if ingredients are missing or invalid', () => {
      expect(validateRecipeData({ ...baseRecipe, ingredients: [] }).isValid).toBe(false);
      expect(validateRecipeData({ ...baseRecipe, ingredients: undefined }).isValid).toBe(false);
      const r = { ...baseRecipe, ingredients: [{ amount: '', unit: '', item: '' }] };
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors['ingredients[0].amount']).toBeDefined();
      expect(result.errors['ingredients[0].unit']).toBeDefined();
      expect(result.errors['ingredients[0].item']).toBeDefined();
    });

    it('validates a recipe with stages and no instructions', () => {
      const r = { ...baseRecipe };
      delete r.instructions;
      r.stages = [{ title: 'Stage 1', instructions: ['Do this'] }];
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(true);
    });

    it('fails if a stage is missing title or instructions', () => {
      const r = { ...baseRecipe };
      delete r.instructions;
      r.stages = [{ title: '', instructions: [] }];
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors['stages[0].title']).toBeDefined();
      expect(result.errors['stages[0].instructions']).toBeDefined();
    });

    it('fails if a stage instruction is empty', () => {
      const r = { ...baseRecipe };
      delete r.instructions;
      r.stages = [{ title: 'Stage', instructions: [''] }];
      const result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors['stages[0].instructions[0]']).toBeDefined();
    });

    it('validates optional fields types (tags, images, comments, approved, createdAt, updatedAt)', () => {
      // Valid types
      let r = { ...baseRecipe, tags: ['a', 'b'], images: [{}], comments: ['c'], approved: true, createdAt: 123, updatedAt: new Date() };
      let result = validateRecipeData(r);
      expect(result.isValid).toBe(true);
      // Invalid tags
      r = { ...baseRecipe, tags: [1, 2] };
      result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.tags).toBeDefined();
      // Invalid images
      r = { ...baseRecipe, images: [1, 2] };
      result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.images).toBeDefined();
      // Invalid comments
      r = { ...baseRecipe, comments: [1, 2] };
      result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.comments).toBeDefined();
      // Invalid approved
      r = { ...baseRecipe, approved: 'yes' };
      result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.approved).toBeDefined();
      // Invalid createdAt
      r = { ...baseRecipe, createdAt: {} };
      result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.createdAt).toBeDefined();
      // Invalid updatedAt
      r = { ...baseRecipe, updatedAt: [] };
      result = validateRecipeData(r);
      expect(result.isValid).toBe(false);
      expect(result.errors.updatedAt).toBeDefined();
    });
  });

  describe('getRecipesForCards', () => {
    it('fetches and normalizes recipes with options', async () => {
      // Arrange
      const mockDocs = [
        { id: '1', name: 'A', category: 'desserts', prepTime: 1, waitTime: 2, difficulty: 'קלה', mainIngredient: 'sugar', servings: 1, ingredients: [{ amount: '1', unit: 'cup', item: 'sugar' }], instructions: ['Mix'] },
        { id: '2', name: 'B', category: 'appetizers', prepTime: 2, waitTime: 3, difficulty: 'קשה', mainIngredient: 'salt', servings: 2, ingredients: [{ amount: '2', unit: 'tbsp', item: 'salt' }], instructions: ['Stir'] },
      ];
      mockQueryDocuments.mockResolvedValue(mockDocs);
      // Act
      const result = await getRecipesForCards({ category: 'desserts', approvedOnly: true, limit: 1 });
      // Assert
      expect(mockQueryDocuments).toHaveBeenCalledWith('recipes', expect.objectContaining({ where: expect.any(Array), limit: 1 }));
      expect(result[0].name).toBe('A');
      expect(result[0].category).toBe('desserts');
    });

    it('returns empty array if no docs', async () => {
      // Arrange
      mockQueryDocuments.mockResolvedValue([]);
      // Act
      const result = await getRecipesForCards({});
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getRecipeById', () => {
    it('fetches and normalizes a recipe by id', async () => {
      // Arrange
      const mockDoc = { id: '1', name: 'A', category: 'desserts', prepTime: 1, waitTime: 2, difficulty: 'קלה', mainIngredient: 'sugar', servings: 1, ingredients: [{ amount: '1', unit: 'cup', item: 'sugar' }], instructions: ['Mix'] };
      mockGetDocument.mockResolvedValue(mockDoc);
      // Act
      const result = await getRecipeById('1');
      // Assert
      expect(mockGetDocument).toHaveBeenCalledWith('recipes', '1');
      expect(result.name).toBe('A');
      expect(result.category).toBe('desserts');
    });

    it('returns null if recipe not found', async () => {
      // Arrange
      mockGetDocument.mockResolvedValue(null);
      // Act
      const result = await getRecipeById('notfound');
      // Assert
      expect(result).toBeNull();
    });
  });
}); 