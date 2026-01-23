// Mock recipe data for visual tests
export const MOCK_RECIPES = Array.from({ length: 6 }, (_, i) => ({
  id: `recipe-${i + 1}`,
  name: `Test Recipe ${i + 1}`,
  category: 'main-courses',
  prepTime: 20 + i,
  waitTime: 15,
  difficulty: 'medium',
  images: [{ id: 'img1', isPrimary: true }],
}));

export const PAGINATION_MOCK_RECIPES = Array.from({ length: 12 }, (_, i) => ({
  id: `recipe-${i + 1}`,
  name: `Recipe ${i + 1}`,
  category: 'dessert',
  images: [],
}));
