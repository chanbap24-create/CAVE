// Image → base64 helpers for API calls that need inline image data.
// Reusable across any feature that needs to POST an image as JSON.

export interface EncodedImage {
  base64: string;
  mediaType: string;
}

/** Fetch a file URI (local or remote) and return its base64 + media type. */
export async function fetchAsBase64(uri: string): Promise<EncodedImage> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mediaType = normalizeMediaType(blob.type || mediaTypeFromExt(uri));
  const base64 = await blobToBase64(blob);
  return { base64, mediaType };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

export function mediaTypeFromExt(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  };
  return map[ext] ?? 'image/jpeg';
}

// Anthropic accepts only jpeg/png/webp/gif. Expo's ImagePicker with editing
// produces jpeg on both platforms; anything unexpected → coerce to jpeg and
// let the server reject if truly wrong.
export function normalizeMediaType(t: string): string {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  return allowed.has(t) ? t : 'image/jpeg';
}
