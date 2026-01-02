// Base64 placeholder images (1x1 pixel solid colors)
const IMG_RED =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const IMG_GREEN =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const IMG_BLUE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const MOCK_RECIPES = [
  {
    id: 'mock-recipe-1',
    name: 'Classic Pancakes',
    description: 'Fluffy and delicious pancakes',
    category: 'breakfast-brunch',
    prepTime: 10,
    waitTime: 5,
    difficulty: 'Easy',
    images: [{ compressed: IMG_RED, isPrimary: true }],
    approved: true,
    creationTime: { seconds: 1700000003 },
  },
  {
    id: 'mock-recipe-2',
    name: 'Spaghetti Carbonara',
    description: 'Authentic Italian pasta dish',
    category: 'main-courses',
    prepTime: 15,
    waitTime: 0,
    difficulty: 'Medium',
    images: [{ compressed: IMG_GREEN, isPrimary: true }],
    approved: true,
    creationTime: { seconds: 1700000002 },
  },
  {
    id: 'mock-recipe-3',
    name: 'Vegetable Stir Fry',
    description: 'Healthy and quick veggie stir fry',
    category: 'main-courses',
    prepTime: 15,
    waitTime: 0,
    difficulty: 'Easy',
    images: [{ compressed: IMG_BLUE, isPrimary: true }],
    approved: true,
    creationTime: { seconds: 1700000001 },
  },
];

export class FirestoreService {
  static async queryDocuments(collectionName, queryParams = {}) {
    console.log('[Mock] FirestoreService.queryDocuments', collectionName);
    if (collectionName === 'recipes') {
      return [...MOCK_RECIPES];
    }
    return [];
  }

  static async getDocument(collectionName, id) {
    console.log('[Mock] FirestoreService.getDocument', collectionName, id);
    if (collectionName === 'recipes') {
      const recipe = MOCK_RECIPES.find((r) => r.id === id);
      return recipe ? { ...recipe } : null;
    }
    return null;
  }

  static async addDocument() {
    return 'mock-id';
  }
  static async updateDocument() {}
  static async deleteDocument() {}
  static async batchWrite() {}
}

export const getFirestoreInstance = () => ({});
export const firestoreService = FirestoreService;
