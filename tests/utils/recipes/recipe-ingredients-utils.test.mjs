import { jest } from '@jest/globals';

let scaleIngredients,
  formatIngredientAmount,
  extractIngredientNames,
  validateIngredient,
  createEmptyIngredient;

describe('recipe-ingredients-utils', () => {
  beforeEach(async () => {
    jest.resetModules();
    const utils = await import('../../../src/js/utils/recipes/recipe-ingredients-utils.js');
    scaleIngredients = utils.scaleIngredients;
    formatIngredientAmount = utils.formatIngredientAmount;
    extractIngredientNames = utils.extractIngredientNames;
    validateIngredient = utils.validateIngredient;
    createEmptyIngredient = utils.createEmptyIngredient;
  });

  describe('scaleIngredients', () => {
    it('scales ingredient amounts correctly', () => {
      // Arrange
      const ingredients = [
        { amount: '2', unit: 'cup', item: 'flour' },
        { amount: '1.5', unit: 'tbsp', item: 'sugar' },
      ];
      // Act
      const scaled = scaleIngredients(ingredients, 2, 4);
      // Assert
      expect(scaled[0].amount).toBe('4');
      expect(scaled[1].amount).toBe('3');
    });
    it('returns original if originalServings is 0 or invalid', () => {
      const ingredients = [{ amount: '2', unit: 'cup', item: 'flour' }];
      expect(scaleIngredients(ingredients, 0, 4)).toBe(ingredients);
      expect(scaleIngredients(ingredients, null, 4)).toBe(ingredients);
    });
    it('handles non-numeric amounts gracefully', () => {
      const ingredients = [{ amount: 'to taste', unit: '', item: 'salt' }];
      const scaled = scaleIngredients(ingredients, 2, 4);
      expect(scaled[0].amount).toBe('to taste');
    });
  });

  describe('formatIngredientAmount', () => {
    it('formats integer and float values', () => {
      expect(formatIngredientAmount(2)).toBe('2');
      expect(formatIngredientAmount(2.5)).toBe('2.5');
      expect(formatIngredientAmount('2.00')).toBe('2');
      expect(formatIngredientAmount('2.50')).toBe('2.5');
      expect(formatIngredientAmount('2.55')).toBe('2.55');
      expect(formatIngredientAmount('2.555')).toBe('2.56');
    });
    it('returns original string for non-numeric', () => {
      expect(formatIngredientAmount('to taste')).toBe('to taste');
      expect(formatIngredientAmount(undefined)).toBe('');
    });
  });

  describe('extractIngredientNames', () => {
    it('extracts names from ingredient array', () => {
      const ingredients = [
        { amount: '1', unit: 'cup', item: 'flour' },
        { amount: '2', unit: 'tbsp', item: 'sugar' },
      ];
      expect(extractIngredientNames(ingredients)).toEqual(['flour', 'sugar']);
    });
    it('returns empty array for invalid input', () => {
      expect(extractIngredientNames(null)).toEqual([]);
      expect(extractIngredientNames(undefined)).toEqual([]);
    });
    it('filters out empty names', () => {
      const ingredients = [
        { amount: '1', unit: 'cup', item: '' },
        { amount: '2', unit: 'tbsp', item: 'sugar' },
      ];
      expect(extractIngredientNames(ingredients)).toEqual(['sugar']);
    });
  });

  describe('validateIngredient', () => {
    it('returns true for valid ingredient', () => {
      const ing = { amount: '1', unit: 'cup', item: 'flour' };
      expect(validateIngredient(ing)).toBe(true);
    });
    it('returns false for missing or empty fields', () => {
      expect(validateIngredient({ amount: '', unit: 'cup', item: 'flour' })).toBe(false);
      expect(validateIngredient({ amount: '1', unit: '', item: 'flour' })).toBe(false);
      expect(validateIngredient({ amount: '1', unit: 'cup', item: '' })).toBe(false);
      expect(validateIngredient({})).toBe(false);
      expect(validateIngredient(null)).toBe(false);
    });
  });

  describe('createEmptyIngredient', () => {
    it('returns an ingredient with empty fields', () => {
      const ing = createEmptyIngredient();
      expect(ing).toEqual({ amount: '', unit: '', item: '' });
    });
  });
});
