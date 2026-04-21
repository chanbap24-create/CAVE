import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/utils/imageUpload';

export interface CollectionPhoto {
  id: number;
  collection_id: number;
  user_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

/**
 * Memory photos attached to a single cellar bottle. Load + pick + upload +
 * delete. The heavy lifting (blob → Storage) reuses uploadImage() so the
 * file lives in post-images/{user.id}/memories/... where the bucket RLS
 * (00028) already scopes writes to the uploader's folder.
 */
export function useCollectionPhotos(collectionId: number | null) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<CollectionPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (collectionId == null) { setPhotos([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('collection_photos')
      .select('*')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false });
    if (error) console.error('[useCollectionPhotos]', error.message);
    setPhotos((data ?? []) as CollectionPhoto[]);
    setLoading(false);
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);

  /** Pick from gallery → upload → insert row. Returns the created row. */
  async function pickAndUpload(): Promise<CollectionPhoto | null> {
    if (!user || collectionId == null) return null;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return null;

    setUploading(true);
    try {
      const url = await uploadImage(result.assets[0].uri, `${user.id}/memories`);
      if (!url) {
        Alert.alert('업로드 실패', '사진 업로드에 실패했습니다.');
        return null;
      }
      const { data, error } = await supabase
        .from('collection_photos')
        .insert({ collection_id: collectionId, user_id: user.id, photo_url: url })
        .select('*')
        .single();
      if (error || !data) {
        Alert.alert('저장 실패', error?.message ?? '메모리 사진 저장에 실패했습니다.');
        return null;
      }
      setPhotos(ps => [data as CollectionPhoto, ...ps]);
      return data as CollectionPhoto;
    } finally {
      setUploading(false);
    }
  }

  async function remove(photoId: number): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase
      .from('collection_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', user.id);
    if (error) {
      Alert.alert('삭제 실패', error.message);
      return false;
    }
    setPhotos(ps => ps.filter(p => p.id !== photoId));
    return true;
  }

  return { photos, loading, uploading, pickAndUpload, remove, reload: load };
}
