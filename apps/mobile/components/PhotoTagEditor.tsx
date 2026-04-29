import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { ScreenHeader } from '@/components/ScreenHeader';
import { sanitizeSearch } from '@/lib/utils/searchUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  postId: number;
  imageUrl: string;
  onTagAdded: () => void;
}

export function PhotoTagEditor({ visible, onClose, postId, imageUrl, onTagAdded }: Props) {
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);
  const [tagType, setTagType] = useState<'user' | 'wine' | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  function handleImageTap(e: GestureResponderEvent) {
    const { locationX, locationY } = e.nativeEvent;
    const x = locationX / imageSize.width;
    const y = locationY / imageSize.height;
    setTapPosition({ x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.05, Math.min(0.95, y)) });
    setTagType(null);
    setSearch('');
    setResults([]);
  }

  async function searchItems(query: string) {
    setSearch(query);
    if (query.length < 1) { setResults([]); return; }

    const q = sanitizeSearch(query);
    if (!q) { setResults([]); return; }
    if (tagType === 'user') {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(5);
      if (data) setResults(data);
    } else {
      const { data } = await supabase
        .from('wines')
        .select('id, name, name_ko')
        .or(`name.ilike.%${q}%,name_ko.ilike.%${q}%`)
        .limit(5);
      if (data) setResults(data);
    }
  }

  async function selectItem(item: any) {
    if (!tapPosition) return;

    await supabase.from('photo_tags').insert({
      post_id: postId,
      tag_type: tagType,
      user_id: tagType === 'user' ? item.id : null,
      wine_id: tagType === 'wine' ? item.id : null,
      x_position: tapPosition.x,
      y_position: tapPosition.y,
    });

    // Notify tagged user
    if (tagType === 'user') {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post && post.user_id !== item.id) {
        await supabase.from('notifications').insert({
          user_id: item.id,
          type: 'mention',
          actor_id: post.user_id,
          reference_id: postId.toString(),
          reference_type: 'post',
          body: 'tagged you in a photo',
        });
      }
    }

    setTapPosition(null);
    setTagType(null);
    setSearch('');
    setResults([]);
    onTagAdded();
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <ScreenHeader
          title={<Text style={styles.title}>Tag Photo</Text>}
          left={<Pressable onPress={onClose} hitSlop={8}><Text style={styles.done}>Done</Text></Pressable>}
        />

        <Text style={styles.hint}>Tap on the photo to add a tag</Text>

        <View style={styles.imageContainer}>
          <Pressable onPress={handleImageTap}>
            <Image
              source={imageUrl}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setImageSize({ width, height });
              }}
            />
          </Pressable>

          {tapPosition && (
            <View style={[styles.marker, { left: `${tapPosition.x * 100}%`, top: `${tapPosition.y * 100}%` }]}>
              <View style={styles.markerDot} />
            </View>
          )}
        </View>

        {/* Type selection */}
        {tapPosition && !tagType && (
          <View style={styles.typeRow}>
            <Pressable style={styles.typeBtn} onPress={() => setTagType('user')}>
              <Text style={styles.typeBtnText}>Tag Person</Text>
            </Pressable>
            <Pressable style={styles.typeBtn} onPress={() => setTagType('wine')}>
              <Text style={styles.typeBtnText}>Tag Drink</Text>
            </Pressable>
          </View>
        )}

        {/* Search */}
        {tagType && (
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder={tagType === 'user' ? 'Search people...' : 'Search drinks...'}
              placeholderTextColor="#bbb"
              value={search}
              onChangeText={searchItems}
              autoFocus
            />
            <ScrollView style={styles.resultList}>
              {results.map(item => (
                <Pressable key={item.id} style={styles.resultItem} onPress={() => selectItem(item)}>
                  <Text style={styles.resultName}>
                    {tagType === 'user' ? `@${item.username}` : item.name}
                  </Text>
                  {tagType === 'user' && item.display_name && (
                    <Text style={styles.resultSub}>{item.display_name}</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  done: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },
  title: { fontSize: 16, fontWeight: '700', color: '#222' },
  hint: { fontSize: 12, color: '#999', textAlign: 'center', paddingVertical: 8 },

  imageContainer: { width: '100%', aspectRatio: 1, position: 'relative' },
  image: { width: '100%', height: '100%' },
  marker: {
    position: 'absolute',
    transform: [{ translateX: -8 }, { translateY: -8 }],
  },
  markerDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#7b2d4e', borderWidth: 2, borderColor: '#fff',
  },

  typeRow: { flexDirection: 'row', gap: 12, padding: 16, justifyContent: 'center' },
  typeBtn: {
    backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
  },
  typeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  searchSection: { padding: 16, flex: 1 },
  searchInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 10, paddingLeft: 16, fontSize: 14, marginBottom: 8,
  },
  resultList: { flex: 1 },
  resultItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  resultName: { fontSize: 14, fontWeight: '600', color: '#222' },
  resultSub: { fontSize: 12, color: '#999', marginTop: 2 },
});
