/*
 * Recipe Image Utilities
 * ---------------------
 * This module provides helper functions for image upload, management, and retrieval for recipes.
 *
 * Exported Methods:
 *
 * Validation:
 *   - validateImageFile(file): Validate file type and size.
 *
 * Storage Path Helpers:
 *   - getImageStoragePath(recipeId, category, fileName, type): Get storage path for image.
 *   - generateImageId(): Generate a unique image ID.
 *
 * Image File Deletion:
 *   - deleteImageFiles(image): Delete all storage files for an image (full + WebP variants + legacy compressed).
 *
 * Multi Pending Images:
 *   - addPendingImages(recipeId, files, category, uploader): Upload multiple pending images.
 *   - approvePendingImageById(recipeId, pendingImageId): Approve a specific pending image by ID.
 *   - rejectPendingImageById(recipeId, pendingImageId): Reject/delete a specific pending image by ID.
 *   - getPendingImages(recipeId): Get all pending images for a recipe.
 *
 * Approved Images:
 *   - setPrimaryImage(recipeId, imageId): Set the primary image for a recipe.
 *   - getRecipeImages(recipe, userRole): Get accessible images for a user role.
 *   - getPrimaryImage(recipe): Get the primary image object.
 *   - getPrimaryImageUrl(recipe, size): Get the download URL for the primary image (optimized) or placeholder.
 *   - getImageUrl(storagePath): Get the download URL for a storage path.
 *   - getOptimizedImageUrl(image, size): Get the download URL for an optimized version of an image with fallback.
 *   - getPlaceholderImageUrl(): Get the placeholder image URL.
 *   - removeAllRecipeImages(recipeId): Remove all images (approved and pending) for a recipe.
 *   - migrateImageToCategory(image, recipeId, oldCategory, newCategory): Migrate image to new category path.
 *   - uploadAndBuildImageMetadata({ recipeId, category, file, isPrimary, uploadedBy }): Upload and return metadata for an image.
 */

/**
 * @typedef {Object} RecipeImage
 * @property {string} id
 * @property {string} full
 * @property {boolean} isPrimary
 * @property {string} access
 * @property {string} uploadedBy
 * @property {string} fileName
 * @property {Timestamp} uploadTimestamp
 */

/**
 * @typedef {Object} PendingRecipeImage
 * @property {string} id
 * @property {string} full
 * @property {string} fileExtension
 * @property {Timestamp} timestamp
 * @property {string} uploadedBy
 */

// --- Imports ---
import { StorageService } from '../../services/storage-service.js';
import { FirestoreService } from '../../services/firestore-service.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// --- Validation ---
export function validateImageFile(file) {
  const errors = [];
  if (!file) {
    errors.push('No file provided');
  } else {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push('Invalid file type');
    }
    if (file.size > MAX_SIZE) {
      errors.push('File is too large (max 5MB)');
    }
  }
  return { isValid: errors.length === 0, errors };
}

// --- Storage Path Helpers ---
export function getImageStoragePath(recipeId, category, fileName, type = 'full') {
  // type: 'full' | 'compressed'
  const base = `img/recipes/${type}/${category}/${recipeId}`;
  return `${base}/${fileName}`;
}

// --- Firestore Helpers ---
async function getRecipeDoc(recipeId) {
  return await FirestoreService.getDocument('recipes', recipeId);
}
async function updateRecipeDoc(recipeId, data) {
  return await FirestoreService.updateDocument('recipes', recipeId, data);
}

// --- Image ID Helper ---
/**
 * Generates a unique image ID with 'img-' prefix
 * @returns {string}
 */
