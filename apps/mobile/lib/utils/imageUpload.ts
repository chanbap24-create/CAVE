import { supabase } from '@/lib/supabase';

// Whitelist of allowed image extensions. Anything else is rejected to prevent
// uploading arbitrary content types (SVG/HTML/JS) that could be abused if
// rendered in a WebView or similar.
const ALLOWED_IMAGE_EXTS: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

export async function uploadImage(uri: string, path: string): Promise<string | null> {
  try {
    const ext = (uri.split('.').pop()?.split('?')[0] || '').toLowerCase();
    const contentType = ALLOWED_IMAGE_EXTS[ext];
    if (!contentType) {
      if (__DEV__) console.log('[image upload] rejected extension:', ext);
      return null;
    }

    const fileName = `${path}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from('post-images')
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      if (__DEV__) console.log('[image upload] error:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    if (__DEV__) console.log('[image upload] failed:', err);
    return null;
  }
}
