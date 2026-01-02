
import { jest } from '@jest/globals';

describe('FavoritesService', () => {
  let favoritesService;
  let authServiceMock;
  let firestoreServiceMock;
  let mockUser;

  beforeEach(async () => {
    jest.resetModules(); // Important to reset module registry to apply new mocks

    mockUser = { uid: 'user123' };

    // Create mock implementations
    authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(mockUser),
    };

    firestoreServiceMock = {
      getDocument: jest.fn(),
    };

    // Mock dependencies using unstable_mockModule (required for ESM)
    jest.unstable_mockModule('../../../src/js/services/auth-service.js', () => ({
      default: authServiceMock,
    }));

    jest.unstable_mockModule('../../../src/js/services/firestore-service.js', () => ({
      FirestoreService: firestoreServiceMock,
    }));

    // Dynamically import the service under test
    const module = await import('../../../src/js/services/favorites-service.js');
    favoritesService = module.default;

    // Reset cache manually if needed (though resetModules might handle the instance recreation, the class definition is re-evaluated)
    // Since we get a fresh instance from the re-evaluated module, cache should be empty.
  });

  describe('getUserFavorites', () => {
    test('should return empty array if no user is logged in', async () => {
      authServiceMock.getCurrentUser.mockReturnValue(null);

      const result = await favoritesService.getUserFavorites();

      expect(result).toEqual([]);
      expect(firestoreServiceMock.getDocument).not.toHaveBeenCalled();
    });

    test('should fetch favorites from Firestore if not cached', async () => {
      const mockFavorites = ['recipe1', 'recipe2'];
      firestoreServiceMock.getDocument.mockResolvedValue({ favorites: mockFavorites });

      const result = await favoritesService.getUserFavorites();

      expect(result).toEqual(mockFavorites);
      expect(firestoreServiceMock.getDocument).toHaveBeenCalledWith('users', mockUser.uid);
    });

    test('should return cached favorites if available and user matches', async () => {
      const mockFavorites = ['recipe1', 'recipe2'];
      firestoreServiceMock.getDocument.mockResolvedValue({ favorites: mockFavorites });

      // First call to populate cache
      await favoritesService.getUserFavorites();

      // Clear mock to ensure second call doesn't hit Firestore
      firestoreServiceMock.getDocument.mockClear();

      // Second call should use cache
      const result = await favoritesService.getUserFavorites();

      expect(result).toEqual(mockFavorites);
      expect(firestoreServiceMock.getDocument).not.toHaveBeenCalled();
    });

    test('should handle Firestore errors gracefully', async () => {
      firestoreServiceMock.getDocument.mockRejectedValue(new Error('Firestore error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await favoritesService.getUserFavorites();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should return empty array if user document has no favorites', async () => {
      firestoreServiceMock.getDocument.mockResolvedValue({});

      const result = await favoritesService.getUserFavorites();

      expect(result).toEqual([]);
    });
  });

  describe('updateCache', () => {
    test('should add recipe to cache when isAdding is true', async () => {
      // Setup initial cache
      firestoreServiceMock.getDocument.mockResolvedValue({ favorites: ['recipe1'] });
      await favoritesService.getUserFavorites();

      favoritesService.updateCache('recipe2', true);

      const result = await favoritesService.getUserFavorites();
      expect(result).toContain('recipe2');
      expect(result).toHaveLength(2);
    });

    test('should remove recipe from cache when isAdding is false', async () => {
      // Setup initial cache
      firestoreServiceMock.getDocument.mockResolvedValue({ favorites: ['recipe1', 'recipe2'] });
      await favoritesService.getUserFavorites();

      favoritesService.updateCache('recipe1', false);

      const result = await favoritesService.getUserFavorites();
      expect(result).not.toContain('recipe1');
      expect(result).toContain('recipe2');
      expect(result).toHaveLength(1);
    });

    test('should not update cache if user does not match', () => {
        // Manually set cache
        favoritesService.cache = {
            userId: 'user123',
            favorites: ['recipe1'],
            isLoaded: true
        };

        // Simulate different user
        authServiceMock.getCurrentUser.mockReturnValue({ uid: 'otherUser' });

        favoritesService.updateCache('recipe2', true);

        expect(favoritesService.cache.favorites).toEqual(['recipe1']);
    });

     test('should not update cache if user is null', () => {
        // Manually set cache
        favoritesService.cache = {
            userId: 'user123',
            favorites: ['recipe1'],
            isLoaded: true
        };

        // Simulate no user
        authServiceMock.getCurrentUser.mockReturnValue(null);

        favoritesService.updateCache('recipe2', true);

        expect(favoritesService.cache.favorites).toEqual(['recipe1']);
    });

    test('should not add duplicate recipe ID', async () => {
        // Setup initial cache
      firestoreServiceMock.getDocument.mockResolvedValue({ favorites: ['recipe1'] });
      await favoritesService.getUserFavorites();

      favoritesService.updateCache('recipe1', true);

      const result = await favoritesService.getUserFavorites();
      expect(result).toEqual(['recipe1']);
      expect(result).toHaveLength(1);
    });
  });

  describe('isFavorite', () => {
    test('should return true if recipe is in favorites', async () => {
      firestoreServiceMock.getDocument.mockResolvedValue({ favorites: ['recipe1'] });

      const result = await favoritesService.isFavorite('recipe1');

      expect(result).toBe(true);
    });

    test('should return false if recipe is not in favorites', async () => {
      firestoreServiceMock.getDocument.mockResolvedValue({ favorites: ['recipe1'] });

      const result = await favoritesService.isFavorite('recipe2');

      expect(result).toBe(false);
    });

    test('should handle invalid recipeId', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const result = await favoritesService.isFavorite(null);
        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
  });

  describe('getCacheStatus', () => {
      test('should return current cache state', () => {
          favoritesService.cache = {
            userId: 'testUser',
            favorites: ['1', '2'],
            isLoaded: true,
          };

          const status = favoritesService.getCacheStatus();
          expect(status).toEqual({
            userId: 'testUser',
            favorites: ['1', '2'],
            isLoaded: true,
          });
      });
  });
});
