import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/utils/imageUpload';

/**
 * Upload + attach / replace the personal photo on a collections row.
 *
 * Flow: picker → Storage upload (`{userId}/cellar/...`) → UPDATE
 * collections.photo_url. Used for wines that were in the cellar before the
 * photo column existed, or when the user wants a different shot.
 *
 * Returns `{ changePhoto, updating }`. Caller should re-load the list after
 * a successful change so the UI reflects the new photo.
 */
export function useCollectionPhoto() {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  async function pickFromLibrary(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach an image');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }

  async function changePhoto(collectionId: number): Promise<boolean> {
    if (!user || updating) return false;
    const uri = await pickFromLibrary();
    if (!uri) return false;

    setUpdating(true);
    try {
      const uploaded = await uploadImage(uri, `${user.id}/cellar`);
      if (!uploaded) {
        Alert.alert('Upload failed', 'Could not upload the photo. Try again.');
        return false;
      }
      const { error } = await supabase
        .from('collections')
        .update({ photo_url: uploaded })
        .eq('id', collectionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[useCollectionPhoto] update failed:', error.message);
        Alert.alert('Save failed', error.message.includes('photo_url')
          ? 'The photo_url column is missing. Apply migration 00021 first.'
          : error.message);
        return false;
      }
      return true;
    } finally {
      setUpdating(false);
    }
  }

  return { changePhoto, updating };
}
