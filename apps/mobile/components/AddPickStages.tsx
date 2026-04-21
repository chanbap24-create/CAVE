import React from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';

// ---------- Stage 1: pick a wine from the cellar ----------

interface WineStepProps {
  wines: any[];
  search: string;
  onSearchChange: (s: string) => void;
  onSelect: (wine: any) => void;
}

export function PickWineStep({ wines, search, onSearchChange, onSelect }: WineStepProps) {
  // No artificial cap on results — the list is scrollable, so let the user
  // see everything they own. Slicing hid bottles at the bottom of big cellars.
  const filtered = search.length >= 1
    ? wines.filter(w => {
        const name = w.wine?.name || w.name || '';
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : wines;

  return (
    <View style={styles.body}>
      {/* No autoFocus — opening the keyboard immediately shrinks the
          wine list to a narrow band and forces scrolling before a pick.
          Users scan visually first, tap the input only if they need to
          narrow down. */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search your collection..."
        placeholderTextColor="#bbb"
        value={search}
        onChangeText={onSearchChange}
      />
      {filtered.length === 0 ? (
        <Text style={styles.empty}>No bottles in your cellar yet</Text>
      ) : (
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {filtered.map((w: any) => (
            <WineRow key={w.wine_id || w.id} w={w} onPress={() => onSelect(w)} />
          ))}
          <View style={{ height: 12 }} />
        </ScrollView>
      )}
    </View>
  );
}

function WineRow({ w, onPress }: { w: any; onPress: () => void }) {
  return (
    <Pressable style={styles.wineItem} onPress={onPress}>
      {w.photo_url ? (
        <Image
          source={w.photo_url}
          style={styles.wineThumb}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.wineThumb, { backgroundColor: '#f0f0f0' }]} />
      )}
      <View style={styles.wineInfo}>
        <Text style={styles.wineName} numberOfLines={1}>
          {w.wine?.name || w.name}
        </Text>
        <Text style={styles.wineMeta} numberOfLines={1}>
          {[w.wine?.region, w.wine?.country].filter(Boolean).join(', ')}
          {w.wine?.vintage_year ? ` · ${w.wine.vintage_year}` : ''}
        </Text>
      </View>
      {w.photo_url && <Text style={styles.wineBadge}>📷</Text>}
    </Pressable>
  );
}

// ---------- Stage 2: attach photo + memo ----------

interface PhotoStepProps {
  wineName: string;
  photoUri: string | null;
  photoSource: 'cellar' | 'custom' | null;
  memo: string;
  adding: boolean;
  onPickPhoto: () => void;
  onMemoChange: (m: string) => void;
  onSubmit: () => void;
}

export function PickPhotoStep(p: PhotoStepProps) {
  const hint = p.photoSource === 'cellar' ? 'Using cellar photo · Tap to change' : 'Tap to change photo';
  return (
    <View style={styles.body}>
      <Text style={styles.selectedName}>{p.wineName}</Text>

      <Pressable style={styles.photoBtn} onPress={p.onPickPhoto}>
        {p.photoUri ? (
          <View>
            <Image source={p.photoUri} style={styles.photoPreview} contentFit="cover" transition={100} />
            <Text style={styles.photoHint}>{hint}</Text>
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
        value={p.memo}
        onChangeText={p.onMemoChange}
        maxLength={50}
      />

      <Pressable
        style={[styles.submitBtn, (!p.photoUri || p.adding) && { opacity: 0.5 }]}
        onPress={p.onSubmit}
        disabled={!p.photoUri || p.adding}
      >
        <Text style={styles.submitText}>{p.adding ? 'Adding...' : 'Add Pick'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, flexShrink: 1 },
  // Cap the scrollable list so keyboard + sheet chrome still fit on screen.
  list: { maxHeight: 360 },

  searchInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 10, paddingLeft: 16, fontSize: 14, marginBottom: 8,
  },
  wineItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  wineThumb: { width: 44, height: 44, borderRadius: 8 },
  wineInfo: { flex: 1 },
  wineName: { fontSize: 14, fontWeight: '600', color: '#222' },
  wineMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  wineBadge: { fontSize: 14 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 32, fontSize: 13 },

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
