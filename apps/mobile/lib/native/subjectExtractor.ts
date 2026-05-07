// Wrapper around the local `subject-extractor` Expo Module.
// Adds: support detection, in-memory LRU cache, hard timeout, dev logging.
//
// Native module returns a `file://` URI to a PNG with the foreground subject
// on a transparent background, or `null` on failure / unsupported / no subject.
//
// Cache is in-memory only; the underlying PNG lives in NSTemporaryDirectory()
// (iOS) or context.cacheDir (Android), both subject to OS reclamation. We do
// not attempt to clean up files — the OS will, and a stale entry just causes
// one extra native call.

import SubjectExtractor from '@/modules/subject-extractor/src';

const TIMEOUT_MS = 5000;
const CACHE_MAX = 20;

const cache = new Map<string, string>();

let supportedCache: boolean | null = null;

export function isSubjectExtractionSupported(): boolean {
  if (supportedCache !== null) return supportedCache;
  try {
    supportedCache = !!SubjectExtractor.isSupported();
  } catch (err) {
    if (__DEV__) console.log('[subjectExtractor] isSupported threw:', err);
    supportedCache = false;
  }
  return supportedCache;
}

export async function extractSubject(uri: string): Promise<string | null> {
  const cached = cache.get(uri);
  if (cached !== undefined) {
    cache.delete(uri);
    cache.set(uri, cached);
    return cached;
  }
  if (!isSubjectExtractionSupported()) return null;

  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const result = await Promise.race([
      SubjectExtractor.extractSubject(uri),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), TIMEOUT_MS);
      }),
    ]);
    if (result) {
      cache.set(uri, result);
      if (cache.size > CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
    }
    return result;
  } catch (err) {
    if (__DEV__) console.log('[subjectExtractor] extract failed:', err);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
