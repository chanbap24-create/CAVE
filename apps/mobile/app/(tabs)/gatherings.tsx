import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

const categories = ['All', 'Wine', 'Whisky', 'Sake'];

const gatheringData = [
  {
    id: 1, category: 'Wine Tasting',
    title: 'Burgundy Blind Tasting',
    host: { avatar: 'MJ', bg: '#f0e8dd', name: 'wine_master_mj' },
    date: '4.15 (Tue) 19:30', location: 'Le Bar, Cheongdam',
    current: 4, max: 8, price: 80000,
    color: '#e8d5c4', status: 'open',
  },
  {
    id: 2, category: 'Whisky Night',
    title: 'Islay Single Malt Comparison',
    host: { avatar: 'TK', bg: '#d4c5e2', name: 'tokyo_whisky' },
    date: '4.18 (Fri) 20:00', location: 'Bar K, Itaewon',
    current: 2, max: 6, price: 120000,
    color: '#d4c0a0', status: 'open',
  },
  {
    id: 3, category: 'Sake Pairing',
    title: 'Sake x Omakase Pairing',
    host: { avatar: 'YR', bg: '#e0ddd8', name: 'yerin_sake' },
    date: '4.20 (Sun) 18:00', location: 'Sushi Omakase, Apgujeong',
    current: 6, max: 6, price: 150000,
    color: '#e8e4d8', status: 'closed',
  },
];

