import {
  calculateTotalTime,
  formatCookingTime,
  getTimeClass,
  getDifficultyClass,
  getLocalizedCategoryName,
  getCategoryIcon,
} from '../../../src/js/utils/recipes/recipe-data-utils.js';

describe('recipe-data-utils', () => {
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
}); 