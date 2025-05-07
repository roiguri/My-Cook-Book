import { jest } from '@jest/globals';

// Mocks for Firebase/Firestore/Storage
import '../../common/mocks/firebase-firestore.mock.js';
import '../../common/mocks/firebase-storage.mock.js';
import '../../common/mocks/firebase-service.mock.js';

let validateImageFile,
  compressImage,
  getImageStoragePath,
  addPendingImage,
  approvePendingImage,
  rejectPendingImage,
  removeApprovedImage,
  setPrimaryImage,
  getRecipeImages,
  getPendingImage,
  getImageUrl,
  getPlaceholderImageUrl,
  getPrimaryImage,
  getPrimaryImageUrl;

// Mock StorageService and FirestoreService
const uploadFileMock = jest.fn();
const getFileUrlMock = jest.fn();
const deleteFileMock = jest.fn();
const getDocumentMock = jest.fn();
const updateDocumentMock = jest.fn();

jest.unstable_mockModule('../../../src/js/services/storage-service.js', () => ({
  StorageService: {
    uploadFile: uploadFileMock,
    getFileUrl: getFileUrlMock,
    deleteFile: deleteFileMock,
  },
}));
jest.unstable_mockModule('../../../src/js/services/firestore-service.js', () => ({
  FirestoreService: {
    getDocument: getDocumentMock,
    updateDocument: updateDocumentMock,
  },
}));