export function generateImageId() {
  return 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// --- Image File Deletion ---
/**
 * Deletes all storage files for an image: full original, WebP variants, and optional legacy compressed.
 * The full-size deletion propagates errors; variant deletions are best-effort.
 * @param {Object} image - Image object with `full` path and optional `compressed` path
 * @returns {Promise<void>}
 */
export async function deleteImageFiles({ full, compressed }) {
  const optimized400 = full.replace(/\.[^.]+$/, '_400x400.webp');
  const optimized1080 = full.replace(/\.[^.]+$/, '_1080x1080.webp');
  await StorageService.deleteFile(full);
  await Promise.all([
    StorageService.deleteFile(optimized400).catch(() => {}),
    StorageService.deleteFile(optimized1080).catch(() => {}),
    ...(compressed ? [StorageService.deleteFile(compressed).catch(() => {})] : []),
  ]);
}

/**
 * Sets the primary image for a recipe
 * @param {string} recipeId
 * @param {string} imageId
 * @returns {Promise<void>}
 */
export async function setPrimaryImage(recipeId, imageId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !Array.isArray(recipe.images)) throw new Error('No images to update');
  const images = recipe.images.map((img) => ({ ...img, isPrimary: img.id === imageId }));
  await updateRecipeDoc(recipeId, { images });
}

// --- Retrieval ---
/**
 * Returns only accessible images for a user role
 * @param {Object} recipe
 * @param {string} userRole
 * @returns {Array<RecipeImage>}
 */
export function getRecipeImages(recipe, userRole) {
  if (!recipe || !Array.isArray(recipe.images)) return [];
  const ACCESS_LEVELS = {
    manager: ['manager', 'approved', 'public'],
    approved: ['approved', 'public'],
    user: ['public'],
    public: ['public'],
  };
  const allowed = ACCESS_LEVELS[userRole] || ['public'];
  return recipe.images.filter((img) => allowed.includes(img.access));
}

/**
 * Gets the download URL for a storage path
 * @param {string} storagePath
 * @returns {Promise<string>}
 */
export async function getImageUrl(storagePath) {
  return await StorageService.getFileUrl(storagePath);
}

/**
 * Gets placeholder image URL for recipes without images
 * @returns {null} Returns null to indicate no image is available
 */
export function getPlaceholderImageUrl() {
  return null;
}

/**
 * Gets the download URL for an optimized version of an image with fallback
 * @param {RecipeImage|PendingRecipeImage} image - The image object
 * @param {string} size - Target size (e.g., '400x400', '1080x1080')
 * @returns {Promise<string>} Download URL
 */
export async function getOptimizedImageUrl(image, size = '400x400') {
  if (!image || !image.full) return getPlaceholderImageUrl();

  // 1. Try Optimized version (New)
  // Extension appends suffix like _400x400.webp
  const optimizedPath = image.full.replace(/\.[^.]+$/, `_${size}.webp`);

  try {
    return await StorageService.getFileUrl(optimizedPath);
  } catch (error) {
    // 2. Fallback to Legacy Compressed (if it exists in old docs)
    // TODO: Remove after migration period — https://github.com/roiguri/My-Cook-Book/issues/142
    if (image.compressed) {
      try {
        return await StorageService.getFileUrl(image.compressed);
      } catch (innerError) {
        // Fall through
      }
    }

    // 3. Fallback to Full Original (Latency or Legacy)
    try {
      return await StorageService.getFileUrl(image.full);
    } catch (finalError) {
      // 4. Ultimate Fallback
      return getPlaceholderImageUrl();
    }
  }
}

/**
 * Returns the primary image object for a recipe
 * @param {Object} recipe - Recipe object with images array
 * @returns {RecipeImage|undefined} The primary image object or undefined
 */
export function getPrimaryImage(recipe) {
  if (!recipe || !Array.isArray(recipe.images) || recipe.images.length === 0) return undefined;
  const primary = recipe.images.find((img) => img.isPrimary);
  return primary || recipe.images[0];
}

/**
 * Returns the download URL for the primary image's optimized version, or the placeholder if none
 * @param {Object} recipe - Recipe object with images array
 * @param {string} size - Target size (e.g., '400x400', '1080x1080')
 * @returns {Promise<string>} Download URL for the primary image or placeholder
 */
export async function getPrimaryImageUrl(recipe, size = '400x400') {
  const primary = getPrimaryImage(recipe);
  if (primary) {
    return await getOptimizedImageUrl(primary, size);
  }
  return getPlaceholderImageUrl();
}

