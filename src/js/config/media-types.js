/**
 * Shared media type configuration for recipe images and instruction media.
 *
 * Two distinct contexts:
 * - Recipe images (main images on a recipe): photo formats only.
 * - Instruction media (step-by-step images/videos): photo formats + animated GIF + video.
 *
 * Both share the same photo format list so users get consistent behaviour across
 * iPhone (HEIC/HEIF), modern Android/Pixel (HEIC/AVIF), and desktop (JPEG/PNG/WebP).
 */

export const ALLOWED_RECIPE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
];

export const ALLOWED_INSTRUCTION_IMAGE_TYPES = [...ALLOWED_RECIPE_IMAGE_TYPES, 'image/gif'];

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const ALLOWED_INSTRUCTION_MEDIA_TYPES = [
  ...ALLOWED_INSTRUCTION_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

export const MAX_RECIPE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB (HEIC files can be larger than JPEG)
export const MAX_INSTRUCTION_MEDIA_SIZE = 50 * 1024 * 1024; // 50MB (matches storage.rules cap)

export const RECIPE_IMAGE_ACCEPT_ATTR = ALLOWED_RECIPE_IMAGE_TYPES.join(',');
export const INSTRUCTION_MEDIA_ACCEPT_ATTR = ALLOWED_INSTRUCTION_MEDIA_TYPES.join(',');

function formatSizeMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function formatLimitMB(bytes) {
  return Math.round(bytes / (1024 * 1024));
}

/**
 * Validates a recipe image file (main recipe image).
 * @param {File|Blob} file
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateRecipeImageFile(file) {
  const errors = [];

  if (!file) {
    errors.push('לא סופק קובץ');
    return { isValid: false, errors };
  }

  if (!ALLOWED_RECIPE_IMAGE_TYPES.includes(file.type)) {
    errors.push(
      `סוג הקובץ ${file.type || 'לא ידוע'} אינו נתמך. סוגי קבצים מותרים: JPEG, PNG, WebP, HEIC, HEIF, AVIF`,
    );
  }

  if (file.size > MAX_RECIPE_IMAGE_SIZE) {
    errors.push(
      `התמונה גדולה מדי (${formatSizeMB(file.size)}MB). גודל מקסימלי: ${formatLimitMB(MAX_RECIPE_IMAGE_SIZE)}MB`,
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates an instruction media file (image or video for instruction steps).
 * @param {File|Blob} file
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateInstructionMediaFile(file) {
  const errors = [];

  if (!file) {
    errors.push('לא סופק קובץ');
    return { isValid: false, errors };
  }

  if (!ALLOWED_INSTRUCTION_MEDIA_TYPES.includes(file.type)) {
    errors.push(
      `סוג הקובץ ${file.type || 'לא ידוע'} אינו נתמך. תמונות: JPEG, PNG, WebP, GIF, HEIC, HEIF, AVIF. סרטונים: MP4, WebM, MOV`,
    );
  }

  if (file.size > MAX_INSTRUCTION_MEDIA_SIZE) {
    errors.push(
      `הקובץ גדול מדי (${formatSizeMB(file.size)}MB). גודל מקסימלי: ${formatLimitMB(MAX_INSTRUCTION_MEDIA_SIZE)}MB`,
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Determines if a file is an image or video based on its MIME type.
 * @param {File|Blob} file
 * @returns {'image'|'video'|null}
 */
export function getInstructionMediaType(file) {
  if (ALLOWED_INSTRUCTION_IMAGE_TYPES.includes(file.type)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video';
  return null;
}
