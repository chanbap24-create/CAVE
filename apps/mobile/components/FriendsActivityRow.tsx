import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/lib/auth';
import { useCellarActivity, type CellarActivityGroup } from '@/lib/hooks/useCellarActivity';
import { CollectionDetailSheet } from '@/components/CollectionDetailSheet';
import { PartnerBadge } from '@/components/PartnerBadge';

const STORY_SIZE = 78;

/**
 * 셀러 탭 상단 — 팔로우 친구들의 최근 와인 추가를 인스타 스토리 톤으로 노출.
 *
 * 친구가 셀러에 와인을 추가하면 그 친구의 프로필 사진이 동그라미 링 안에 노출.
 * 동그라미를 탭하면 CollectionDetailSheet 가 열려 그 친구가 최근 추가한 와인을
 * swipe 로 살펴볼 수 있다 — 친구 프로필 → 최근 와인 흐름이 한 탭으로 끝남.
 *
 * 데이터: useCellarActivity (24h 내 follows 추가). 자기 자신은 필터.
 * 친구 활동이 없으면 행 자체를 숨김 (placeholder 안 띄움).
 *
 * 기존의 "내 최근 셀러"(RecentlyAddedRow) + "Recent Additions"(CellarActivityStrip)
 * 두 비슷한 섹션을 이 한 행으로 통합.
 */
export function FriendsActivityRow() {
  const { user } = useAuth();
  const { groups, loading } = useCellarActivity();
  const [active, setActive] = useState<CellarActivityGroup | null>(null);

  // 본인은 친구 활동에서 제외 — useCellarActivity 의 self-fallback 이 들어와도
  // 여기선 친구만 노출.
  const friendGroups = groups.filter(g => g.user_id !== user?.id);

  if (!loading && friendGroups.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>친구 셀러</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {friendGroups.map(g => (
          <Pressable
            key={g.user_id}
            style={styles.story}
            onPress={() => setActive(g)}
          >
            <View style={styles.ring}>
              <View style={styles.innerWhite}>
                {g.owner?.avatar_url ? (
                  <Image
                    source={g.owner.avatar_url}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarChar}>
                      {(g.owner?.display_name?.[0] || g.owner?.username?.[0] || '?').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              {/* 와인 N병 추가 badge — 1개일 땐 숨김 */}
              {g.entries.length > 1 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>+{g.entries.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {g.owner?.display_name || g.owner?.username || '친구'}
              </Text>
              {g.owner?.is_partner ? (
                <PartnerBadge label={g.owner.partner_label} size="sm" />
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <CollectionDetailSheet
        visible={active != null}
        entries={active?.entries ?? []}
        onClose={() => setActive(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 10, paddingBottom: 6 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 10,
  },
  row: { paddingHorizontal: 16, gap: 14 },
  story: { width: STORY_SIZE, alignItems: 'center' },

  // 인스타 스토리 그라디언트 링 — 자주색 단색 (RN gradient 라이브러리 미설치).
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

  countBadge: {
    position: 'absolute', right: -2, top: -2,
    backgroundColor: '#7b2d4e',
    minWidth: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2, borderColor: '#fff',
  },
  countBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  nameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 8, maxWidth: STORY_SIZE,
  },
  name: { fontSize: 11, color: '#333', textAlign: 'center', fontWeight: '600', flexShrink: 1 },
});
