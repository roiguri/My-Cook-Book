// tests/services/storage-service-cache.test.mjs

import { jest } from '@jest/globals';

// Import the mocks (side-effect import to activate jest.unstable_mockModule)
import '../../common/mocks/firebase-storage.mock.js';
import '../../common/mocks/firebase-service.mock.js';

describe('StorageService Caching', () => {
  let StorageService, ref, uploadBytes, getDownloadURL, deleteObject, firebaseService;
  const mockStorage = 'mockStorage';
  const mockPath = 'uploads/cache-test.txt';
  const mockUrl = 'https://mockstorage.com/uploads/cache-test.txt';
  const newMockUrl = 'https://mockstorage.com/uploads/cache-test-new.txt';

  beforeEach(async () => {
    jest.resetModules();
    // Dynamically import after mocks are in place
    ({ StorageService } = await import('../../../src/js/services/storage-service.js'));
    ({ ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage'));
    firebaseService = await import('../../../src/js/services/firebase-service.js');
    firebaseService.getStorageInstance.mockReturnValue(mockStorage);
    ref.mockImplementation((storage, path) => ({ storage, path }));

    // Reset mocks
    getDownloadURL.mockReset();
    uploadBytes.mockReset();
    deleteObject.mockReset();
  });

  it('should cache getFileUrl calls', async () => {
    getDownloadURL.mockResolvedValue(mockUrl);

    // First call
    const url1 = await StorageService.getFileUrl(mockPath);
    expect(url1).toBe(mockUrl);
    expect(getDownloadURL).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const url2 = await StorageService.getFileUrl(mockPath);
    expect(url2).toBe(mockUrl);
    expect(getDownloadURL).toHaveBeenCalledTimes(1); // Still 1
  });

  it('should invalidate cache on deleteFile', async () => {
    getDownloadURL.mockResolvedValue(mockUrl);
    deleteObject.mockResolvedValue();

    // Populate cache
    await StorageService.getFileUrl(mockPath);
    expect(getDownloadURL).toHaveBeenCalledTimes(1);

    // Delete file
    await StorageService.deleteFile(mockPath);

    // Fetch again - should call getDownloadURL again (assuming file exists or we test the call)
    // Here we just test that it tries to fetch again
    await StorageService.getFileUrl(mockPath);
    expect(getDownloadURL).toHaveBeenCalledTimes(2);
  });

  it('should update cache on uploadFile', async () => {
    // Setup initial cache
    getDownloadURL.mockResolvedValueOnce(mockUrl);
    await StorageService.getFileUrl(mockPath);
    expect(getDownloadURL).toHaveBeenCalledTimes(1);

    // Upload new file (which returns a new URL)
    const mockFile = new Blob(['new content'], { type: 'text/plain' });
    uploadBytes.mockResolvedValue({});
    getDownloadURL.mockResolvedValueOnce(newMockUrl); // Return new URL on upload

    const uploadedUrl = await StorageService.uploadFile(mockFile, mockPath);
    expect(uploadedUrl).toBe(newMockUrl);

    // Fetch again - should get the new URL from cache without calling getDownloadURL again
    // Note: uploadFile called getDownloadURL once to get the new URL.
    // So total calls to getDownloadURL: 1 (initial) + 1 (upload) = 2.
    // The next getFileUrl should NOT increment it to 3.

    const url3 = await StorageService.getFileUrl(mockPath);
    expect(url3).toBe(newMockUrl);
    expect(getDownloadURL).toHaveBeenCalledTimes(2);
  });

  it('should remove from cache if getDownloadURL fails', async () => {
    const error = new Error('Network error');
    getDownloadURL.mockRejectedValue(error);

    // First call fails
    await expect(StorageService.getFileUrl(mockPath)).rejects.toThrow();

    // Reset mock to success
    getDownloadURL.mockReset();
    getDownloadURL.mockResolvedValue(mockUrl);

    // Second call should try again (because cache was cleared on error)
    const url = await StorageService.getFileUrl(mockPath);
    expect(url).toBe(mockUrl);
    expect(getDownloadURL).toHaveBeenCalledTimes(1);
  });

  it('should handle concurrent requests correctly', async () => {
    getDownloadURL.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockUrl;
    });

    // Fire two requests concurrently
    const [url1, url2] = await Promise.all([
        StorageService.getFileUrl(mockPath),
        StorageService.getFileUrl(mockPath)
    ]);

    expect(url1).toBe(mockUrl);
    expect(url2).toBe(mockUrl);
    expect(getDownloadURL).toHaveBeenCalledTimes(1);
  });
});
