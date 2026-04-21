import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface WineMemory {
  id: number;
  user_id: string;
  photo_url: string | null;
  is_public: boolean;
  tasting_note: string | null;
  tasting_note_updated_at: string | null;
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
        id, user_id, photo_url, is_public, tasting_note, tasting_note_updated_at, created_at,
        wine:wines(id, name, name_ko, producer, category, region, country, vintage_year, image_url),
        owner:profiles!collections_user_id_fkey(username, display_name, avatar_url)
      `)
      .eq('id', collectionId)
      .maybeSingle();
    if (error) console.error('[useWineMemory]', error.message);
    setData((row as unknown as WineMemory) ?? null);
    setLoading(false);
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);

  const isOwner = !!user && !!data && user.id === data.user_id;

  async function saveTastingNote(note: string): Promise<boolean> {
    if (!isOwner || collectionId == null) return false;
    const { error } = await supabase
      .from('collections')
      .update({ tasting_note: note.trim() || null })
      .eq('id', collectionId);
    if (error) {
      Alert.alert('저장 실패', error.message);
      return false;
    }
    // Optimistically refresh to get the new updated_at without a second fetch.
    setData(d => d ? { ...d, tasting_note: note.trim() || null, tasting_note_updated_at: new Date().toISOString() } : d);
    return true;
  }

  return { data, loading, isOwner, reload: load, saveTastingNote };
}
