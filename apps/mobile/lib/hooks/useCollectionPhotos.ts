import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/utils/imageUpload';
import { useVideoUpload } from '@/lib/hooks/useVideoUpload';

export interface CollectionPhoto {
  id: number;
  collection_id: number;
  user_id: string;
  /** 사진 row 일 때만 채워짐. 비디오 row 는 null. */
  photo_url: string | null;
  /** Mux playback id — 비디오 row 일 때만 채워짐. mux-playback-token EF 로 토큰 발급. */
  video_playback_id: string | null;
  caption: string | null;
  created_at: string;
}

/**
 * Memory media (사진 + 비디오) attached to a single cellar bottle.
 * Load + pick + upload + delete.
 *
 * 사진: post-images bucket → uploadImage helper → photo_url INSERT.
 * 비디오: mux-upload EF → PUT to Mux → mux-status polling → video_playback_id INSERT.
 *        rate limit (10/h per user) 은 mux-upload EF 가 적용.
 */
export function useCollectionPhotos(collectionId: number | null) {
  const { user } = useAuth();
  const { uploadVideo, uploading: uploadingVideo, progress: videoProgress } = useVideoUpload();
  const [photos, setPhotos] = useState<CollectionPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  /**
   * 단일 picker — OS 가 사진·비디오를 한 화면에 보여주고, 사용자가 고른
   * asset.type 으로 사진/비디오 업로드 흐름을 자동 분기. 호출자(grid)는
   * 어떤 미디어를 받을지 신경 쓸 필요 없음.
   */
  async function pickAndUpload(): Promise<CollectionPhoto | null> {
    if (!user || collectionId == null) return null;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진/비디오 라이브러리 접근 권한이 필요합니다.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      allowsEditing: false,
      // Mux 처리 시간 + 비용 고려해 비디오는 60s 컷. 사진은 무관.
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    if (asset.type === 'video') {
      const out = await uploadVideo(asset.uri);
      if (!out) {
        Alert.alert('업로드 실패', '동영상 업로드에 실패했습니다 (시간 초과 또는 rate limit).');
        return null;
      }
      return await insertRow({ photo_url: null, video_playback_id: out.playbackId });
    }

    // 기본은 image (asset.type === 'image' 또는 미정).
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(asset.uri, `${user.id}/memories`);
      if (!url) {
        Alert.alert('업로드 실패', '사진 업로드에 실패했습니다.');
        return null;
      }
      return await insertRow({ photo_url: url, video_playback_id: null });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function insertRow(media: { photo_url: string | null; video_playback_id: string | null }): Promise<CollectionPhoto | null> {
    if (!user || collectionId == null) return null;
    const { data, error } = await supabase
      .from('collection_photos')
      .insert({
        collection_id: collectionId,
        user_id: user.id,
        photo_url: media.photo_url,
        video_playback_id: media.video_playback_id,
      })
      .select('*')
      .single();
    if (error || !data) {
      Alert.alert('저장 실패', error?.message ?? '메모리 저장에 실패했습니다.');
      return null;
    }
    setPhotos(ps => [data as CollectionPhoto, ...ps]);
    return data as CollectionPhoto;
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

  return {
    photos, loading,
    uploading: uploadingPhoto || uploadingVideo,
    videoProgress,
    pickAndUpload,
    remove, reload: load,
  };
}
