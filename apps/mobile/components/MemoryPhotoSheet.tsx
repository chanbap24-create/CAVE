import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet, Alert,
  TextInput, FlatList, GestureResponderEvent, useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useCollectionPhotoTags } from '@/lib/hooks/useCollectionPhotoTags';
import type { CollectionPhoto } from '@/lib/hooks/useCollectionPhotos';

interface Props {
  visible: boolean;
  photo: CollectionPhoto | null;
  /** True when the viewer is the collection owner — controls add/remove tag. */
  canEdit: boolean;
  onClose: () => void;
}

interface UserHit { id: string; username: string; display_name: string | null; avatar_url: string | null; }

/**
 * Full-bleed memory photo viewer with friend tagging.
 *
 * Non-owner: view photo + see existing tag dots + tap a dot to reveal
 *            that tagged user's name.
 * Owner   : additionally tap empty area to drop a new tag, pick a
 *           profile from the search results, or long-press an existing
 *           tag to remove it.
 */
export function MemoryPhotoSheet({ visible, photo, canEdit, onClose }: Props) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const photoSize = width; // square photo = screen width

  const { tags, addTag, removeTag } = useCollectionPhotoTags(photo?.id ?? null);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserHit[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null); // user_id whose label is shown

  // Reset per-open state.
  useEffect(() => {
    if (!visible) { setPendingPosition(null); setSearch(''); setResults([]); setActiveTag(null); }
  }, [visible]);

  // User search — lightweight ilike; results capped at 6.
  useEffect(() => {
    if (!pendingPosition) return;
    const q = search.trim();
    if (!q) { setResults([]); return; }
    let aborted = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(6);
      if (!aborted) setResults((data ?? []) as UserHit[]);
    })();
    return () => { aborted = true; };
  }, [search, pendingPosition]);

  function handlePhotoTap(e: GestureResponderEvent) {
    if (!canEdit) { setActiveTag(null); return; }
    const { locationX, locationY } = e.nativeEvent;
    const x = Math.max(0.04, Math.min(0.96, locationX / photoSize));
    const y = Math.max(0.04, Math.min(0.96, locationY / photoSize));
    setPendingPosition({ x, y });
    setActiveTag(null);
  }

  async function chooseUser(u: UserHit) {
    if (!pendingPosition) return;
    const ok = await addTag(u.id, pendingPosition.x, pendingPosition.y);
    if (ok) {
      setPendingPosition(null);
      setSearch('');
      setResults([]);
    }
  }

  function confirmRemove(taggedUserId: string) {
    Alert.alert('태그를 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeTag(taggedUserId) },
    ]);
  }

  if (!photo) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <View style={[styles.photoWrap, { width: photoSize, height: photoSize }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handlePhotoTap}>
            <Image
              source={photo.photo_url}
              style={[styles.photo, { width: photoSize, height: photoSize }]}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </Pressable>

          {/* Existing tag dots */}
          {tags.map((t) => (
            <View
              key={t.tagged_user_id}
              pointerEvents="box-none"
              style={[styles.tagWrap, {
                left: t.x * photoSize - 12, top: t.y * photoSize - 12,
              }]}
            >
              <Pressable
                style={styles.tagDot}
                onPress={() => setActiveTag(activeTag === t.tagged_user_id ? null : t.tagged_user_id)}
                onLongPress={() => canEdit && confirmRemove(t.tagged_user_id)}
                hitSlop={6}
              />
              {activeTag === t.tagged_user_id && (
                <View style={styles.tagLabel}>
                  <Text style={styles.tagLabelText}>
                    @{t.profile?.username ?? '—'}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Pending position marker while choosing a user */}
          {pendingPosition && (
            <View
              pointerEvents="none"
              style={[styles.pendingDot, {
                left: pendingPosition.x * photoSize - 10,
                top: pendingPosition.y * photoSize - 10,
              }]}
            />
          )}
        </View>

        {/* Pick-user panel */}
        {pendingPosition ? (
          <View style={styles.pickerPanel}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>태그할 사용자 검색</Text>
              <Pressable onPress={() => { setPendingPosition(null); setSearch(''); setResults([]); }}>
                <Text style={styles.pickerCancel}>취소</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.pickerInput}
              value={search}
              onChangeText={setSearch}
              placeholder="username 또는 이름"
              placeholderTextColor="#bbb"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FlatList
              data={results}
              keyExtractor={(it) => it.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 240 }}
              renderItem={({ item }) => (
                <Pressable style={styles.resultRow} onPress={() => chooseUser(item)}>
                  {item.avatar_url ? (
                    <Image source={item.avatar_url} style={styles.resultAvatar} contentFit="cover" cachePolicy="memory-disk" />
                  ) : (
                    <View style={[styles.resultAvatar, { backgroundColor: '#e0e0e0' }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{item.display_name || item.username}</Text>
                    <Text style={styles.resultUsername}>@{item.username}</Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                search.trim() ? <Text style={styles.noResult}>검색 결과가 없어요</Text> : null
              }
            />
          </View>
        ) : (
          <View style={styles.hintPanel}>
            <Text style={styles.hint}>
              {canEdit
                ? '사진 아무 곳이나 탭하여 친구 태그 · 기존 태그 길게 눌러 삭제'
                : tags.length > 0
                  ? '태그된 친구 보기 — 점을 탭해주세요.'
                  : '태그된 친구가 없어요.'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 52, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '400' },

  photoWrap: { position: 'relative' },
  photo: {},

  tagWrap: { position: 'absolute', alignItems: 'center' },
  tagDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#7b2d4e',
  },
  tagLabel: {
    marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  tagLabelText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  pendingDot: {
    position: 'absolute',
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 3, borderColor: '#fff',
  },

  pickerPanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16, paddingBottom: 28, gap: 10,
  },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
  pickerCancel: { fontSize: 13, fontWeight: '600', color: '#999' },
  pickerInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 10, fontSize: 14, backgroundColor: '#fafafa',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
  },
  resultAvatar: { width: 32, height: 32, borderRadius: 16 },
  resultName: { fontSize: 13, fontWeight: '600', color: '#222' },
  resultUsername: { fontSize: 11, color: '#999', marginTop: 1 },
  noResult: { textAlign: 'center', color: '#bbb', paddingVertical: 20, fontSize: 12 },

  hintPanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 14, paddingBottom: 26, backgroundColor: 'rgba(0,0,0,0.6)',
  },
  hint: { color: '#fff', fontSize: 12, textAlign: 'center' },
});
