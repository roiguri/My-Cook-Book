// tests/services/storage-service.test.mjs

import { jest } from '@jest/globals';

// Import the mocks (side-effect import to activate jest.unstable_mockModule)
import '../../common/mocks/firebase-storage.mock.js';
import '../../common/mocks/firebase-service.mock.js';

describe('StorageService', () => {
  let StorageService, ref, uploadBytes, getDownloadURL, deleteObject, firebaseService;
  const mockStorage = 'mockStorage';
  const mockFile = new Blob(['test content'], { type: 'text/plain' });
  const mockPath = 'uploads/test.txt';
  const mockUrl = 'https://mockstorage.com/uploads/test.txt';

  beforeEach(async () => {
    jest.resetModules();
    // Dynamically import after mocks are in place
    ({ StorageService } = await import('src/js/services/storage-service.js'));
    // Clear cache before each test
    StorageService._urlCache.clear();
    ({ ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage'));
    firebaseService = await import('src/js/services/firebase-service.js');
    firebaseService.getStorageInstance.mockReturnValue(mockStorage);
    ref.mockImplementation((storage, path) => ({ storage, path }));
  });

  describe('uploadFile', () => {
    it('uploads a file and returns its download URL', async () => {
      uploadBytes.mockResolvedValue({});
      getDownloadURL.mockResolvedValue(mockUrl);

      const url = await StorageService.uploadFile(mockFile, mockPath);

      expect(firebaseService.getStorageInstance).toHaveBeenCalled();
      expect(ref).toHaveBeenCalledWith(mockStorage, mockPath);
      expect(uploadBytes).toHaveBeenCalledWith({ storage: mockStorage, path: mockPath }, mockFile);
      expect(getDownloadURL).toHaveBeenCalledWith({ storage: mockStorage, path: mockPath });
      expect(url).toBe(mockUrl);
      // Verify cache update
      expect(StorageService._urlCache.get(mockPath)).toBe(mockUrl);
    });

    it('invalidates existing cache and updates with new URL', async () => {
      StorageService._urlCache.set(mockPath, 'old-url');
      uploadBytes.mockResolvedValue({});
      getDownloadURL.mockResolvedValue(mockUrl);

      const url = await StorageService.uploadFile(mockFile, mockPath);

      expect(url).toBe(mockUrl);
      expect(StorageService._urlCache.get(mockPath)).toBe(mockUrl);
    });

    it('throws an error if upload fails', async () => {
      uploadBytes.mockRejectedValue(new Error('fail'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(StorageService.uploadFile(mockFile, mockPath)).rejects.toThrow(
        'Failed to upload file',
      );
      errorSpy.mockRestore();
    });
  });

  describe('getFileUrl', () => {
    it('returns the download URL for a file and caches it', async () => {
      getDownloadURL.mockResolvedValue(mockUrl);

      // First call - should hit Firebase
      const url1 = await StorageService.getFileUrl(mockPath);
      expect(firebaseService.getStorageInstance).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalledTimes(1);
      expect(url1).toBe(mockUrl);
      expect(StorageService._urlCache.get(mockPath)).toBe(mockUrl);

      // Second call - should use cache
      const url2 = await StorageService.getFileUrl(mockPath);
      expect(getDownloadURL).toHaveBeenCalledTimes(1); // Call count should remain 1
      expect(url2).toBe(mockUrl);
    });

    it('throws an error if getDownloadURL fails', async () => {
      getDownloadURL.mockRejectedValue(new Error('fail'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(StorageService.getFileUrl(mockPath)).rejects.toThrow('Failed to get file URL');
      errorSpy.mockRestore();
    });
  });

  describe('deleteFile', () => {
    it('deletes a file from storage and removes it from cache', async () => {
      StorageService._urlCache.set(mockPath, mockUrl);
      deleteObject.mockResolvedValue();

      await StorageService.deleteFile(mockPath);

      expect(firebaseService.getStorageInstance).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalledWith({ storage: mockStorage, path: mockPath });
      expect(StorageService._urlCache.has(mockPath)).toBe(false);
    });

    it('throws an error if deleteObject fails', async () => {
      deleteObject.mockRejectedValue(new Error('fail'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(StorageService.deleteFile(mockPath)).rejects.toThrow('Failed to delete file');
      errorSpy.mockRestore();
    });
  });

  describe('listFiles', () => {
    it('lists all files and folders under a given path', async () => {
      const mockItems = [{ name: 'file1' }, { name: 'file2' }];
      const mockPrefixes = [{ name: 'folder1' }];
      const mockResult = { items: mockItems, prefixes: mockPrefixes };
      const listAll = (await import('firebase/storage')).listAll;
      listAll.mockResolvedValue(mockResult);

      const result = await StorageService.listFiles('uploads/');
      expect(firebaseService.getStorageInstance).toHaveBeenCalled();
      expect(ref).toHaveBeenCalledWith(mockStorage, 'uploads/');
      expect(listAll).toHaveBeenCalledWith({ storage: mockStorage, path: 'uploads/' });
      expect(result).toEqual(mockResult);
    });

    it('throws an error if listAll fails', async () => {
      const listAll = (await import('firebase/storage')).listAll;
      listAll.mockRejectedValue(new Error('fail'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(StorageService.listFiles('uploads/')).rejects.toThrow('Failed to list files');
      errorSpy.mockRestore();
    });
  });

  describe('getMetadata', () => {
    it('returns metadata for a file', async () => {
      const mockMetadata = { name: 'test.txt', size: 123 };
      const getMetadata = (await import('firebase/storage')).getMetadata;
      getMetadata.mockResolvedValue(mockMetadata);

      const result = await StorageService.getMetadata(mockPath);
      expect(firebaseService.getStorageInstance).toHaveBeenCalled();
      expect(ref).toHaveBeenCalledWith(mockStorage, mockPath);
      expect(getMetadata).toHaveBeenCalledWith({ storage: mockStorage, path: mockPath });
      expect(result).toEqual(mockMetadata);
    });

    it('throws an error if getMetadata fails', async () => {
      const getMetadata = (await import('firebase/storage')).getMetadata;
      getMetadata.mockRejectedValue(new Error('fail'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(StorageService.getMetadata(mockPath)).rejects.toThrow(
        'Failed to get file metadata',
      );
      errorSpy.mockRestore();
    });
  });
});