export default function GatheringsScreen() {
  const [activeCat, setActiveCat] = useState('All');
  const [selectedGathering, setSelectedGathering] = useState<typeof gatheringData[0] | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Gatherings</Text>
        <Pressable style={styles.createBtn}>
          <Text style={styles.createBtnText}>Open</Text>
        </Pressable>
      </View>

      <View style={styles.catRow}>
        {categories.map(c => (
          <Pressable key={c} style={[styles.catBtn, activeCat === c && styles.catBtnActive]} onPress={() => setActiveCat(c)}>
            <Text style={[styles.catBtnText, activeCat === c && styles.catBtnTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {gatheringData.map(g => (
          <View key={g.id} style={styles.card}>
            <View style={[styles.cardImg, { backgroundColor: g.color }]} />
            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{g.category}</Text>
              <Text style={styles.cardTitle}>{g.title}</Text>

              <View style={styles.hostRow}>
                <View style={[styles.hostAvatar, { backgroundColor: g.host.bg }]}>
                  <Text style={styles.hostAvatarText}>{g.host.avatar}</Text>
                </View>
                <Text style={styles.hostName}>{g.host.name}</Text>
                <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>Host</Text></View>
              </View>

              <View style={styles.details}>
                <View style={styles.detailItem}>
                  <Svg width={14} height={14} fill="none" stroke="#999" strokeWidth={1.8} viewBox="0 0 24 24">
                    <Rect x={3} y={4} width={18} height={18} rx={2} />
                    <Line x1={16} y1={2} x2={16} y2={6} /><Line x1={8} y1={2} x2={8} y2={6} />
                    <Line x1={3} y1={10} x2={21} y2={10} />
                  </Svg>
                  <Text style={styles.detailText}>{g.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Svg width={14} height={14} fill="none" stroke="#999" strokeWidth={1.8} viewBox="0 0 24 24">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx={12} cy={10} r={3} />
                  </Svg>
                  <Text style={styles.detailText}>{g.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Svg width={14} height={14} fill="none" stroke="#999" strokeWidth={1.8} viewBox="0 0 24 24">
                    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <Circle cx={9} cy={7} r={4} />
                    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </Svg>
                  <Text style={styles.detailText}>
                    {g.current} / {g.max}{g.status === 'closed' ? ' (Closed)' : ''}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.detailBtn, g.status === 'closed' && styles.detailBtnClosed]}
                onPress={() => g.status === 'open' && setSelectedGathering(g)}
              >
                <Text style={[styles.detailBtnText, g.status === 'closed' && styles.detailBtnTextClosed]}>
                  {g.status === 'closed' ? 'Closed' : 'Details'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedGathering} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selectedGathering && (
              <>
                <View style={[styles.modalImg, { backgroundColor: selectedGathering.color }]} />
                <View style={styles.modalBody}>
                  <Text style={styles.modalCategory}>{selectedGathering.category}</Text>
                  <Text style={styles.modalTitle}>{selectedGathering.title}</Text>

                  <View style={styles.hostRow}>
                    <View style={[styles.hostAvatar, { backgroundColor: selectedGathering.host.bg }]}>
                      <Text style={styles.hostAvatarText}>{selectedGathering.host.avatar}</Text>
                    </View>
                    <Text style={styles.hostName}>{selectedGathering.host.name}</Text>
                    <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>Host</Text></View>
                  </View>

                  <View style={styles.modalDetails}>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Date</Text>
                      <Text style={styles.modalDetailValue}>{selectedGathering.date}</Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Location</Text>
                      <Text style={styles.modalDetailValue}>{selectedGathering.location}</Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Members</Text>
                      <Text style={styles.modalDetailValue}>{selectedGathering.current} / {selectedGathering.max}</Text>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Price</Text>
                      <Text style={styles.modalDetailPrice}>{selectedGathering.price.toLocaleString()}won / person</Text>
                    </View>
                  </View>

                  <Pressable style={styles.applyBtn}>
                    <Text style={styles.applyBtnText}>Apply to Join</Text>
                  </Pressable>
                  <Pressable style={styles.closeBtn} onPress={() => setSelectedGathering(null)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 10, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
  createBtn: {
    position: 'absolute', right: 20, bottom: 10,
    backgroundColor: '#7b2d4e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  catRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#efefef', backgroundColor: '#fff',
  },
  catBtnActive: { backgroundColor: '#222', borderColor: '#222' },
  catBtnText: { fontSize: 13, fontWeight: '500', color: '#999' },
  catBtnTextActive: { color: '#fff' },

  // Card
  card: { borderBottomWidth: 8, borderBottomColor: '#f5f5f5' },
  cardImg: { width: '100%', height: 140 },
  cardBody: { padding: 14, paddingHorizontal: 20 },
  cardCategory: {
    fontSize: 11, fontWeight: '600', color: '#7b2d4e',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 10 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  hostAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarText: { fontSize: 10, fontWeight: '600', color: '#888' },
  hostName: { fontSize: 13, fontWeight: '600', color: '#222' },
  hostBadge: {
    backgroundColor: '#f7f0f3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  hostBadgeText: { fontSize: 10, fontWeight: '600', color: '#7b2d4e' },

  details: { gap: 6, marginBottom: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#666' },

  detailBtn: {
    backgroundColor: '#7b2d4e', padding: 12, borderRadius: 10, alignItems: 'center',
  },
  detailBtnClosed: { backgroundColor: '#f0f0f0' },
  detailBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  detailBtnTextClosed: { color: '#bbb' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', overflow: 'hidden',
  },
  modalImg: { width: '100%', height: 160 },
  modalBody: { padding: 24 },
  modalCategory: {
    fontSize: 11, fontWeight: '600', color: '#7b2d4e',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 14 },
  modalDetails: {
    marginTop: 16, backgroundColor: '#fafafa', borderRadius: 12, padding: 16, gap: 12,
  },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalDetailLabel: { fontSize: 13, color: '#999' },
  modalDetailValue: { fontSize: 13, fontWeight: '600', color: '#222' },
  modalDetailPrice: { fontSize: 15, fontWeight: '700', color: '#7b2d4e' },
  applyBtn: {
    backgroundColor: '#7b2d4e', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeBtn: {
    padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  closeBtnText: { color: '#999', fontSize: 14, fontWeight: '500' },
});
