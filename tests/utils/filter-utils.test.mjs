import { FilterUtils } from '../../src/js/utils/filter-utils.js';

describe('FilterUtils', () => {
  const mockRecipes = [
    {
      id: '1',
      name: 'Chicken Soup',
      mainIngredient: 'עוף',
      difficulty: 'קלה',
      prepTime: 15,
      waitTime: 30,
      tags: ['בריא', 'חלבי'],
    },
    {
      id: '2',
      name: 'Beef Steak',
      mainIngredient: 'בקר',
      difficulty: 'בינונית',
      prepTime: 10,
      waitTime: 20,
      tags: ['בשרי', 'מהיר'],
    },
    {
      id: '3',
      name: 'Fish Fillet',
      mainIngredient: 'דגים',
      difficulty: 'קשה',
      prepTime: 20,
      waitTime: 45,
      tags: ['בריא', 'חלבי'],
    },
    {
      id: '4',
      name: 'Vegetable Stir Fry',
      mainIngredient: 'ירקות',
      difficulty: 'קלה',
      prepTime: 5,
      waitTime: 10,
      tags: ['בריא', 'מהיר', 'צמחוני'],
    },
  ];

  describe('applyFilters', () => {
    test('should return all recipes when no filters applied', () => {
      const filters = FilterUtils.createEmptyFilters();
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(4);
      expect(result).toEqual(mockRecipes);
    });

    test('should filter by cooking time 0-30 minutes', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), cookingTime: '0-30' };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toContain('2'); // 30 minutes total
      expect(result.map((r) => r.id)).toContain('4'); // 15 minutes total
    });

    test('should filter by cooking time 31-60 minutes', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), cookingTime: '31-60' };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1'); // 45 minutes total
    });

    test('should filter by cooking time over 60 minutes', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), cookingTime: '61' };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3'); // 65 minutes total
    });

    test('should filter by difficulty', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), difficulty: 'קלה' };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.difficulty === 'קלה')).toBe(true);
    });

    test('should filter by main ingredient', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), mainIngredient: 'עוף' };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(1);
      expect(result[0].mainIngredient).toBe('עוף');
    });

    test('should filter by single tag', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), tags: ['בריא'] };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.tags.includes('בריא'))).toBe(true);
    });

    test('should filter by favorites only', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), favoritesOnly: true };
      const favoriteIds = ['1', '3']; // User likes chicken soup and fish fillet
      const result = FilterUtils.applyFilters(mockRecipes, filters, favoriteIds);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['1', '3']);
    });

    test('should return empty array when favorites filter is enabled but no favorites provided', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), favoritesOnly: true };
      const result = FilterUtils.applyFilters(mockRecipes, filters, []);
      expect(result).toHaveLength(0);
    });

    test('should return empty array when favorites filter is enabled but favorites is null/undefined', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), favoritesOnly: true };
      expect(FilterUtils.applyFilters(mockRecipes, filters, null)).toHaveLength(0);
      expect(FilterUtils.applyFilters(mockRecipes, filters, undefined)).toHaveLength(0);
    });

    test('should filter by multiple tags (all must be present)', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), tags: ['בריא', 'חלבי'] };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.tags.includes('בריא') && r.tags.includes('חלבי'))).toBe(true);
    });

    test('should apply multiple filters together', () => {
      const filters = {
        ...FilterUtils.createEmptyFilters(),
        difficulty: 'קלה',
        tags: ['בריא'],
      };
      const result = FilterUtils.applyFilters(mockRecipes, filters);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.difficulty === 'קלה' && r.tags.includes('בריא'))).toBe(true);
    });

    test('should apply favorites filter combined with other filters', () => {
      const filters = {
        ...FilterUtils.createEmptyFilters(),
        difficulty: 'קלה',
        favoritesOnly: true,
      };
      const favoriteIds = ['1', '4']; // User likes chicken soup and vegetable stir fry
      const result = FilterUtils.applyFilters(mockRecipes, filters, favoriteIds);
      expect(result).toHaveLength(2); // Both recipes match difficulty and are favorites
      expect(result.every((r) => r.difficulty === 'קלה')).toBe(true);
      expect(result.every((r) => favoriteIds.includes(r.id))).toBe(true);
    });

    test('should handle empty recipes array', () => {
      const filters = FilterUtils.createEmptyFilters();
      const result = FilterUtils.applyFilters([], filters);
      expect(result).toEqual([]);
    });

    test('should handle null/undefined recipes', () => {
      const filters = FilterUtils.createEmptyFilters();
      expect(FilterUtils.applyFilters(null, filters)).toEqual([]);
      expect(FilterUtils.applyFilters(undefined, filters)).toEqual([]);
    });

    test('should handle null/undefined filters', () => {
      const result = FilterUtils.applyFilters(mockRecipes, null);
      expect(result).toEqual(mockRecipes);
    });
  });

  describe('extractFilterOptions', () => {
    test('should extract main ingredients correctly', () => {
      const result = FilterUtils.extractFilterOptions(mockRecipes);
      expect(result.mainIngredients).toEqual(['בקר', 'דגים', 'ירקות', 'עוף']);
    });

    test('should extract tags correctly', () => {
      const result = FilterUtils.extractFilterOptions(mockRecipes);
      expect(result.tags).toEqual(['בריא', 'בשרי', 'חלבי', 'מהיר', 'צמחוני']);
    });

    test('should handle recipes with missing ingredients', () => {
      const recipesWithMissing = [
        { id: '1', mainIngredient: 'עוף', tags: ['בריא'] },
        { id: '2', tags: ['מהיר'] }, // No mainIngredient
        { id: '3', mainIngredient: '', tags: ['חלבי'] }, // Empty mainIngredient
        { id: '4', mainIngredient: '   ', tags: ['בשרי'] }, // Whitespace only
      ];
      const result = FilterUtils.extractFilterOptions(recipesWithMissing);
      expect(result.mainIngredients).toEqual(['עוף']);
    });

    test('should handle recipes with missing tags', () => {
      const recipesWithMissing = [
        { id: '1', mainIngredient: 'עוף', tags: ['בריא'] },
        { id: '2', mainIngredient: 'בקר' }, // No tags
        { id: '3', mainIngredient: 'דגים', tags: [] }, // Empty tags
      ];
      const result = FilterUtils.extractFilterOptions(recipesWithMissing);
      expect(result.tags).toEqual(['בריא']);
    });

    test('should handle empty recipes array', () => {
      const result = FilterUtils.extractFilterOptions([]);
      expect(result).toEqual({
        mainIngredients: [],
        tags: [],
      });
    });

    test('should handle null/undefined recipes', () => {
      expect(FilterUtils.extractFilterOptions(null)).toEqual({
        mainIngredients: [],
        tags: [],
      });
      expect(FilterUtils.extractFilterOptions(undefined)).toEqual({
        mainIngredients: [],
        tags: [],
      });
    });
  });

  describe('hasActiveFilters', () => {
    test('should return false for empty filters', () => {
      const filters = FilterUtils.createEmptyFilters();
      expect(FilterUtils.hasActiveFilters(filters)).toBe(false);
    });

    test('should return true for cookingTime filter', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), cookingTime: '0-30' };
      expect(FilterUtils.hasActiveFilters(filters)).toBe(true);
    });

    test('should return true for difficulty filter', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), difficulty: 'קלה' };
      expect(FilterUtils.hasActiveFilters(filters)).toBe(true);
    });

    test('should return true for mainIngredient filter', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), mainIngredient: 'עוף' };
      expect(FilterUtils.hasActiveFilters(filters)).toBe(true);
    });

    test('should return true for tags filter', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), tags: ['בריא'] };
      expect(FilterUtils.hasActiveFilters(filters)).toBe(true);
    });

    test('should return true for favoritesOnly filter', () => {
      const filters = { ...FilterUtils.createEmptyFilters(), favoritesOnly: true };
      expect(FilterUtils.hasActiveFilters(filters)).toBe(true);
    });

    test('should handle null/undefined filters', () => {
      expect(FilterUtils.hasActiveFilters(null)).toBe(false);
      expect(FilterUtils.hasActiveFilters(undefined)).toBe(false);
    });
  });

  describe('createEmptyFilters', () => {
    test('should create correct empty filter object', () => {
      const filters = FilterUtils.createEmptyFilters();
      expect(filters).toEqual({
        cookingTime: '',
        difficulty: '',
        mainIngredient: '',
        tags: [],
        favoritesOnly: false,
      });
    });
  });

  describe('validateFilters', () => {
    test('should return valid filters unchanged', () => {
      const validFilters = {
        cookingTime: '0-30',
        difficulty: 'קלה',
        mainIngredient: 'עוף',
        tags: ['בריא'],
        favoritesOnly: true,
      };
      const result = FilterUtils.validateFilters(validFilters);
      expect(result).toEqual(validFilters);
    });

    test('should fill missing properties with defaults', () => {
      const partialFilters = {
        cookingTime: '0-30',
        tags: ['בריא'],
      };
      const result = FilterUtils.validateFilters(partialFilters);
      expect(result).toEqual({
        cookingTime: '0-30',
        difficulty: '',
        mainIngredient: '',
        tags: ['בריא'],
        favoritesOnly: false,
      });
    });

    test('should handle invalid tags array', () => {
      const invalidFilters = {
        cookingTime: '0-30',
        tags: 'not-an-array',
      };
      const result = FilterUtils.validateFilters(invalidFilters);
      expect(result.tags).toEqual([]);
    });

    test('should handle null/undefined filters', () => {
      const defaults = FilterUtils.createEmptyFilters();
      expect(FilterUtils.validateFilters(null)).toEqual(defaults);
      expect(FilterUtils.validateFilters(undefined)).toEqual(defaults);
    });

    test('should handle non-object filters', () => {
      const defaults = FilterUtils.createEmptyFilters();
      expect(FilterUtils.validateFilters('string')).toEqual(defaults);
      expect(FilterUtils.validateFilters(123)).toEqual(defaults);
    });
  });
});
