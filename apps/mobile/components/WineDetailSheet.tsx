import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getCategoryLabel } from '@/lib/constants/drinkCategories';

export interface WineDetailInput {
  name: string;
  name_ko?: string | null;
  producer?: string | null;
  category?: string | null;
  region?: string | null;
  country?: string | null;
  vintage_year?: number | null;
  image_url?: string | null;
  /** Photo the contributor actually took — takes priority over image_url. */
  photo_url?: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  wine: WineDetailInput | null;
  /** Free-form label, e.g. "Host" or "@alice". */
  broughtBy?: string;
}

/**
 * Full-info wine sheet. Used wherever the compact wine-card format truncates
 * the name (applicant card, lineup row). Keeps the reader focused on one
 * bottle rather than the surrounding list.
 */
export function WineDetailSheet({ visible, onClose, wine, broughtBy }: Props) {
  if (!wine) return null;

  const displayPhoto = wine.photo_url ?? wine.image_url ?? null;
  const locale = [wine.region, wine.country].filter(Boolean).join(', ');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {displayPhoto ? (
            <Image
              source={displayPhoto}
              style={styles.photo}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]} />
          )}

          {wine.producer ? <Text style={styles.producer}>{wine.producer}</Text> : null}
          <Text style={styles.name}>{wine.name}</Text>
          {wine.name_ko ? <Text style={styles.nameKo}>{wine.name_ko}</Text> : null}

          <View style={styles.metaRow}>
            {wine.vintage_year != null && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{wine.vintage_year}</Text>
              </View>
            )}
            {wine.category ? (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{getCategoryLabel(wine.category)}</Text>
              </View>
            ) : null}
          </View>

          {locale ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Region</Text>
              <Text style={styles.detailValue}>{locale}</Text>
            </View>
          ) : null}

          {broughtBy ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brought by</Text>
              <Text style={styles.detailValue}>{broughtBy}</Text>
            </View>
          ) : null}
        </ScrollView>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 30, maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  scroll: { padding: 20, paddingTop: 12 },
  photo: {
    width: '100%', aspectRatio: 1,
    borderRadius: 16, backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  photoPlaceholder: { backgroundColor: '#f0f0f0' },
  producer: {
    fontSize: 12, fontWeight: '700', color: '#7b2d4e',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#222', lineHeight: 26 },
  nameKo: { fontSize: 14, color: '#666', marginTop: 4 },

  metaRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  metaPill: { backgroundColor: '#f7f0f3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  metaPillText: { fontSize: 12, fontWeight: '600', color: '#7b2d4e' },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  detailLabel: { fontSize: 13, color: '#999' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#222', flex: 1, textAlign: 'right', marginLeft: 12 },

  closeBtn: {
    marginHorizontal: 20, marginTop: 8,
    backgroundColor: '#222', padding: 14, borderRadius: 12, alignItems: 'center',
  },
  closeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