// Helper: create a fake File
function createFakeFile(name = 'test.jpg', type = 'image/jpeg', size = 1000) {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('recipe-image-utils', () => {
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  });

  beforeEach(async () => {
    jest.resetModules();
    uploadFileMock.mockReset();
    getFileUrlMock.mockReset();
    deleteFileMock.mockReset();
    getDocumentMock.mockReset();
    updateDocumentMock.mockReset();
    const utils = await import('../../../src/js/utils/recipes/recipe-image-utils.js');
    validateImageFile = utils.validateImageFile;
    compressImage = utils.compressImage;
    getImageStoragePath = utils.getImageStoragePath;
    addPendingImage = utils.addPendingImage;
    approvePendingImage = utils.approvePendingImage;
    rejectPendingImage = utils.rejectPendingImage;
    removeApprovedImage = utils.removeApprovedImage;
    setPrimaryImage = utils.setPrimaryImage;
    getRecipeImages = utils.getRecipeImages;
    getPendingImage = utils.getPendingImage;
    getImageUrl = utils.getImageUrl;
    getPlaceholderImageUrl = utils.getPlaceholderImageUrl;
    getPrimaryImage = utils.getPrimaryImage;
    getPrimaryImageUrl = utils.getPrimaryImageUrl;
  });

  describe('validateImageFile', () => {
    it('validates correct file', () => {
      const file = createFakeFile();
      expect(validateImageFile(file)).toEqual({ isValid: true, errors: [] });
    });
    it('rejects missing file', () => {
      expect(validateImageFile(null).isValid).toBe(false);
    });
    it('rejects wrong type', () => {
      const file = createFakeFile('test.txt', 'text/plain');
      expect(validateImageFile(file).isValid).toBe(false);
    });
    it('rejects too large', () => {
      const file = createFakeFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024);
      expect(validateImageFile(file).isValid).toBe(false);
    });
  });

  describe('getImageStoragePath', () => {
    it('generates correct path for full', () => {
      expect(getImageStoragePath('id1', 'cat', 'file.jpg', 'full')).toBe(
        'img/recipes/full/cat/id1/file.jpg',
      );
    });
    it('generates correct path for compressed', () => {
      expect(getImageStoragePath('id2', 'cat2', 'file2.jpg', 'compressed')).toBe(
        'img/recipes/compressed/cat2/id2/file2.jpg',
      );
    });
  });

  describe('addPendingImage', () => {
    it('uploads and sets pending image', async () => {
      uploadFileMock.mockResolvedValue('url');
      updateDocumentMock.mockResolvedValue();
      const file = createFakeFile('img.jpg');
      const result = await addPendingImage('rid', file, 'cat', 'user1');
      expect(uploadFileMock).toHaveBeenCalledTimes(2);
      expect(updateDocumentMock).toHaveBeenCalledWith(
        'recipes',
        'rid',
        expect.objectContaining({ pendingImage: expect.any(Object) }),
      );
      expect(result.full).toContain('img/recipes/full/cat/rid/rid.jpg');
      expect(result.compressed).toContain('img/recipes/compressed/cat/rid/rid.jpg');
      expect(result.uploadedBy).toBe('user1');
    });
  });

  describe('approvePendingImage', () => {
    it('moves pending image to images array', async () => {
      getDocumentMock.mockResolvedValue({
        pendingImage: { full: 'full', compressed: 'comp', fileExtension: 'jpg', uploadedBy: 'u' },
        images: [],
      });
      updateDocumentMock.mockResolvedValue();
      await approvePendingImage('rid');
      expect(updateDocumentMock).toHaveBeenCalledWith(
        'recipes',
        'rid',
        expect.objectContaining({ images: expect.any(Array), pendingImage: null }),
      );
    });
    it('throws if no pending image', async () => {
      getDocumentMock.mockResolvedValue({});
      await expect(approvePendingImage('rid')).rejects.toThrow();
    });
  });

  describe('rejectPendingImage', () => {
    it('deletes pending image files and clears field', async () => {
      getDocumentMock.mockResolvedValue({ pendingImage: { full: 'f', compressed: 'c' } });
      updateDocumentMock.mockResolvedValue();
      await rejectPendingImage('rid');
      expect(deleteFileMock).toHaveBeenCalledWith('f');
      expect(deleteFileMock).toHaveBeenCalledWith('c');
      expect(updateDocumentMock).toHaveBeenCalledWith('recipes', 'rid', { pendingImage: null });
    });
    it('throws if no pending image', async () => {
      getDocumentMock.mockResolvedValue({});
      await expect(rejectPendingImage('rid')).rejects.toThrow();
    });
  });

  describe('removeApprovedImage', () => {
    it('removes image from images array and deletes files', async () => {
      getDocumentMock.mockResolvedValue({ images: [{ id: 'img1', full: 'f', compressed: 'c' }] });
      updateDocumentMock.mockResolvedValue();
      await removeApprovedImage('rid', 'img1');
      expect(deleteFileMock).toHaveBeenCalledWith('f');
      expect(deleteFileMock).toHaveBeenCalledWith('c');
      expect(updateDocumentMock).toHaveBeenCalledWith('recipes', 'rid', { images: [] });
    });
    it('throws if image not found', async () => {
      getDocumentMock.mockResolvedValue({ images: [{ id: 'img2' }] });
      await expect(removeApprovedImage('rid', 'img1')).rejects.toThrow();
    });
    it('throws if no images', async () => {
      getDocumentMock.mockResolvedValue({});
      await expect(removeApprovedImage('rid', 'img1')).rejects.toThrow();
    });
  });

  describe('setPrimaryImage', () => {
    it('sets isPrimary on correct image', async () => {
      getDocumentMock.mockResolvedValue({ images: [{ id: 'a' }, { id: 'b' }] });
      updateDocumentMock.mockResolvedValue();
      await setPrimaryImage('rid', 'b');
      expect(updateDocumentMock).toHaveBeenCalledWith('recipes', 'rid', {
        images: [
          { id: 'a', isPrimary: false },
          { id: 'b', isPrimary: true },
        ],
      });
    });
    it('throws if no images', async () => {
      getDocumentMock.mockResolvedValue({});
      await expect(setPrimaryImage('rid', 'b')).rejects.toThrow();
    });
  });

  describe('getRecipeImages', () => {
    it('filters images by access', () => {
      const recipe = {
        images: [
          { id: '1', access: 'public' },
          { id: '2', access: 'approved' },
          { id: '3', access: 'manager' },
        ],
      };
      expect(getRecipeImages(recipe, 'public').map((i) => i.id)).toEqual(['1']);
      expect(getRecipeImages(recipe, 'approved').map((i) => i.id)).toEqual(
        expect.arrayContaining(['2', '1']),
      );
      expect(getRecipeImages(recipe, 'manager').map((i) => i.id)).toEqual(
        expect.arrayContaining(['3', '2', '1']),
      );
    });
    it('returns [] for no images', () => {
      expect(getRecipeImages({}, 'public')).toEqual([]);
    });
  });

  describe('getPendingImage', () => {
    it('returns pending image if present', async () => {
      getDocumentMock.mockResolvedValue({ pendingImage: { full: 'f' } });
      expect(await getPendingImage('rid')).toEqual({ full: 'f' });
    });
    it('returns null if not present', async () => {
      getDocumentMock.mockResolvedValue({});
      expect(await getPendingImage('rid')).toBeNull();
    });
  });

  describe('getImageUrl', () => {
    it('calls StorageService.getFileUrl', async () => {
      getFileUrlMock.mockResolvedValue('url');
      expect(await getImageUrl('path')).toBe('url');
      expect(getFileUrlMock).toHaveBeenCalledWith('path');
    });
  });

  describe('getPlaceholderImageUrl', () => {
    it('calls StorageService.getFileUrl with placeholder path', async () => {
      getFileUrlMock.mockResolvedValue('placeholder-url');
      expect(await getPlaceholderImageUrl()).toBe('placeholder-url');
      expect(getFileUrlMock).toHaveBeenCalledWith(
        'img/recipes/compressed/place-holder-add-new.png',
      );
    });
  });

  describe('getPrimaryImage', () => {
    it('returns the primary image if present', () => {
      const recipe = { images: [
        { id: '1', isPrimary: false },
        { id: '2', isPrimary: true },
        { id: '3' }
      ]};
      expect(getPrimaryImage(recipe)).toEqual({ id: '2', isPrimary: true });
    });
    it('returns the first image if no primary', () => {
      const recipe = { images: [
        { id: '1' },
        { id: '2' }
      ]};
      expect(getPrimaryImage(recipe)).toEqual({ id: '1' });
    });
    it('returns undefined if no images', () => {
      expect(getPrimaryImage({ images: [] })).toBeUndefined();
      expect(getPrimaryImage({})).toBeUndefined();
      expect(getPrimaryImage(null)).toBeUndefined();
    });
  });

  describe('getPrimaryImageUrl', () => {
    it('returns the download URL for the primary image', async () => {
      getFileUrlMock.mockResolvedValue('img-url');
      const recipe = { images: [
        { id: '1', isPrimary: true, compressed: 'img-path' }
      ]};
      await expect(getPrimaryImageUrl(recipe)).resolves.toBe('img-url');
      expect(getFileUrlMock).toHaveBeenCalledWith('img-path');
    });
    it('returns the download URL for the first image if no primary', async () => {
      getFileUrlMock.mockResolvedValue('img-url2');
      const recipe = { images: [
        { id: '1', compressed: 'img-path2' }
      ]};
      await expect(getPrimaryImageUrl(recipe)).resolves.toBe('img-url2');
      expect(getFileUrlMock).toHaveBeenCalledWith('img-path2');
    });
    it('returns the placeholder URL if no images', async () => {
      getFileUrlMock.mockResolvedValue('placeholder-url');
      await expect(getPrimaryImageUrl({ images: [] })).resolves.toBe('placeholder-url');
      await expect(getPrimaryImageUrl({})).resolves.toBe('placeholder-url');
      await expect(getPrimaryImageUrl(null)).resolves.toBe('placeholder-url');
    });
  });
});
