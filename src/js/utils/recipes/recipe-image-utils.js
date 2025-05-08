/**
 * @typedef {Object} RecipeImage
 * @property {string} id
 * @property {string} full
 * @property {string} compressed
 * @property {boolean} isPrimary
 * @property {string} access
 * @property {string} uploadedBy
 * @property {string} fileName
 * @property {Timestamp} uploadTimestamp
 */

/**
 * @typedef {Object} PendingRecipeImage
 * @property {string} full
 * @property {string} compressed
 * @property {string} fileExtension
 * @property {Timestamp} timestamp
 * @property {string} uploadedBy
 */

// --- Imports ---
import { StorageService } from '../../services/storage-service.js';
import { FirestoreService } from '../../services/firestore-service.js';
import { Timestamp, serverTimestamp } from 'firebase/firestore';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// --- Validation & Compression ---
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

// TODO: Implement compression
export async function compressImage(imageFile, quality = 0.7) {
  return imageFile;
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

// --- Image CRUD ---
/**
 * Uploads a pending image for a recipe (to be approved by manager)
 * @param {string} recipeId
 * @param {File} file
 * @param {string} category
 * @param {string} uploader
 * @returns {Promise<PendingRecipeImage>}
 */
export async function addPendingImage(recipeId, file, category, uploader) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${recipeId}.${fileExtension}`;
  // Upload full-size
  const fullPath = getImageStoragePath(recipeId, category, fileName, 'full');
  await StorageService.uploadFile(file, fullPath);
  // Compress and upload
  const compressedFile = await compressImage(file);
  const compressedPath = getImageStoragePath(recipeId, category, fileName, 'compressed');
  await StorageService.uploadFile(compressedFile, compressedPath);
  // Update Firestore
  const pendingImage = {
    full: fullPath,
    compressed: compressedPath,
    fileExtension,
    timestamp: serverTimestamp(),
    uploadedBy: uploader,
  };
  await updateRecipeDoc(recipeId, { pendingImage });
  return pendingImage;
}

/**
 * Approves the pending image for a recipe, moving it to the images array
 * @param {string} recipeId
 * @returns {Promise<void>}
 */
export async function approvePendingImage(recipeId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !recipe.pendingImage) throw new Error('No pending image to approve');
  const { full, compressed, fileExtension, uploadedBy } = recipe.pendingImage;
  const fileName = `${recipeId}.${fileExtension}`;
  const newImage = {
    id: generateImageId(),
    full,
    compressed,
    isPrimary: !recipe.images || recipe.images.length === 0,
    access: 'public',
    uploadedBy,
    fileName,
    uploadTimestamp: Timestamp.now(),
  };
  const images = Array.isArray(recipe.images) ? [...recipe.images, newImage] : [newImage];
  await updateRecipeDoc(recipeId, { images, pendingImage: null });
}

/**
 * Rejects the pending image for a recipe, deleting it from storage and Firestore
 * @param {string} recipeId
 * @returns {Promise<void>}
 */
export async function rejectPendingImage(recipeId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !recipe.pendingImage) throw new Error('No pending image to reject');
  const { full, compressed } = recipe.pendingImage;
  await StorageService.deleteFile(full);
  await StorageService.deleteFile(compressed);
  await updateRecipeDoc(recipeId, { pendingImage: null });
}

/**
 * Removes an approved image from a recipe (deletes from storage and Firestore)
 * @param {string} recipeId
 * @param {string} imageId
 * @returns {Promise<void>}
 */
export async function removeApprovedImage(recipeId, imageId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !Array.isArray(recipe.images)) throw new Error('No images to remove');
  const image = recipe.images.find((img) => img.id === imageId);
  if (!image) throw new Error('Image not found');
  await StorageService.deleteFile(image.full);
  await StorageService.deleteFile(image.compressed);
  const images = recipe.images.filter((img) => img.id !== imageId);
  await updateRecipeDoc(recipeId, { images });
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
 * Returns the pending image for a recipe
 * @param {string} recipeId
 * @returns {Promise<PendingRecipeImage|null>}
 */
export async function getPendingImage(recipeId) {
  const recipe = await getRecipeDoc(recipeId);
  return recipe?.pendingImage || null;
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
 * @returns {Promise<string>} Placeholder image URL
 */
export async function getPlaceholderImageUrl() {
  return await StorageService.getFileUrl('img/recipes/compressed/place-holder-add-new.png');
}

/**
 * Returns the primary image object for a recipe
 * @param {Object} recipe - Recipe object with images array
 * @returns {RecipeImage|undefined} The primary image object or undefined
 */
export function getPrimaryImage(recipe) {
  console.log('recipe', recipe);
  if (!recipe || !Array.isArray(recipe.images) || recipe.images.length === 0) return undefined;
  const primary = recipe.images.find((img) => img.isPrimary);
  return primary || recipe.images[0];
}

/**
 * Returns the download URL for the primary image's compressed version, or the placeholder if none
 * @param {Object} recipe - Recipe object with images array
 * @returns {Promise<string>} Download URL for the primary image or placeholder
 */
export async function getPrimaryImageUrl(recipe) {
  const primary = getPrimaryImage(recipe);
  if (primary && primary.compressed) {
    return await StorageService.getFileUrl(primary.compressed);
  }
  return await getPlaceholderImageUrl();
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
  // Delete approved images
  if (recipe.images && Array.isArray(recipe.images)) {
    recipe.images.forEach((image) => {
      if (image.full) {
        deletePromises.push(
          StorageService.deleteFile(image.full).catch((err) =>
            console.warn(`Error deleting full image ${image.id}:`, err),
          ),
        );
      }
      if (image.compressed) {
        deletePromises.push(
          StorageService.deleteFile(image.compressed).catch((err) =>
            console.warn(`Error deleting compressed image ${image.id}:`, err),
          ),
        );
      }
    });
  }
  // Delete pending images (batches) // TODO: check if necessary when implementing image suggestions
  if (recipe.pendingImages && Array.isArray(recipe.pendingImages)) {
    recipe.pendingImages.forEach((pendingBatch) => {
      if (pendingBatch.images && Array.isArray(pendingBatch.images)) {
        pendingBatch.images.forEach((image) => {
          if (image.full) {
            deletePromises.push(
              StorageService.deleteFile(image.full).catch((err) =>
                console.warn(`Error deleting pending full image ${image.id}:`, err),
              ),
            );
          }
          if (image.compressed) {
            deletePromises.push(
              StorageService.deleteFile(image.compressed).catch((err) =>
                console.warn(`Error deleting pending compressed image ${image.id}:`, err),
              ),
            );
          }
        });
      }
    });
  }
  await Promise.all(deletePromises);
  // Remove images and pendingImages from Firestore
  await updateRecipeDoc(recipeId, { images: [], pendingImages: [] });
}

/**
 * Uploads a recipe image (full and compressed) and returns metadata
 * @param {Object} params
 * @param {string} recipeId
 * @param {string} category
 * @param {File} file
 * @param {boolean} isPrimary
 * @param {string} uploadedBy
 * @returns {Promise<Object>} image metadata
 */
export async function uploadAndBuildImageMetadata({ recipeId, category, file, isPrimary, uploadedBy }) {
  const fileExtension = file.name.split('.').pop();
  const fileName = isPrimary ? 'primary.jpg' : `${Date.now()}.${fileExtension}`;
  const fullPath = getImageStoragePath(recipeId, category, fileName, 'full');
  const compressedPath = getImageStoragePath(recipeId, category, fileName, 'compressed');
  await StorageService.uploadFile(file, fullPath);
  const compressedFile = await compressImage(file);
  await StorageService.uploadFile(compressedFile, compressedPath);
  return {
    id: generateImageId(),
    full: fullPath,
    compressed: compressedPath,
    fileName,
    isPrimary,
    uploadedBy,
    access: 'public',
    uploadTimestamp: Timestamp.now(),
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
  const newPendingImages = [];
  for (const file of files) {
    const fileExtension = file.name.split('.').pop();
    const id = generateImageId();
    const fileName = `${id}.${fileExtension}`;
    // Upload full-size
    const fullPath = getImageStoragePath(recipeId, category, fileName, 'full');
    await StorageService.uploadFile(file, fullPath);
    // Compress and upload
    const compressedFile = await compressImage(file);
    const compressedPath = getImageStoragePath(recipeId, category, fileName, 'compressed');
    await StorageService.uploadFile(compressedFile, compressedPath);
    const pendingImage = {
      id,
      full: fullPath,
      compressed: compressedPath,
      fileExtension,
      timestamp: serverTimestamp(),
      uploadedBy: uploader,
    };
    pendingImages.push(pendingImage);
    newPendingImages.push(pendingImage);
  }
  await updateRecipeDoc(recipeId, { pendingImages });
  return newPendingImages;
}

/**
 * Approves a specific pending image for a recipe, moving it to the images array
 * @param {string} recipeId
 * @param {string} pendingImageId
 * @returns {Promise<void>}
 */
export async function approvePendingImageById(recipeId, pendingImageId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !Array.isArray(recipe.pendingImages)) throw new Error('No pending images to approve');
  const idx = recipe.pendingImages.findIndex(img => img.id === pendingImageId);
  if (idx === -1) throw new Error('Pending image not found');
  const pendingImage = recipe.pendingImages[idx];
  const newImage = {
    id: generateImageId(),
    full: pendingImage.full,
    compressed: pendingImage.compressed,
    isPrimary: !recipe.images || recipe.images.length === 0,
    access: 'public',
    uploadedBy: pendingImage.uploadedBy,
    fileName: `${pendingImageId}.${pendingImage.fileExtension}`,
    uploadTimestamp: Timestamp.now(),
  };
  const images = Array.isArray(recipe.images) ? [...recipe.images, newImage] : [newImage];
  const pendingImages = recipe.pendingImages.filter(img => img.id !== pendingImageId);
  await updateRecipeDoc(recipeId, { images, pendingImages });
}

/**
 * Rejects a specific pending image for a recipe, deleting it from storage and Firestore
 * @param {string} recipeId
 * @param {string} pendingImageId
 * @returns {Promise<void>}
 */
export async function rejectPendingImageById(recipeId, pendingImageId) {
  const recipe = await getRecipeDoc(recipeId);
  if (!recipe || !Array.isArray(recipe.pendingImages)) throw new Error('No pending images to reject');
  const idx = recipe.pendingImages.findIndex(img => img.id === pendingImageId);
  if (idx === -1) throw new Error('Pending image not found');
  const pendingImage = recipe.pendingImages[idx];
  await StorageService.deleteFile(pendingImage.full);
  await StorageService.deleteFile(pendingImage.compressed);
  const pendingImages = recipe.pendingImages.filter(img => img.id !== pendingImageId);
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
