import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import type { MyPick } from '@/lib/hooks/useMyPicks';
import { AddPickSheet } from '@/components/AddPickSheet';
import { PickPolaroidCard, PickPolaroidAddTile } from '@/components/PickPolaroidCard';

interface Props {
  picks: MyPick[];
  editable?: boolean;
  onAdd?: (wineId: number, photoUrl: string, memo: string) => Promise<void>;
  onRemove?: (pickId: number) => Promise<void>;
  wines?: any[]; // collection wines for selection
}

const MAX_PICKS = 5;

/**
 * "내 픽" 가로 스크롤. 카드는 폴라로이드 일기 톤(PickPolaroidCard) — 모임 카드의
 * 정렬된 hero 와는 시각언어를 분리하여 "내 인생 와인" 의 사적 정서를 강조.
 *
 * editable 일 때 long-press 로 제거. 5개 미만이면 우측에 dashed add tile 노출.
 */
export function MyPicksSection({ picks, editable = false, onAdd, onRemove, wines = [] }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const canAdd = editable && picks.length < MAX_PICKS;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 픽</Text>
        {canAdd && (
          <Pressable onPress={() => setShowAdd(true)} hitSlop={8}>
            <Text style={styles.addText}>+ 추가</Text>
          </Pressable>
        )}
      </View>

      {picks.length === 0 && !editable ? (
        <View style={styles.emptyOnly}>
          <Text style={styles.emptyText}>아직 픽이 없어요</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {picks.map((pick, idx) => (
            <PickPolaroidCard
              key={pick.id}
              index={idx}
              imageUrl={pick.photo_url}
              wineName={pick.wine?.name || '?'}
              memo={pick.memo}
              onLongPress={() => {
                if (!editable) return;
                Alert.alert('제거', '이 픽을 제거할까요?', [
                  { text: '취소', style: 'cancel' },
                  { text: '제거', style: 'destructive', onPress: () => onRemove?.(pick.id) },
                ]);
              }}
            />
          ))}
          {canAdd && <PickPolaroidAddTile onPress={() => setShowAdd(true)} />}
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
  container: { marginTop: 14, marginBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 10,
  },
  title: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 },
  addText: { fontSize: 13, fontWeight: '600', color: '#7b2d4e' },

  // 폴라로이드들이 살짝 겹치게 — 회전 + 음수에 가까운 gap 으로 album 정서.
  // outer width 가 frame 보다 좁아서 자동으로 겹쳐 보임. 좌측 패딩만 조절.
  row: { paddingLeft: 16, paddingRight: 8, paddingVertical: 8, gap: 4 },

  emptyOnly: { paddingHorizontal: 20, paddingVertical: 12 },
  emptyText: { fontSize: 13, color: '#bbb' },
});
