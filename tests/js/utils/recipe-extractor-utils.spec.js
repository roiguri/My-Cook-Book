import { mapExtractedDataToForm } from '../../../src/js/utils/recipe-extractor-utils.js';

describe('Recipe Extractor Utils', () => {
  describe('mapExtractedDataToForm', () => {
    it('should map valid full data correctly', () => {
      const input = {
        name: 'Test Recipe',
        category: 'Dessert',
        prepTime: 10,
        waitTime: 20,
        servings: 4,
        difficulty: 'Easy',
        description: 'A yummy test',
        ingredients: [
          { item: 'Flour', amount: '2', unit: 'cups' },
          { item: 'Sugar', amount: '1', unit: 'tbsp' },
        ],
        instructions: ['Mix', 'Bake'],
        comments: ['Enjoy'],
        tags: ['sweet'],
      };

      const result = mapExtractedDataToForm(input);

      expect(result.name).toBe('Test Recipe');
      expect(result.category).toBe('Dessert');
      expect(result.prepTime).toBe(10);
      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0]).toEqual({ item: 'Flour', amount: '2', unit: 'cups' });
      expect(result.instructions).toEqual(['Mix', 'Bake']);
      expect(result.comments).toEqual(['Enjoy']);
      expect(result.tags).toEqual(['sweet']);
    });

    it('should handle missing optional fields gracefully', () => {
      const input = {
        name: 'Minimal Recipe',
        ingredients: [],
        instructions: [],
      };

      const result = mapExtractedDataToForm(input);

      expect(result.name).toBe('Minimal Recipe');
      expect(result.category).toBe('');
      expect(result.prepTime).toBe(0);
      expect(result.difficulty).toBe('Medium'); // Default
      expect(result.ingredients).toEqual([]);
    });

    it('should handle null input', () => {
      const result = mapExtractedDataToForm(null);
      expect(result).toEqual({});
    });

    it('should map partial ingredients correctly', () => {
      const input = {
        name: 'Partial',
        ingredients: [
          { item: 'Salt' }, // Missing amount/unit
        ],
      };

      const result = mapExtractedDataToForm(input);
      expect(result.ingredients[0]).toEqual({ item: 'Salt', amount: '', unit: '' });
    });
  });
});
