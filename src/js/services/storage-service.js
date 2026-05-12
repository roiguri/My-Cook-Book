// src/js/services/storage-service.js

// 1. External dependencies
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from 'firebase/storage';
// 2. Internal modules/services
import { getStorageInstance } from './firebase-service.js';
import { LRUCache } from '../utils/lru-cache.js';

const urlCache = new LRUCache(500);

// Firebase Storage error codes that are worth retrying — transient network failures
// or server-side cancellations. Permission errors and quota errors are NOT retried.
const TRANSIENT_STORAGE_ERROR_CODES = new Set([
  'storage/retry-limit-exceeded',
  'storage/canceled',
  'storage/unknown',
  'storage/server-file-wrong-size',
]);

function isTransientUploadError(error) {
  if (!error) return false;
  if (TRANSIENT_STORAGE_ERROR_CODES.has(error.code)) return true;
  const message = (error.message || '').toLowerCase();
  return message.includes('network') || message.includes('fetch');
}

function wrapStorageError(error, action) {
  // Preserve Firebase error.code so error-handler.js can produce a meaningful Hebrew message.
  // Wrapping into a generic Error here strips that code and is the main reason upload failures
  // look "silent" to users — getErrorMessage() falls through to the generic fallback.
  const wrapped = new Error(error?.message || `Failed to ${action} file`);
  if (error?.code) wrapped.code = error.code;
  if (error?.serverResponse) wrapped.serverResponse = error.serverResponse;
  wrapped.cause = error;
  return wrapped;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * StorageService: General-purpose file upload, retrieval, and deletion using Firebase Storage.
 */
export class StorageService {
  /**
   * Uploads a file to Firebase Storage with one retry for transient errors.
   * Preserves Firebase error codes (e.g. storage/unauthorized) on failure so callers
   * can show meaningful messages via error-handler.js.
   * @param {File|Blob} file - The file to upload
   * @param {string} path - The storage path (e.g. 'uploads/myfile.txt')
   * @returns {Promise<string>} The download URL of the uploaded file
   */
  static async uploadFile(file, path) {
    const maxAttempts = 2;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const storage = getStorageInstance();
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urlCache.set(path, url);
        return url;
      } catch (error) {
        lastError = error;
        console.error(
          `Error uploading file (attempt ${attempt}/${maxAttempts}, code=${error?.code || 'unknown'}):`,
          error,
        );
        if (attempt < maxAttempts && isTransientUploadError(error)) {
          await sleep(1000 * attempt);
          continue;
        }
        break;
      }
    }
    throw wrapStorageError(lastError, 'upload');
  }

  /**
   * Gets the download URL for a file in Firebase Storage.
   * @param {string} path - The storage path
   * @returns {Promise<string>} The download URL
   */
  static async getFileUrl(path) {
    if (urlCache.has(path)) {
      return urlCache.get(path);
    }

    try {
      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      urlCache.set(path, url);
      return url;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw wrapStorageError(error, 'get URL for');
    }
  }

  /**
   * Deletes a file from Firebase Storage.
   * @param {string} path - The storage path
   * @returns {Promise<void>}
   */
  static async deleteFile(path) {
    try {
      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      urlCache.delete(path);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw wrapStorageError(error, 'delete');
    }
  }

  /**
   * Lists all files and folders under a given storage path.
   * @param {string} path - The storage path (e.g. 'uploads/')
   * @returns {Promise<{ items: Array, prefixes: Array }>} List of file and folder references
   */
  static async listFiles(path) {
    try {
      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      return {
        items: result.items, // Array of StorageReference for files
        prefixes: result.prefixes, // Array of StorageReference for folders
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Gets the metadata for a file in Firebase Storage.
   * @param {string} path - The storage path
   * @returns {Promise<Object>} The file metadata
   */
  static async getMetadata(path) {
    try {
      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      return await getMetadata(storageRef);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

// Optionally, export a singleton instance
export const storageService = StorageService;
