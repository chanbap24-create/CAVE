import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Modal, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { MyPick } from '@/lib/hooks/useMyPicks';

interface Props {
  picks: MyPick[];
  editable?: boolean;
  onAdd?: (wineId: number, photoUrl: string, memo: string) => Promise<void>;
  onRemove?: (pickId: number) => Promise<void>;
  wines?: any[]; // collection wines for selection
}

export function MyPicksSection({ picks, editable = false, onAdd, onRemove, wines = [] }: Props) {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [wineSearch, setWineSearch] = useState('');
  const [adding, setAdding] = useState(false);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function handleAdd() {
    if (!selectedWine || !photoUri || !user) return;
    setAdding(true);

    // Upload photo
    let photoUrl = photoUri;
    try {
      const ext = photoUri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${user.id}/picks/${Date.now()}.${ext}`;
      const response = await fetch(photoUri);
      const arrayBuffer = await response.arrayBuffer();
      const { error } = await supabase.storage.from('post-images').upload(fileName, arrayBuffer, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      });
      if (!error) {
        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }
    } catch {}

    await onAdd?.(selectedWine.wine_id || selectedWine.id, photoUrl, memo);
    setShowAdd(false);
    setSelectedWine(null);
    setPhotoUri(null);
    setMemo('');
    setAdding(false);
  }

  const filteredWines = wineSearch.length >= 1
    ? wines.filter(w => {
        const name = w.wine?.name || w.name || '';
        return name.toLowerCase().includes(wineSearch.toLowerCase());
      }).slice(0, 5)
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Picks</Text>
        {editable && picks.length < 5 && (
          <Pressable onPress={() => setShowAdd(true)}>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        )}
      </View>

      {picks.length === 0 ? (
        <View style={styles.emptyRow}>
          {editable ? (
            <Pressable style={styles.emptyCard} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyPlus}>+</Text>
              <Text style={styles.emptyLabel}>Add your best</Text>
            </Pressable>
          ) : (
            <Text style={styles.emptyText}>No picks yet</Text>
          )}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {picks.map(pick => (
            <Pressable
              key={pick.id}
              style={styles.pickCard}
              onLongPress={() => {
                if (editable) {
                  Alert.alert('Remove', 'Remove this pick?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => onRemove?.(pick.id) },
                  ]);
                }
              }}
            >
              {pick.photo_url ? (
                <Image source={{ uri: pick.photo_url }} style={styles.pickImage} />
              ) : (
                <View style={[styles.pickImage, { backgroundColor: '#f0f0f0' }]} />
              )}
              <View style={styles.pickOverlay}>
                <Text style={styles.pickName} numberOfLines={1}>{pick.wine?.name || ''}</Text>
                {pick.memo && <Text style={styles.pickMemo} numberOfLines={1}>"{pick.memo}"</Text>}
              </View>
            </Pressable>
          ))}
          {editable && picks.length < 5 && (
            <Pressable style={styles.addCard} onPress={() => setShowAdd(true)}>
              <Text style={styles.addCardPlus}>+</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Add Pick Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <Pressable style={styles.backdrop} onPress={() => setShowAdd(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add to My Picks</Text>

          {/* Step 1: Select wine from collection */}
          {!selectedWine && (
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
                <Pressable key={w.wine_id || w.id} style={styles.wineItem} onPress={() => setSelectedWine(w)}>
                  <Text style={styles.wineName}>{w.wine?.name || w.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Step 2: Add photo + memo */}
          {selectedWine && (
            <View style={styles.sheetBody}>
              <Text style={styles.selectedName}>{selectedWine.wine?.name || selectedWine.name}</Text>

              <Pressable style={styles.photoBtn} onPress={pickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#222' },
  addText: { fontSize: 13, fontWeight: '600', color: '#7b2d4e' },

  emptyRow: { paddingHorizontal: 20 },
  emptyCard: {
    width: 100, height: 130, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#ddd', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyPlus: { fontSize: 24, color: '#ccc' },
  emptyLabel: { fontSize: 10, color: '#bbb', marginTop: 4 },
  emptyText: { fontSize: 13, color: '#bbb' },

  pickCard: {
    width: 120, height: 160, borderRadius: 12,
    overflow: 'hidden', position: 'relative',
  },
  pickImage: { width: '100%', height: '100%' },
  pickOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickName: { fontSize: 11, fontWeight: '600', color: '#fff' },
  pickMemo: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontStyle: 'italic' },

  addCard: {
    width: 60, height: 160, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#ddd', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addCardPlus: { fontSize: 20, color: '#ccc' },

  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#222', textAlign: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#efefef' },
  sheetBody: { padding: 20 },

  searchInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10, paddingLeft: 16, fontSize: 14, marginBottom: 8 },
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
  memoInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 16,
  },
  submitBtn: { backgroundColor: '#7b2d4e', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
