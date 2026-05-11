import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  EMPTY_TASTE_PROFILE, normalizeTasteProfile, isTasteProfileEmpty,
  type TasteProfileValue,
} from '@/lib/constants/tasteProfile';

export interface WineMemory {
  id: number;
  user_id: string;
  photo_url: string | null;
  is_public: boolean;
  tasting_note: string | null;
  tasting_note_updated_at: string | null;
  /** 별점 1~5. 노트와 같은 collections row 에 같이 저장. */
  rating: number | null;
  /** Vivino식 테이스팅 프로파일 — 슬라이더 3축 + 향 칩. jsonb 컬럼. */
  taste_profile: TasteProfileValue;
  created_at: string;
  wine: {
    id: number;
    name: string;
    name_ko: string | null;
    producer: string | null;
    category: string | null;
    region: string | null;
    country: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
  owner: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Loader for the /wine/[id] detail page: fetches the collection row with
 * the joined wine + owner profile, plus exposes a saveTastingNote helper
 * scoped to the owner. The page handles like/comment social via the
 * existing useCollectionLike / useCollectionComments hooks.
 */
export function useWineMemory(collectionId: number | null) {
  const { user } = useAuth();
  const [data, setData] = useState<WineMemory | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (collectionId == null) { setData(null); return; }
    setLoading(true);
    const { data: row, error } = await supabase
      .from('collections')
      .select(`
        id, user_id, photo_url, is_public, tasting_note, tasting_note_updated_at, rating, taste_profile, created_at,
        wine:wines(id, name, name_ko, producer, category, region, country, vintage_year, image_url),
        owner:profiles!collections_user_id_fkey(username, display_name, avatar_url)
      `)
      .eq('id', collectionId)
      .maybeSingle();
    if (error) console.error('[useWineMemory]', error.message);
    if (row) {
      const r = row as Record<string, unknown>;
      setData({
        ...(r as unknown as WineMemory),
        taste_profile: normalizeTasteProfile(r.taste_profile),
      });
    } else {
      setData(null);
    }
    setLoading(false);
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);

  const isOwner = !!user && !!data && user.id === data.user_id;

  async function saveTastingNote(
    note: string,
    rating: number | null,
    profile: TasteProfileValue,
  ): Promise<boolean> {
    if (!isOwner || collectionId == null) return false;
    const cleanNote = note.trim() || null;
    // 비어있는 프로파일은 jsonb null 로 저장 — 빈 객체보단 명시적 null 이 깔끔.
    const cleanProfile = isTasteProfileEmpty(profile) ? null : profile;
    const { error } = await supabase
      .from('collections')
      .update({ tasting_note: cleanNote, rating, taste_profile: cleanProfile })
      .eq('id', collectionId);
    if (error) {
      Alert.alert('저장 실패', error.message);
      return false;
    }
    // Optimistically refresh to avoid a round-trip; the touch trigger will
    // bump tasting_note_updated_at server-side, mirrored here as `now()`.
    setData(d => d ? {
      ...d,
      tasting_note: cleanNote,
      rating,
      taste_profile: cleanProfile ?? EMPTY_TASTE_PROFILE,
      tasting_note_updated_at: cleanNote !== d.tasting_note ? new Date().toISOString() : d.tasting_note_updated_at,
    } : d);
    return true;
  }

  return { data, loading, isOwner, reload: load, saveTastingNote };
}
