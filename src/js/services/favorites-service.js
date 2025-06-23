/**
 * Favorites Service
 * -----------------
 * Centralized service for managing user favorites with caching
 */

import authService from './auth-service.js';
import { FirestoreService } from './firestore-service.js';

class FavoritesService {
  constructor() {
    this.cache = {
      userId: null,
      favorites: [],
      isLoaded: false,
    };
  }

  /**
   * Get user's favorite recipe IDs
   * @returns {Promise<Array<string>>} Array of favorite recipe IDs
   */
  async getUserFavorites() {
    const user = authService.getCurrentUser();
    if (!user) {
      return [];
    }

    if (this.cache.userId === user.uid && this.cache.isLoaded) {
      return this.cache.favorites;
    }

    try {
      const userDoc = await FirestoreService.getDocument('users', user.uid);
      const favoriteRecipeIds = userDoc?.favorites || [];

      this.cache = {
        userId: user.uid,
        favorites: favoriteRecipeIds,
        isLoaded: true,
      };

      return favoriteRecipeIds;
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  }

  /**
   * Clear the favorites cache
   */
  clearCache() {
    this.cache = {
      userId: null,
      favorites: [],
      isLoaded: false,
    };
  }

  /**
   * Update the local cache when favorites change
   * @param {string} recipeId - Recipe ID to update
   * @param {boolean} isAdding - Whether adding or removing from favorites
   */
  updateCache(recipeId, isAdding) {
    const user = authService.getCurrentUser();
    
    // Skip cache update if no user or user doesn't match cached user
    if (!user || this.cache.userId !== user.uid) {
      return;
    }
    
    if (this.cache.isLoaded) {
      if (isAdding) {
        if (!this.cache.favorites.includes(recipeId)) {
          this.cache.favorites.push(recipeId);
        }
      } else {
        this.cache.favorites = this.cache.favorites.filter((id) => id !== recipeId);
      }
    }
  }

  /**
   * Check if a recipe is in user's favorites
   * @param {string} recipeId - Recipe ID to check
   * @returns {Promise<boolean>} Whether the recipe is favorited
   */
  async isFavorite(recipeId) {
    if (!recipeId || (typeof recipeId !== 'string' && typeof recipeId !== 'number')) {
      console.warn('isFavorite: Invalid recipeId provided:', recipeId);
      return false;
    }
    
    const favorites = await this.getUserFavorites();
    return favorites.includes(recipeId);
  }

  /**
   * Get the cache status for debugging
   * @returns {Object} Current cache state
   */
  getCacheStatus() {
    return { ...this.cache };
  }
}

// Export singleton instance
export default new FavoritesService();
