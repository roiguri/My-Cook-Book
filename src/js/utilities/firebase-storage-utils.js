/**
 * Firebase Storage Utilities
 *
 * A collection of utility functions for handling Firebase Storage operations,
 * particularly focusing on image management for recipes.
 */

import { getStorageInstance, getFirestoreInstance } from '../services/firebase-service.js';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * Deletes all images associated with a recipe from Firebase Storage
 * @param {string} recipeId - The ID of the recipe
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
async function deleteRecipeImages(recipeId) {
  try {
    // Get recipe data first
    const db = getFirestoreInstance();
    const recipeDocRef = doc(db, 'recipes', recipeId);
    const recipeDocSnap = await getDoc(recipeDocRef);
    if (!recipeDocSnap.exists()) {
      console.warn('Recipe not found for deletion:', recipeId);
      return;
    }

    const recipeData = recipeDocSnap.data();
    const storage = getStorageInstance();
    const deletePromises = [];

    // Handle approved images array
    if (recipeData.images && Array.isArray(recipeData.images)) {
      recipeData.images.forEach((image) => {
        if (image.full) {
          deletePromises.push(
            deleteObject(ref(storage, image.full)).catch((err) =>
              console.warn(`Error deleting full image ${image.id}:`, err),
            ),
          );
        }

        if (image.compressed) {
          deletePromises.push(
            deleteObject(ref(storage, image.compressed)).catch((err) =>
              console.warn(`Error deleting compressed image ${image.id}:`, err),
            ),
          );
        }
      });
    }

    // Handle pending images if they exist
    if (recipeData.pendingImages && Array.isArray(recipeData.pendingImages)) {
      recipeData.pendingImages.forEach((pendingBatch) => {
        if (pendingBatch.images && Array.isArray(pendingBatch.images)) {
          pendingBatch.images.forEach((image) => {
            if (image.full) {
              deletePromises.push(
                deleteObject(ref(storage, image.full)).catch((err) =>
                  console.warn(`Error deleting pending full image ${image.id}:`, err),
                ),
              );
            }
            if (image.compressed) {
              deletePromises.push(
                deleteObject(ref(storage, image.compressed)).catch((err) =>
                  console.warn(`Error deleting pending compressed image ${image.id}:`, err),
                ),
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

/**
 * Uploads a batch of proposed images for a recipe
 * @param {string} recipeId - The ID of the recipe
 * @param {Array} images - Array of image data from ImageHandler
 * @param {string} userId - The ID of the user proposing the images
 * @returns {Promise<Object>} The pending images data to be stored in Firestore
 */
async function uploadProposedImages(recipeId, images, userId) {
  const storage = getStorageInstance();
  const db = getFirestoreInstance();
  const batchId = Math.random().toString(36).substring(2);
  const pendingBatch = {
    batchId,
    submittedBy: userId,
    status: 'pending',
    images: [],
  };

  try {
    // Get recipe data for category
    const recipeDocRef = doc(db, 'recipes', recipeId);
    const recipeDocSnap = await getDoc(recipeDocRef);
    if (!recipeDocSnap.exists()) throw new Error('Recipe not found');
    const recipeData = recipeDocSnap.data();
    const pendingImages = recipeData.pendingImages || [];

    // Upload each image
    for (const image of images) {
      const imageId = Math.random().toString(36).substring(2);
      const fileExtension = image.file.name.split('.').pop();
      // Define paths
      const fullPath = `img/recipes/pending/${recipeId}/${batchId}/full/${imageId}.${fileExtension}`;
      const compressedPath = `img/recipes/pending/${recipeId}/${batchId}/compressed/${imageId}.${fileExtension}`;
      // Upload full size
      await uploadBytes(ref(storage, fullPath), image.file);
      // For now, use the same file for compressed version
      // TODO: Implement actual image compression
      await uploadBytes(ref(storage, compressedPath), image.file);
      // Add image data to batch
      pendingBatch.images.push({
        id: imageId,
        full: fullPath,
        compressed: compressedPath,
        isPrimary: image.isPrimary,
        fileExtension,
      });
    }
    // Add timestamp just before the update
    pendingBatch.timestamp = Timestamp.now();
    // Update Firestore with the new array
    const updatedPendingImages = [...pendingImages, pendingBatch];
    await updateDoc(recipeDocRef, { pendingImages: updatedPendingImages });
    return pendingBatch;
  } catch (error) {
    console.error('Error uploading proposed images:', error);
    throw error;
  }
}

export { uploadProposedImages, deleteRecipeImages };
