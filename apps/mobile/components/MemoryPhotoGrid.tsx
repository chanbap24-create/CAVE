import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { VideoPlayer } from '@/components/VideoPlayer';
import type { CollectionPhoto } from '@/lib/hooks/useCollectionPhotos';

interface Props {
  photos: CollectionPhoto[];
  /** True when the viewer can add / delete photos (collection owner). */
  canEdit: boolean;
  uploading: boolean;
  /** 0~100. 비디오 업로드 중일 때만 의미 있음. */
  uploadProgress?: number;
  onAdd: () => void;
  onDelete: (photoId: number) => void;
  onOpen?: (photo: CollectionPhoto) => void;
}

/**
 * 3-column grid of memory photos + videos. 단일 "+" 타일이 그리드 첫 칸에
 * 들어가 OS picker (사진/비디오 통합) 를 호출 — Instagram 패턴.
 *
 * 빈 상태에선 grid 대신 풀폭 한 줄 CTA 로 발견성 보강.
 *
 * 비디오는 Mux signed playback 이라 VideoPlayer 가 토큰을 자동 fetch.
 * 토큰 캐시는 useMuxPlaybackToken 내부 — 같은 grid 안의 동일 비디오면 한 번만 fetch.
 */
export function MemoryPhotoGrid({
  photos, canEdit, uploading, uploadProgress, onAdd, onDelete, onOpen,
}: Props) {
  const { width } = useWindowDimensions();
  const GAP = 6;
  const COLS = 3;
  const tileSize = (width - 40 - GAP * (COLS - 1)) / COLS;

  function confirmDelete(photoId: number) {
    Alert.alert('이 항목을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(photoId) },
    ]);
  }

  // 빈 상태 (사진·비디오 0개) — owner 면 풀폭 CTA, 아니면 안내문.
  if (photos.length === 0) {
    return (
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.heading}>Memories</Text>
        </View>
        {canEdit ? (
          <Pressable
            style={[styles.emptyCta, uploading && { opacity: 0.5 }]}
            onPress={onAdd}
            disabled={uploading}
          >
            <Text style={styles.emptyCtaText}>
              {uploading ? '업로드중…' : '📷  마셨을 때의 사진·비디오로 기억 남기기'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.empty}>아직 공유된 추억이 없어요.</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Memories ({photos.length})</Text>
      </View>

      <View style={[styles.grid, { gap: GAP }]}>
        {/* "+" 타일 — 그리드 리듬 안에 흡수된 단일 진입점. owner 만 노출. */}
        {canEdit && (
          <Pressable
            onPress={onAdd}
            disabled={uploading}
            style={[
              styles.addTile,
              { width: tileSize, height: tileSize },
              uploading && { opacity: 0.5 },
            ]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#7b2d4e" />
            ) : (
              <Text style={styles.addTileSign}>＋</Text>
            )}
            {uploading && uploadProgress != null && uploadProgress > 0 && (
              <Text style={styles.addTileProgress}>{Math.floor(uploadProgress)}%</Text>
            )}
          </Pressable>
        )}

        {photos.map((p) => (
          <Pressable
            key={p.id}
            style={{ width: tileSize, height: tileSize }}
            onPress={() => onOpen?.(p)}
            onLongPress={() => canEdit && confirmDelete(p.id)}
          >
            {p.video_playback_id ? (
              <View style={[styles.photo, { width: tileSize, height: tileSize, overflow: 'hidden' }]}>
                <VideoPlayer playbackId={p.video_playback_id} muted loop />
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>▶</Text>
                </View>
              </View>
            ) : (
              <Image
                source={p.photo_url ?? ''}
                style={[styles.photo, { width: tileSize, height: tileSize }]}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            )}
          </Pressable>
        ))}
      </View>

      {canEdit && (
        <Text style={styles.hint}>길게 눌러 삭제</Text>
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

  addTile: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#ddd', borderRadius: 8,
    backgroundColor: '#fafafa',
    alignItems: 'center', justifyContent: 'center',
  },
  addTileSign: { fontSize: 26, color: '#7b2d4e', fontWeight: '300', lineHeight: 30 },
  addTileProgress: { fontSize: 9, color: '#7b2d4e', marginTop: 4 },

  emptyCta: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 18, alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  emptyCtaText: { fontSize: 13, color: '#7b2d4e', fontWeight: '600' },

  photo: { borderRadius: 8, backgroundColor: '#f0f0f0' },
  videoBadge: {
    position: 'absolute', right: 6, top: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  videoBadgeText: { color: '#fff', fontSize: 9 },

  empty: { fontSize: 12, color: '#bbb', fontStyle: 'italic' },
  hint: { fontSize: 11, color: '#bbb', marginTop: 8 },
});
