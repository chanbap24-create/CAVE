import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

interface WineRow {
  id: number;
  photo_url: string | null;
  created_at: string;
  wine?: {
    name: string;
    producer?: string | null;
    vintage_year?: number | null;
    image_url?: string | null;
  } | null;
}

interface Props {
  wines: WineRow[];
  /** 본인 프로필 사진 — 인스타 스토리 톤으로 각 항목 위에 노출 */
  avatarUrl?: string | null;
  /** 폴백 (이니셜 등) */
  avatarFallback?: string | null;
  /** Optional override label. Defaults to "Recently Added". */
  label?: string;
  /** Latest N → horizontal strip. */
  limit?: number;
}

const STORY_SIZE = 78; // 인스타 스토리 동그라미 크기

/**
 * 인스타 스토리 패턴의 최근 추가 카드 — 와인 병 사진 대신 본인 프로필 사진을
 * 그라디언트 링 안에 노출. 와인 이름은 라벨로 아래 표시.
 *
 * 데이터: 본인 셀러의 최근 created_at desc 와인. 본인 사진이 모두 같은 얼굴로
 * 반복되지만 인스타 본인 스토리 영역과 동일한 시각언어.
 *
 * 탭 시 wine/[id] 로 이동.
 */
export function RecentlyAddedRow({
  wines, avatarUrl, avatarFallback,
  label = '내 최근 셀러', limit = 8,
}: Props) {
  const router = useRouter();
  const items = [...wines]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map(w => (
          <Pressable
            key={w.id}
            style={styles.story}
            onPress={() => router.push(`/wine/${w.id}`)}
          >
            {/* 인스타 스토리 그라디언트 링 — 자주색 → 핑크 → 주황 */}
            <View style={styles.ring}>
              <View style={styles.innerWhite}>
                {avatarUrl ? (
                  <Image
                    source={avatarUrl}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarChar}>
                      {(avatarFallback || '?').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.wineName} numberOfLines={2}>
              {w.wine?.name || '와인'}
              {w.wine?.vintage_year ? ` ${w.wine.vintage_year}` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 10, paddingBottom: 4 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 10,
  },
  row: { paddingHorizontal: 16, gap: 14 },
  story: { width: STORY_SIZE, alignItems: 'center' },

  // 그라디언트 효과 — 단순 자주색 링 (RN gradient 라이브러리 없이 단색).
  // expo-linear-gradient 도입 가능하지만 v1 은 단색 링으로.
  ring: {
    width: STORY_SIZE, height: STORY_SIZE, borderRadius: STORY_SIZE / 2,
    padding: 2.5,
    backgroundColor: '#7b2d4e',
    alignItems: 'center', justifyContent: 'center',
  },
  innerWhite: {
    width: '100%', height: '100%', borderRadius: STORY_SIZE / 2,
    padding: 2.5, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%', borderRadius: STORY_SIZE / 2 },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center',
  },
  avatarChar: { fontSize: 22, fontWeight: '700', color: '#999' },

  wineName: {
    fontSize: 11, color: '#333', textAlign: 'center', lineHeight: 14,
    marginTop: 8, fontWeight: '500',
  },
});
