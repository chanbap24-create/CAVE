import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import type { CollectionPhoto } from '@/lib/hooks/useCollectionPhotos';

interface Props {
  photos: CollectionPhoto[];
  /** True when the viewer can add / delete photos (collection owner). */
  canEdit: boolean;
  uploading: boolean;
  onAdd: () => void;
  onDelete: (photoId: number) => void;
  onOpen?: (photo: CollectionPhoto) => void;
}

/**
 * 3-column grid of memory photos. Shows a dashed "+ 사진 추가" tile at
 * the front of the list when the owner is viewing; tap deletes via
 * long-press with a confirm dialog. Opening a photo (full view / tag
 * edit) is deferred to Phase 3 — onOpen is plumbed through but parent
 * may noop for now.
 */
export function MemoryPhotoGrid({
  photos, canEdit, uploading, onAdd, onDelete, onOpen,
}: Props) {
  const { width } = useWindowDimensions();
  const GAP = 6;
  const COLS = 3;
  const tileSize = (width - 40 - GAP * (COLS - 1)) / COLS;

  function confirmDelete(photoId: number) {
    Alert.alert('이 사진을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(photoId) },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Memories{photos.length > 0 ? ` (${photos.length})` : ''}</Text>
      </View>

      {/* Small dashed bar to add a photo, matching the TastingNote empty
          prompt pattern. Full-width → doesn't consume a grid cell; photos
          stay aligned in a clean 3-column strip below. */}
      {canEdit && (
        <Pressable
          style={[styles.addBar, uploading && { opacity: 0.5 }]}
          onPress={onAdd}
          disabled={uploading}
        >
          <Text style={styles.addBarText}>
            {uploading ? '업로드중…' : '+ 사진 추가'}
          </Text>
        </Pressable>
      )}

      {photos.length > 0 && (
        <View style={[styles.grid, { gap: GAP, marginTop: canEdit ? 10 : 0 }]}>
          {photos.map((p) => (
            <Pressable
              key={p.id}
              style={{ width: tileSize, height: tileSize }}
              onPress={() => onOpen?.(p)}
              onLongPress={() => canEdit && confirmDelete(p.id)}
            >
              <Image
                source={p.photo_url}
                style={[styles.photo, { width: tileSize, height: tileSize }]}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </Pressable>
          ))}
        </View>
      )}

      {photos.length === 0 && !canEdit && (
        <Text style={styles.empty}>아직 공유된 추억이 없어요.</Text>
      )}
      {canEdit && photos.length === 0 && (
        <Text style={styles.hint}>마셨을 때의 사진을 추가해보세요 · 길게 누르면 삭제</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  header: { marginBottom: 12 },
  heading: { fontSize: 13, fontWeight: '700', color: '#222', textTransform: 'uppercase', letterSpacing: 0.6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  addBar: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addBarText: { fontSize: 13, color: '#7b2d4e', fontWeight: '600' },

  photo: { borderRadius: 8, backgroundColor: '#f0f0f0' },

  empty: { fontSize: 12, color: '#bbb', marginTop: 10, fontStyle: 'italic' },
  hint: { fontSize: 11, color: '#bbb', marginTop: 8 },
});
