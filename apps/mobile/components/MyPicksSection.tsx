import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import type { MyPick } from '@/lib/hooks/useMyPicks';
import { AddPickSheet } from '@/components/AddPickSheet';

interface Props {
  picks: MyPick[];
  editable?: boolean;
  onAdd?: (wineId: number, photoUrl: string, memo: string) => Promise<void>;
  onRemove?: (pickId: number) => Promise<void>;
  wines?: any[]; // collection wines for selection
}

export function MyPicksSection({ picks, editable = false, onAdd, onRemove, wines = [] }: Props) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 픽</Text>
        {editable && picks.length < 5 && (
          <Pressable onPress={() => setShowAdd(true)}>
            <Text style={styles.addText}>+ 추가</Text>
          </Pressable>
        )}
      </View>

      {picks.length === 0 ? (
        <View style={styles.emptyRow}>
          {editable ? (
            <Pressable style={styles.emptyCard} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyPlus}>+</Text>
              <Text style={styles.emptyLabel}>인생 와인 추가</Text>
            </Pressable>
          ) : (
            <Text style={styles.emptyText}>아직 픽이 없어요</Text>
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
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
                <Image
                  source={pick.photo_url}
                  style={styles.pickImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
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

      {editable && onAdd && (
        <AddPickSheet
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onAdd={onAdd}
          wines={wines}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 6,
  },
  title: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 },
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
});
