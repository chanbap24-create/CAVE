import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type MediaType = 'image' | 'video';

export function useMediaPicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');

  async function pickFromGallery(type: MediaType = 'image'): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to share');
      return false;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video' ? ['videos'] : ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: type === 'image' ? [1, 1] : undefined,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets[0]) return false;

    if (type === 'video') {
      setVideoUri(result.assets[0].uri);
      setImageUri(null);
      setMediaType('video');
    } else {
      setImageUri(result.assets[0].uri);
      setVideoUri(null);
      setMediaType('image');
    }
    return true;
  }

  async function takePhoto(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take photos');
        return false;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets[0]) return false;

      setImageUri(result.assets[0].uri);
      setVideoUri(null);
      setMediaType('image');
      return true;
    } catch {
      Alert.alert('Camera unavailable', 'Use gallery instead');
      return false;
    }
  }

  function reset() {
    setImageUri(null);
    setVideoUri(null);
    setMediaType('image');
  }

  return {
    imageUri,
    videoUri,
    mediaType,
    pickFromGallery,
    takePhoto,
    reset,
  };
}
