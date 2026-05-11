import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';
import { extractSubject } from '@/lib/native/subjectExtractor';

// long-edge 1080 + 압축. imageUpload.ts 의 collection 사진 정책과 동일선상.
// 누끼 PNG 는 알파 채널 보존을 위해 SaveFormat.PNG, JPG fallback 은 quality 0.7.
const MAX_LONG_EDGE = 1080;
const JPG_QUALITY = 0.7;

async function compressForContribute(
  uri: string,
  preferPng: boolean,
): Promise<{ uri: string; ext: 'png' | 'jpg'; contentType: string }> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_LONG_EDGE } }],
      preferPng
        ? { format: SaveFormat.PNG }
        : { compress: JPG_QUALITY, format: SaveFormat.JPEG },
    );
    return {
      uri: result.uri,
      ext: preferPng ? 'png' : 'jpg',
      contentType: preferPng ? 'image/png' : 'image/jpeg',
    };
  } catch {
    // manipulator 실패 시 원본 URI 그대로. 사이즈 제한은 못 걸지만 메인 흐름 OK.
    return {
      uri,
      ext: preferPng ? 'png' : 'jpg',
      contentType: preferPng ? 'image/png' : 'image/jpeg',
    };
  }
}

/**
 * 라벨 스캔 후 wines row 의 image_url 이 비어있으면 사용자 스캔 사진을
 * (가능하면 누끼 적용해서) 공용 이미지로 업로드.
 *
 * 정책: 첫 기여자 winner. wines.image_url RLS 가 NULL 일 때만 UPDATE 허용
 * (00059) → race 상황에서도 안전. 원본 vs 누끼는 native module 가용성 따라
 * 자동 선택 (SubjectExtractor 가 null 리턴 시 원본 fallback). 두 경로 모두
 * long-edge 1080 으로 리사이즈 (storage 비용·spam 방지).
 *
 * Fire-and-forget. 실패는 silent — 메인 라벨 스캔 흐름 차단하지 않음.
 */
export async function maybeContributeWineImage(
  wineId: number,
  scanUri: string,
): Promise<void> {
  try {
    // 1. 이미 누가 채워뒀으면 skip
    const { data: existing } = await supabase
      .from('wines')
      .select('image_url')
      .eq('id', wineId)
      .maybeSingle();
    if (existing?.image_url) return;

    // 2. 누끼 시도 — native module 가용 시 PNG, 아니면 원본 JPG fallback
    const cutout = await extractSubject(scanUri);
    const sourceUri = cutout ?? scanUri;
    const isCutout = !!cutout;

    // 3. 1080 장변 리사이즈 + 압축 (PNG 알파 보존 / JPG quality 0.7)
    const compressed = await compressForContribute(sourceUri, isCutout);
    const path = `wines/${wineId}.${compressed.ext}`;

    // 4. Storage 업로드 (upsert=false → race 상황에서 첫 업로더 winner)
    const response = await fetch(compressed.uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, arrayBuffer, { contentType: compressed.contentType, upsert: false });

    if (uploadError) {
      // Duplicate = 다른 기기가 먼저 업로드했음 → 그쪽 PublicUrl 로 진행 OK
      const isDup =
        uploadError.message.toLowerCase().includes('exists') ||
        uploadError.message.toLowerCase().includes('duplicate');
      if (!isDup) {
        if (__DEV__) console.log('[wineImage] upload failed:', uploadError.message);
        return;
      }
    }

    // 5. wines.image_url 업데이트 — RLS 가 image_url IS NULL 조건으로
    //    race-safe (다른 사용자가 이미 채웠으면 0 rows updated, silent)
    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
    if (!urlData?.publicUrl) return;

    await supabase
      .from('wines')
      .update({ image_url: urlData.publicUrl })
      .eq('id', wineId)
      .is('image_url', null);
  } catch (err) {
    if (__DEV__) console.log('[wineImage] failed:', err);
  }
}