/**
 * Removes all images (approved and pending) for a recipe
 * @param {string} recipeId
 * @returns {Promise<void>}
 */
export async function removeAllRecipeImages(recipeId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe) {
    console.warn('Recipe not found for image removal:', recipeId);
    return;
  }
  const deletePromises = [];
  if (recipe.images && Array.isArray(recipe.images)) {
    recipe.images.forEach((image) => {
      if (image.full)
        deletePromises.push(
          deleteImageFiles(image).catch((err) =>
            console.warn(`Failed to delete files for image ${image.id}:`, err),
          ),
        );
    });
  }
  if (recipe.pendingImages && Array.isArray(recipe.pendingImages)) {
    recipe.pendingImages.forEach((image) => {
      if (image.full)
        deletePromises.push(
          deleteImageFiles(image).catch((err) =>
            console.warn(`Failed to delete files for pending image ${image.id}:`, err),
          ),
        );
    });
  }
  await Promise.all(deletePromises);
  // Remove images and pendingImages from Firestore
  await updateRecipeDoc(recipeId, { images: [], pendingImages: [] });
}

// TODO: Consider migrating images to be category agnostic
/**
 * Migrates an image from old category path to new category path
 * @param {RecipeImage} image - Image object with old category paths
 * @param {string} recipeId
 * @param {string} oldCategory
 * @param {string} newCategory
 * @returns {Promise<RecipeImage>} Updated image object with new paths
 */
export async function migrateImageToCategory(image, recipeId, oldCategory, newCategory) {
  if (!image || !image.full) {
    throw new Error('Invalid image object for migration');
  }

  try {
    const fileName = image.full.split('/').pop();
    const newFullPath = getImageStoragePath(recipeId, newCategory, fileName, 'full');

    const fullUrl = await StorageService.getFileUrl(image.full);
    const fullResponse = await fetch(fullUrl);

    if (!fullResponse.ok) {
      throw new Error(`Failed to fetch images: full=${fullResponse.status}`);
    }

    const fullBlob = await fullResponse.blob();
    await StorageService.uploadFile(fullBlob, newFullPath);
    await StorageService.deleteFile(image.full);

    // Migrate WebP variants to new path (best effort — may not exist yet if extension hasn't run)
    const oldOpt400 = image.full.replace(/\.[^.]+$/, '_400x400.webp');
    const oldOpt1080 = image.full.replace(/\.[^.]+$/, '_1080x1080.webp');
    const newOpt400 = newFullPath.replace(/\.[^.]+$/, '_400x400.webp');
    const newOpt1080 = newFullPath.replace(/\.[^.]+$/, '_1080x1080.webp');
    for (const [oldPath, newPath] of [
      [oldOpt400, newOpt400],
      [oldOpt1080, newOpt1080],
    ]) {
      try {
        const url = await StorageService.getFileUrl(oldPath);
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          await StorageService.uploadFile(blob, newPath);
          await StorageService.deleteFile(oldPath).catch(() => {});
        }
      } catch {
        // variant doesn't exist yet — extension will create it at the new path
      }
    }

    // If there was a legacy compressed version, delete it too
    if (image.compressed) {
      await StorageService.deleteFile(image.compressed).catch(() => {});
    }

    const updatedImage = {
      ...image,
      full: newFullPath,
    };
    delete updatedImage.compressed;

    return updatedImage;
  } catch (error) {
    console.error(
      `Failed to migrate image ${image.id} from ${oldCategory} to ${newCategory}:`,
      error,
    );
    throw new Error(`Failed to migrate image ${image.id}: ${error.message}`);
  }
}

/**
 * Uploads a recipe image (full only) and returns metadata
 * @param {Object} params
 * @param {string} recipeId
 * @param {string} category
 * @param {File} file
 * @param {boolean} isPrimary
 * @param {string} uploadedBy
 * @returns {Promise<Object>} image metadata
 */
