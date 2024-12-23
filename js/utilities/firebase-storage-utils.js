/**
 * Firebase Storage Utilities
 * 
 * A collection of utility functions for handling Firebase Storage operations,
 * particularly focusing on image management for recipes.
 */

/**
 * Deletes all images associated with a recipe from Firebase Storage
 * @param {string} recipeId - The ID of the recipe
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
async function deleteRecipeImages(recipeId) {
  try {
      // Get recipe data first
      const recipeDoc = await firebase.firestore().collection('recipes').doc(recipeId).get();
      if (!recipeDoc.exists) {
          console.warn('Recipe not found for deletion:', recipeId);
          return;
      }

      const recipeData = recipeDoc.data();
      const storage = firebase.storage();
      const deletePromises = [];

      // Handle approved images array
      if (recipeData.images && Array.isArray(recipeData.images)) {
          recipeData.images.forEach(image => {
              if (image.full) {
                  deletePromises.push(
                      storage.ref(image.full).delete()
                          .catch(err => console.warn(`Error deleting full image ${image.id}:`, err))
                  );
              }
              
              if (image.compressed) {
                  deletePromises.push(
                      storage.ref(image.compressed).delete()
                          .catch(err => console.warn(`Error deleting compressed image ${image.id}:`, err))
                  );
              }
          });
      }

      // Handle pending images if they exist
      if (recipeData.pendingImages && Array.isArray(recipeData.pendingImages)) {
          recipeData.pendingImages.forEach(pendingBatch => {
              if (pendingBatch.images && Array.isArray(pendingBatch.images)) {
                  pendingBatch.images.forEach(image => {
                      if (image.full) {
                          deletePromises.push(
                              storage.ref(image.full).delete()
                                  .catch(err => console.warn(`Error deleting pending full image ${image.id}:`, err))
                          );
                      }
                      if (image.compressed) {
                          deletePromises.push(
                              storage.ref(image.compressed).delete()
                                  .catch(err => console.warn(`Error deleting pending compressed image ${image.id}:`, err))
                          );
                      }
                  });
              }
          });
      }

      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      console.log('Successfully deleted all images for recipe:', recipeId);

  } catch (error) {
      console.error('Error in deleteRecipeImages:', error);
      throw new Error(`Failed to delete recipe images: ${error.message}`);
  }
}