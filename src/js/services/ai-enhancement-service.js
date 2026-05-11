import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './firebase-service.js';

/**
 * Calls the `enhanceFoodImage` Cloud Function with the provided image payload.
 * @param {{ base64: string, mimeType: string }} imagePayload
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export async function enhanceFoodImage(imagePayload) {
  const fns = getFunctions(getFirebaseApp());
  const fn = httpsCallable(fns, 'enhanceFoodImage');
  const result = await fn({ image: imagePayload });
  const data = result?.data;
  if (!data || !data.base64) throw new Error('Empty response from enhancement service');
  return data;
}
