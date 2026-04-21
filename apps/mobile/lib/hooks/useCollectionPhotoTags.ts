import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface CollectionPhotoTag {
  photo_id: number;
  tagged_user_id: string;
  tagged_by_user_id: string | null;
  x: number;
  y: number;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Tags on a single collection_photos row. Load on mount, add (owner
 * only), remove (owner only). Notification to the tagged user is fired
 * by the DB trigger (migration 00043).
 */
export function useCollectionPhotoTags(photoId: number | null) {
  const { user } = useAuth();
  const [tags, setTags] = useState<CollectionPhotoTag[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (photoId == null) { setTags([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('collection_photo_tags')
      .select(`
        photo_id, tagged_user_id, tagged_by_user_id, x, y,
        profile:profiles!collection_photo_tags_tagged_user_id_fkey(username, display_name, avatar_url)
      `)
      .eq('photo_id', photoId);
    if (error) console.error('[useCollectionPhotoTags]', error.message);
    setTags((data ?? []) as unknown as CollectionPhotoTag[]);
    setLoading(false);
  }, [photoId]);

  useEffect(() => { load(); }, [load]);

  async function addTag(taggedUserId: string, x: number, y: number): Promise<boolean> {
    if (!user || photoId == null) return false;
    const { error } = await supabase
      .from('collection_photo_tags')
      .insert({
        photo_id: photoId,
        tagged_user_id: taggedUserId,
        tagged_by_user_id: user.id,
        x, y,
      });
    if (error) {
      // 23505 = same user already tagged on this photo — treat as idempotent.
      if ((error as { code?: string }).code !== '23505') {
        Alert.alert('태그 실패', error.message);
        return false;
      }
    }
    await load();
    return true;
  }

  async function removeTag(taggedUserId: string): Promise<boolean> {
    if (!user || photoId == null) return false;
    const { error } = await supabase
      .from('collection_photo_tags')
      .delete()
      .eq('photo_id', photoId)
      .eq('tagged_user_id', taggedUserId);
    if (error) {
      Alert.alert('태그 삭제 실패', error.message);
      return false;
    }
    await load();
    return true;
  }

  return { tags, loading, addTag, removeTag };
}