export async function uploadAndBuildImageMetadata({
  recipeId,
  category,
  file,
  isPrimary,
  uploadedBy,
}) {
  const fileExtension = file.name.split('.').pop();
  const fileName = isPrimary ? 'primary.jpg' : `${Date.now()}.${fileExtension}`;
  const fullPath = getImageStoragePath(recipeId, category, fileName, 'full');
  await StorageService.uploadFile(file, fullPath);

  return {
    id: generateImageId(),
    full: fullPath,
    fileName,
    isPrimary,
    uploadedBy,
    access: 'public',
    uploadTimestamp: new Date(),
  };
}

/**
 * Uploads multiple pending images for a recipe (to be approved by manager)
 * @param {string} recipeId
 * @param {File[]} files
 * @param {string} category
 * @param {string} uploader
 * @returns {Promise<Array>} Array of pending image objects
 */
export async function addPendingImages(recipeId, files, category, uploader) {
  if (!Array.isArray(files) || files.length === 0) return [];
  const recipe = await getRecipeDoc(recipeId);
  const pendingImages = Array.isArray(recipe.pendingImages) ? [...recipe.pendingImages] : [];

  // Upload all images in parallel for better performance
  const uploadPromises = files.map(async (file) => {
    const fileExtension = file.name.split('.').pop();
    const id = generateImageId();
    const fileName = `${id}.${fileExtension}`;
    // Upload full-size
    const fullPath = getImageStoragePath(recipeId, category, fileName, 'full');
    await StorageService.uploadFile(file, fullPath);

    return {
      id,
      full: fullPath,
      fileExtension,
      timestamp: new Date(),
      uploadedBy: uploader,
    };
  });

  const newPendingImages = await Promise.all(uploadPromises);
  pendingImages.push(...newPendingImages);
  await updateRecipeDoc(recipeId, { pendingImages });
  return newPendingImages;
}

/**
 * Approves a specific pending image for a recipe, moving it to the images array
 * @param {string} recipeId
 * @param {string} pendingImageId
 * @returns {Promise<string>} The new image ID after approval
 */
export async function approvePendingImageById(recipeId, pendingImageId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !Array.isArray(recipe.pendingImages))
    throw new Error('No pending images to approve');
  const idx = recipe.pendingImages.findIndex((img) => img.id === pendingImageId);
  if (idx === -1) throw new Error('Pending image not found');
  const pendingImage = recipe.pendingImages[idx];
  const newImageId = generateImageId();
  const newImage = {
    id: newImageId,
    full: pendingImage.full,
    isPrimary: !recipe.images || recipe.images.length === 0,
    access: 'public',
    uploadedBy: pendingImage.uploadedBy,
    fileName: `${pendingImageId}.${pendingImage.fileExtension}`,
    uploadTimestamp: new Date(),
  };
  const images = Array.isArray(recipe.images) ? [...recipe.images, newImage] : [newImage];
  const pendingImages = recipe.pendingImages.filter((img) => img.id !== pendingImageId);
  await updateRecipeDoc(recipeId, { images, pendingImages });
  return newImageId;
}

/**
 * Rejects a specific pending image for a recipe, deleting it from storage and Firestore
 * @param {string} recipeId
 * @param {string} pendingImageId
 * @returns {Promise<void>}
 */
export async function rejectPendingImageById(recipeId, pendingImageId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !Array.isArray(recipe.pendingImages))
    throw new Error('No pending images to reject');
  const idx = recipe.pendingImages.findIndex((img) => img.id === pendingImageId);
  if (idx === -1) throw new Error('Pending image not found');
  const pendingImage = recipe.pendingImages[idx];
  await deleteImageFiles(pendingImage);
  const pendingImages = recipe.pendingImages.filter((img) => img.id !== pendingImageId);
  await updateRecipeDoc(recipeId, { pendingImages });
}

/**
 * Returns the array of pending images for a recipe
 * @param {string} recipeId
 * @returns {Promise<Array>}
 */
export async function getPendingImages(recipeId) {
  const recipe = await getRecipeDoc(recipeId);
  return Array.isArray(recipe?.pendingImages) ? recipe.pendingImages : [];
}
