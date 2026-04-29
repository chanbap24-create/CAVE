import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PartnerBadge } from '@/components/PartnerBadge';

export interface PartnerHostInfo {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  partner_label: string | null;
  partner_bio: string | null;
  partner_career: string | null;
  partner_specialties: string[] | null;
  partner_photo_url: string | null;
}

interface Props {
  host: PartnerHostInfo;
}

/**
 * 모임 상세 페이지의 "호스트 소개" 카드 — 트레바리 클럽 리더 카드 패턴.
 *
 * 큰 사진 (partner_photo_url 또는 avatar_url) + 이름 + 파트너 라벨 + 한줄/멀티라인
 * 자기소개 + 경력 (라인별로 들여쓰기 렌더) + 전문분야 태그.
 *
 * host_type != 'user' 인 모임에서 자동 노출. v1 데이터 비어있으면 비어있는 대로 둠.
 */
export function PartnerHostCard({ host }: Props) {
  const router = useRouter();
  const heroUri = host.partner_photo_url || host.avatar_url;
  const careerLines = (host.partner_career || '').split('\n').map(l => l.trim()).filter(Boolean);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/user/${host.id}`)}>
      {heroUri ? (
        <Image source={heroUri} style={styles.hero} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]} />
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {host.partner_label || host.display_name || host.username || '파트너'}
          </Text>
          <PartnerBadge size="sm" label={host.partner_label} />
        </View>
        {host.display_name && host.partner_label && host.display_name !== host.partner_label ? (
          <Text style={styles.subname}>{host.display_name}</Text>
        ) : null}

        {host.partner_bio ? (
          <Text style={styles.bio}>{host.partner_bio}</Text>
        ) : null}

        {careerLines.length > 0 ? (
          <View style={styles.careerWrap}>
            <Text style={styles.careerLabel}>경력 · 이력</Text>
            {careerLines.map((line, i) => (
              <Text key={i} style={styles.careerLine}>· {line.replace(/^[-•]\s*/, '')}</Text>
            ))}
          </View>
        ) : null}

        {host.partner_specialties && host.partner_specialties.length > 0 ? (
          <View style={styles.tagsWrap}>
            {host.partner_specialties.map(s => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#eee',
  },
  hero: { width: '100%', height: 180, backgroundColor: '#f5f0f2' },
  heroPlaceholder: { backgroundColor: '#f0eaec' },

  body: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.3 },
  subname: { fontSize: 12, color: '#888', marginTop: 2 },

  bio: { fontSize: 14, color: '#333', lineHeight: 21, marginTop: 12 },

  careerWrap: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  careerLabel: { fontSize: 11, fontWeight: '700', color: '#7b2d4e', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  careerLine: { fontSize: 13, color: '#444', lineHeight: 19 },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: { backgroundColor: '#fdf6f8', borderWidth: 1, borderColor: '#f0d8e0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  tagText: { fontSize: 12, color: '#7b2d4e', fontWeight: '500' },
});
