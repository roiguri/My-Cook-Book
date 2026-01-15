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

/**
 * StorageService: General-purpose file upload, retrieval, and deletion using Firebase Storage.
 */
export class StorageService {
  /**
   * Uploads a file to Firebase Storage.
   * @param {File|Blob} file - The file to upload
   * @param {string} path - The storage path (e.g. 'uploads/myfile.txt')
   * @returns {Promise<string>} The download URL of the uploaded file
   */
  static async uploadFile(file, path) {
    try {
      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const urlPromise = getDownloadURL(storageRef);
      // Update cache with the new URL promise
      StorageService._urlCache.set(path, urlPromise);
      return await urlPromise;
    } catch (error) {
      console.error('Error uploading file:', error);
      // Ensure we don't store failed promises
      StorageService._urlCache.delete(path);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Gets the download URL for a file in Firebase Storage.
   * @param {string} path - The storage path
   * @returns {Promise<string>} The download URL
   */
  static async getFileUrl(path) {
    if (StorageService._urlCache.has(path)) {
      return StorageService._urlCache.get(path);
    }

    try {
      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      const promise = getDownloadURL(storageRef);

      StorageService._urlCache.set(path, promise);

      // If the promise rejects, remove it from the cache so we can retry later
      promise.catch(() => {
        if (StorageService._urlCache.get(path) === promise) {
          StorageService._urlCache.delete(path);
        }
      });

      return await promise;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }

  /**
   * Deletes a file from Firebase Storage.
   * @param {string} path - The storage path
   * @returns {Promise<void>}
   */
  static async deleteFile(path) {
    try {
      // Remove from cache first
      StorageService._urlCache.delete(path);

      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
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
StorageService._urlCache = new Map();
