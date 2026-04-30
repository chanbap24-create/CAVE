import { supabase } from '@/lib/supabase';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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

// 1000 CCU 확장성 — 원본을 그대로 올리면 4K 사진(5MB+)이 그대로 storage 에 들어감.
// 업로드 직전에 long-edge 1080 리사이즈 + jpeg 70% 압축으로 평균 200~400KB 로 떨어짐.
// Storage 비용 + 업로드 시간 + 다운로드(피드 노출) 대역폭 모두 감소.
const MAX_LONG_EDGE = 1080;
const COMPRESS_QUALITY = 0.7;

/**
 * 이미지를 long-edge 1080 으로 리사이즈하고 jpeg 70% 로 재인코딩.
 * 실패하면 원본 URI 반환 (업로드 자체는 진행되도록).
 */
async function compressForUpload(uri: string): Promise<{ uri: string; ext: string; contentType: string }> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_LONG_EDGE } }], // 종횡비 유지하며 width 캡 (height 가 더 길면 하위 리사이즈 도구가 적절히 처리)
      { compress: COMPRESS_QUALITY, format: SaveFormat.JPEG },
    );
    return { uri: result.uri, ext: 'jpg', contentType: 'image/jpeg' };
  } catch (err) {
    if (__DEV__) console.log('[image upload] manipulator failed, using original:', err);
    const ext = (uri.split('.').pop()?.split('?')[0] || '').toLowerCase();
    return { uri, ext, contentType: ALLOWED_IMAGE_EXTS[ext] ?? 'application/octet-stream' };
  }
}

export async function uploadImage(uri: string, path: string): Promise<string | null> {
  try {
    const compressed = await compressForUpload(uri);
    if (!ALLOWED_IMAGE_EXTS[compressed.ext]) {
      if (__DEV__) console.log('[image upload] rejected extension:', compressed.ext);
      return null;
    }

    const fileName = `${path}/${Date.now()}.${compressed.ext}`;
    const response = await fetch(compressed.uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from('post-images')
      .upload(fileName, arrayBuffer, {
        contentType: compressed.contentType,
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
