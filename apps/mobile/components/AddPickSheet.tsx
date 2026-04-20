import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/utils/imageUpload';
import { PickWineStep, PickPhotoStep } from '@/components/AddPickStages';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (wineId: number, photoUrl: string, memo: string) => Promise<void>;
  wines: any[]; // collection rows (with nested .wine and .photo_url)
}

type PhotoSource = 'cellar' | 'custom' | null;

export function AddPickSheet({ visible, onClose, onAdd, wines }: Props) {
  const { user } = useAuth();
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoSource>(null);
  const [memo, setMemo] = useState('');
  const [wineSearch, setWineSearch] = useState('');
  const [adding, setAdding] = useState(false);

  // Reset everything when the sheet re-opens.
  useEffect(() => {
    if (!visible) {
      setSelectedWine(null);
      setPhotoUri(null);
      setPhotoSource(null);
      setMemo('');
      setWineSearch('');
    }
  }, [visible]);

  // Pre-fill the pick photo from the user's cellar shot when one exists so
  // they don't re-upload. Tapping the photo picker flips to 'custom'.
  useEffect(() => {
    if (!selectedWine) return;
    const cellarPhoto = selectedWine.photo_url as string | null | undefined;
    if (cellarPhoto) {
      setPhotoUri(cellarPhoto);
      setPhotoSource('cellar');
    } else {
      setPhotoUri(null);
      setPhotoSource(null);
    }
  }, [selectedWine]);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoSource('custom');
    }
  }

  async function handleAdd() {
    if (!selectedWine || !photoUri || !user) return;
    setAdding(true);

    // Reuse cellar URL (already in Storage); only upload fresh picks.
    const photoUrl = photoSource === 'cellar'
      ? photoUri
      : ((await uploadImage(photoUri, `${user.id}/picks`)) ?? photoUri);

    await onAdd(selectedWine.wine_id || selectedWine.id, photoUrl, memo);
    setAdding(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Add to My Picks</Text>

        {!selectedWine ? (
          <PickWineStep
            wines={wines}
            search={wineSearch}
            onSearchChange={setWineSearch}
            onSelect={setSelectedWine}
          />
        ) : (
          <PickPhotoStep
            wineName={selectedWine.wine?.name || selectedWine.name}
            photoUri={photoUri}
            photoSource={photoSource}
            memo={memo}
            adding={adding}
            onPickPhoto={pickPhoto}
            onMemoChange={setMemo}
            onSubmit={handleAdd}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  sheetTitle: {
    fontSize: 16, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
});
