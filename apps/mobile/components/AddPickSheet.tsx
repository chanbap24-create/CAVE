import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/utils/imageUpload';

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

  const filteredWines = wineSearch.length >= 1
    ? wines.filter(w => {
        const name = w.wine?.name || w.name || '';
        return name.toLowerCase().includes(wineSearch.toLowerCase());
      }).slice(0, 5)
    : [];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Add to My Picks</Text>

        {!selectedWine ? (
          <View style={styles.sheetBody}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your collection..."
              placeholderTextColor="#bbb"
              value={wineSearch}
              onChangeText={setWineSearch}
              autoFocus
            />
            {filteredWines.map((w: any) => (
              <Pressable
                key={w.wine_id || w.id}
                style={styles.wineItem}
                onPress={() => setSelectedWine(w)}
              >
                <Text style={styles.wineName}>{w.wine?.name || w.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.sheetBody}>
            <Text style={styles.selectedName}>{selectedWine.wine?.name || selectedWine.name}</Text>

            <Pressable style={styles.photoBtn} onPress={pickPhoto}>
              {photoUri ? (
                <View>
                  <Image
                    source={photoUri}
                    style={styles.photoPreview}
                    contentFit="cover"
                    transition={100}
                  />
                  <Text style={styles.photoHint}>
                    {photoSource === 'cellar'
                      ? 'Using cellar photo · Tap to change'
                      : 'Tap to change photo'}
                  </Text>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              style={styles.memoInput}
              placeholder='"인생 와인", "생일 선물" ...'
              placeholderTextColor="#bbb"
              value={memo}
              onChangeText={setMemo}
              maxLength={50}
            />

            <Pressable
              style={[styles.submitBtn, (!photoUri || adding) && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!photoUri || adding}
            >
              <Text style={styles.submitText}>{adding ? 'Adding...' : 'Add Pick'}</Text>
            </Pressable>
          </View>
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
  sheetBody: { padding: 20 },

  searchInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 10, paddingLeft: 16, fontSize: 14, marginBottom: 8,
  },
  wineItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  wineName: { fontSize: 14, fontWeight: '500', color: '#222' },

  selectedName: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 16 },
  photoBtn: { marginBottom: 16 },
  photoPreview: { width: '100%', height: 200, borderRadius: 12 },
  photoPlaceholder: {
    width: '100%', height: 200, borderRadius: 12,
    backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholderText: { fontSize: 14, color: '#bbb' },
  photoHint: { fontSize: 11, color: '#7b2d4e', textAlign: 'center', marginTop: 6, fontWeight: '500' },
  memoInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 16,
  },
  submitBtn: { backgroundColor: '#7b2d4e', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
