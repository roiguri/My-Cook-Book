// src/js/services/storage-service.js

// 1. External dependencies
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
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
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Uploads a file to Firebase Storage with progress tracking.
   * @param {File|Blob} file - The file to upload
   * @param {string} path - The storage path
   * @param {Function} [onProgress] - Callback for progress (percent: number) => void
   * @returns {Promise<string>} The download URL of the uploaded file
   */
  static uploadFileWithProgress(file, path, onProgress) {
    return new Promise((resolve, reject) => {
      try {
        const storage = getStorageInstance();
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress && typeof onProgress === 'function') {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Error uploading file with progress:', error);
            reject(new Error('Failed to upload file'));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(new Error('Failed to get download URL'));
            }
          },
        );
      } catch (error) {
        console.error('Error initiating upload:', error);
        reject(new Error('Failed to initiate upload'));
      }
    });
  }

  /**
   * Gets the download URL for a file in Firebase Storage.
   * @param {string} path - The storage path
   * @returns {Promise<string>} The download URL
   */
  static async getFileUrl(path) {
    try {
      const storage = getStorageInstance();
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
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
