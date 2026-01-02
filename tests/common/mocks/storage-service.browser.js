export class StorageService {
  static async uploadFile(file, path) {
    return 'mock-download-url';
  }

  static async getFileUrl(path) {
    // If the path is already a data URI or URL, return it as is
    if (path.startsWith('data:') || path.startsWith('http')) {
      return path;
    }
    // Otherwise, return a placeholder
    return 'mock-download-url';
  }

  static async deleteFile(path) {}
  static async listFiles(path) {
    return { items: [], prefixes: [] };
  }
  static async getMetadata(path) {
    return {};
  }
}

export const storageService = StorageService;
