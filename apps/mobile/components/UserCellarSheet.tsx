import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { UserCellarSection } from '@/components/UserCellarSection';

interface Props {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
}

/**
 * Bottom-sheet popup that shows a user's public cellar inline, without
 * navigating away. Useful from list rows (gathering applicants, approved
 * members, etc.) so the viewer can peek at the other person's collection
 * + continue where they were.
 *
 * Fetches the target user's profile + public wines on open. Reuses the
 * existing UserCellarSection (like/comment counts batched via
 * useCollectionSocial) so the sheet doesn't duplicate query logic.
 */
export function UserCellarSheet({ visible, userId, onClose }: Props) {
  const [profile, setProfile] = useState<{
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    collection_count: number;
  } | null>(null);
  const [wines, setWines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId) { setProfile(null); setWines([]); return; }
    let aborted = false;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: ws }] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, display_name, avatar_url, collection_count')
          .eq('id', userId)
          .single(),
        supabase
          .from('collections')
          .select('id, photo_url, created_at, wine:wines(id, name, producer, category, region, country, vintage_year, image_url)')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false }),
      ]);
      if (aborted) return;
      setProfile(p ?? null);
      setWines(ws ?? []);
      setLoading(false);
    })();
    return () => { aborted = true; };
  }, [visible, userId]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          {profile?.avatar_url ? (
            <Image source={profile.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {(profile?.display_name?.[0] ?? profile?.username?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.display_name || profile?.username || '—'}
            </Text>
            <Text style={styles.meta}>{profile?.collection_count ?? 0} bottles</Text>
          </View>
        </View>

        <ScrollView style={styles.body}>
          {!userId || loading ? (
            <Text style={styles.empty}>Loading…</Text>
          ) : wines.length === 0 ? (
            <Text style={styles.empty}>공개된 셀러가 비어있어요.</Text>
          ) : (
            <UserCellarSection ownerId={userId} wines={wines} />
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: '10%',
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#888' },
  name: { fontSize: 16, fontWeight: '700', color: '#222' },
  meta: { fontSize: 12, color: '#999', marginTop: 2 },
  body: { flex: 1 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 40, fontSize: 13 },
});
