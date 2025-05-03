// tests/services/storage-service.test.mjs

import { jest } from '@jest/globals';

// Import the mocks (side-effect import to activate jest.unstable_mockModule)
import '../common/mocks/firebase-storage.mock.js';
import '../common/mocks/firebase-service.mock.js';

describe('StorageService', () => {
  let StorageService, ref, uploadBytes, getDownloadURL, deleteObject, firebaseService;
  const mockStorage = 'mockStorage';
  const mockFile = new Blob(['test content'], { type: 'text/plain' });
  const mockPath = 'uploads/test.txt';
  const mockUrl = 'https://mockstorage.com/uploads/test.txt';

  beforeEach(async () => {
    jest.resetModules();
    // Dynamically import after mocks are in place
    ({ StorageService } = await import('../../src/js/services/storage-service.js'));
    ({ ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage'));
    firebaseService = await import('../../src/js/services/firebase-service.js');
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
    });

    it('throws an error if upload fails', async () => {
      uploadBytes.mockRejectedValue(new Error('fail'));
      await expect(StorageService.uploadFile(mockFile, mockPath)).rejects.toThrow('Failed to upload file');
    });
  });

  describe('getFileUrl', () => {
    it('returns the download URL for a file', async () => {
      getDownloadURL.mockResolvedValue(mockUrl);
      const url = await StorageService.getFileUrl(mockPath);
      expect(firebaseService.getStorageInstance).toHaveBeenCalled();
      expect(ref).toHaveBeenCalledWith(mockStorage, mockPath);
      expect(getDownloadURL).toHaveBeenCalledWith({ storage: mockStorage, path: mockPath });
      expect(url).toBe(mockUrl);
    });

    it('throws an error if getDownloadURL fails', async () => {
      getDownloadURL.mockRejectedValue(new Error('fail'));
      await expect(StorageService.getFileUrl(mockPath)).rejects.toThrow('Failed to get file URL');
    });
  });

  describe('deleteFile', () => {
    it('deletes a file from storage', async () => {
      deleteObject.mockResolvedValue();
      await StorageService.deleteFile(mockPath);
      expect(firebaseService.getStorageInstance).toHaveBeenCalled();
      expect(ref).toHaveBeenCalledWith(mockStorage, mockPath);
      expect(deleteObject).toHaveBeenCalledWith({ storage: mockStorage, path: mockPath });
    });

    it('throws an error if deleteObject fails', async () => {
      deleteObject.mockRejectedValue(new Error('fail'));
      await expect(StorageService.deleteFile(mockPath)).rejects.toThrow('Failed to delete file');
    });
  });
}); 