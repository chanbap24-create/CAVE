import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getDiscoverCardWidth, CARD_GAP } from '@/lib/utils/discoverCardWidth';

const CARD_WIDTH = getDiscoverCardWidth();

interface TagSpec {
  label: string;
  bg: string;
  fg: string;
}

interface Props {
  /** 상단 카테고리/타입 태그 */
  tag?: TagSpec | null;
  /** 호스트(강사) 아바타 URL */
  avatarUrl?: string | null;
  avatarFallback?: string;
  /** 호스트 이름 (예: '리델 와인샵', '김X') */
  hostName: string;
  /** 호스트 부가 정보 (예: '와인 디렉터') */
  hostSubtitle?: string | null;
  /** 모임 제목 (2줄까지) */
  title: string;
  /** 일정 + 장소 (예: '4/29 · 청담') */
  metaLine?: string | null;
  onPress?: () => void;
  // 가격 / 모집 인원은 상세 페이지에서만 노출 (Discover 미리보기에는 미노출)
}

/**
 * Discover 모임 카드 통일 프레임 — 트레바리 스타일.
 * 사진 없이 호스트(강사) 아바타 + 텍스트로 정돈.
 *
 * 위→아래: [태그] → [호스트 아바타+이름+부가] → [구분선]
 *           → [모임 제목] → [일정·장소] → [구분선]
 *           → [참여수 ↔ 가격]
 *
 * Partner / User 가 동일 프레임. props 만 차이로 위계 표현.
 */
export function GatheringPreviewCard({
  tag, avatarUrl, avatarFallback,
  hostName, hostSubtitle, title, metaLine,
  onPress,
}: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {tag ? (
        <View style={[styles.tag, { backgroundColor: tag.bg }]}>
          <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label}</Text>
        </View>
      ) : <View style={styles.tagSpacer} />}

      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={avatarUrl} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarChar}>{(avatarFallback || '?').toUpperCase()}</Text>
          </View>
        )}
      </View>

      <Text style={styles.hostName} numberOfLines={1}>{hostName}</Text>
      {hostSubtitle ? (
        <Text style={styles.hostSubtitle} numberOfLines={1}>{hostSubtitle}</Text>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.contentWrap}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {metaLine ? <Text style={styles.meta} numberOfLines={1}>{metaLine}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, marginRight: CARD_GAP,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#eee',
    paddingTop: 12, paddingBottom: 16, paddingHorizontal: 14,
    minHeight: 250,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  tagSpacer: { height: 22 },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  avatarWrap: { alignItems: 'center', marginTop: 10 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0eaec' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarChar: { fontSize: 22, fontWeight: '700', color: '#999' },

  hostName: { fontSize: 13, fontWeight: '700', color: '#222', textAlign: 'center', marginTop: 8 },
  hostSubtitle: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },

  contentWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', lineHeight: 19, letterSpacing: -0.2 },
  meta: { fontSize: 11, color: '#666', marginTop: 8, lineHeight: 16 },
});
