import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Discover 최상단 캐러셀 — 시즌 클럽 + 광고/프로모션 슬롯.
 *
 * 트레바리식 큐레이션 위계의 최상위 슬롯이지만 단일 박스가 아니라 4장 슬라이드.
 * 자동 4.5초 마다 다음 슬라이드. 사용자가 좌우로 swipe 한 직후 12초 동안 자동
 * 슬라이드 일시정지(사용자 의도 존중).
 *
 *  - slide 1 : 시즌 클럽 (자체 상품)
 *  - slide 2 : 신규 가입 50% 할인 (프로모션)
 *  - slide 3 : 파트너 모집 (광고)
 *  - slide 4 : AI 셀러 진단 (자체 상품)
 *
 * 슬라이드 데이터는 SLIDES 상수. 추후 DB / remote-config 로 교체 가능.
 */

const SCREEN = Dimensions.get('window').width;
const H_PAD = 20;
const CARD_WIDTH = SCREEN - H_PAD * 2;
const CARD_HEIGHT = 140;
const AUTO_INTERVAL = 4500;
const PAUSE_AFTER_TOUCH_MS = 12000;

type SlideKind = 'season' | 'promo' | 'partner' | 'cellar';

interface Slide {
  id: string;
  kind: SlideKind;
  bg: string;
  fg: string;
  accent: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  onPress?: () => void;
}

const SLIDES: Slide[] = [
  {
    id: 'season',
    kind: 'season',
    bg: '#231115', fg: '#ffffff', accent: '#e8c8d4',
    tag: 'COMING SOON',
    title: '시즌 클럽 1기',
    subtitle: '소믈리에 7주 큐레이션 코스',
    cta: '알림 받기',
  },
  {
    id: 'promo50',
    kind: 'promo',
    bg: '#d4a043', fg: '#2c1810', accent: '#ffffff',
    tag: '신규 회원',
    title: '첫 모임 50% 할인',
    subtitle: '이번 달 안에 사용 가능',
    cta: '코드 받기',
  },
  {
    id: 'partner',
    kind: 'partner',
    bg: '#f5e6d3', fg: '#3a1e1c', accent: '#7b2d4e',
    tag: '파트너 모집',
    title: '와인샵·소믈리에를 모십니다',
    subtitle: '무료 호스팅 + 정산 지원',
    cta: '신청하기',
  },
  {
    id: 'cellar',
    kind: 'cellar',
    bg: '#1d2747', fg: '#ffffff', accent: '#9eb593',
    tag: 'AI 큐레이션',
    title: '내 셀러 무료 진단',
    subtitle: '취향 분석 → 와인 3종 추천',
    cta: '진단 받기',
  },
];

export function SeasonClubHero() {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const lastTouchAt = useRef(0);

  // 자동 슬라이드 — 사용자 터치 직후 12초는 멈춤
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - lastTouchAt.current < PAUSE_AFTER_TOUCH_MS) return;
      setIndex(prev => {
        const next = (prev + 1) % SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * SCREEN, animated: true });
        return next;
      });
    }, AUTO_INTERVAL);
    return () => clearInterval(t);
  }, []);

  function handleScroll(e: any) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN);
    if (idx !== index) setIndex(idx);
  }

  const activeFg = SLIDES[index]?.fg ?? '#ffffff';

  return (
    <View style={styles.wrap}>
      <View style={styles.carousel}>
        <ScrollView
          ref={scrollRef}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onTouchStart={() => { lastTouchAt.current = Date.now(); }}
        >
          {SLIDES.map(s => (
            <View key={s.id} style={styles.page}>
              <SlideCard slide={s} />
            </View>
          ))}
        </ScrollView>

        {/* 인디케이터 — 배너(슬라이드) 안 하단 가운데에 absolute 오버레이.
            색은 활성 슬라이드의 fg 로 동적 매핑 → 어떤 bg 위에서도 가독성. */}
        <View style={styles.dotsOverlay} pointerEvents="none">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dotBase,
                {
                  backgroundColor: activeFg,
                  opacity: i === index ? 1 : 0.35,
                  width: i === index ? 16 : 5,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─────────── 슬라이드 카드 ───────────

function SlideCard({ slide }: { slide: Slide }) {
  return (
    <Pressable
      onPress={slide.onPress}
      style={[styles.slide, { backgroundColor: slide.bg }]}
    >
      <SlideAccent slide={slide} />
      <View style={styles.content}>
        <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
          <Text style={[styles.tagText, { color: slide.accent }]}>{slide.tag}</Text>
        </View>
        <Text style={[styles.title, { color: slide.fg }]} numberOfLines={1}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: slide.fg, opacity: 0.78 }]} numberOfLines={1}>
          {slide.subtitle}
        </Text>
        <Text style={[styles.cta, { color: slide.fg }]}>{slide.cta} ›</Text>
      </View>
    </Pressable>
  );
}

/** 슬라이드 종류별 우측 액센트 그래픽 — 시각 다양성. */
function SlideAccent({ slide }: { slide: Slide }) {
  if (slide.kind === 'season') {
    return (
      <Text style={[accent.bigNumber, { color: slide.accent }]}>01</Text>
    );
  }
  if (slide.kind === 'promo') {
    return (
      <View style={accent.stampWrap}>
        <View style={[accent.stamp, { borderColor: slide.fg }]}>
          <Text style={[accent.stampPercent, { color: slide.fg }]}>50%</Text>
          <Text style={[accent.stampOff, { color: slide.fg }]}>OFF</Text>
        </View>
      </View>
    );
  }
  if (slide.kind === 'partner') {
    return (
      <View style={accent.iconWrap}>
        <Svg width={70} height={70} viewBox="0 0 24 24" fill="none" stroke={slide.accent} strokeWidth={1.6}>
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <Path d="M9 22V12h6v10" />
        </Svg>
      </View>
    );
  }
  // cellar — 막대 차트
  return (
    <View style={accent.chartWrap}>
      {[20, 38, 55, 28, 48].map((h, i) => (
        <View
          key={i}
          style={[accent.chartBar, { height: h, backgroundColor: slide.accent, opacity: 0.7 + i * 0.04 }]}
        />
      ))}
    </View>
  );
}

// ─────────── styles ───────────

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 4 },
  page: {
    width: SCREEN, paddingHorizontal: H_PAD,
  },
  slide: {
    width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: 16, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  content: { flex: 1, gap: 4 },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    marginBottom: 4,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '500' },
  cta: { fontSize: 12, fontWeight: '700', marginTop: 6 },

  // 배너 영역 — 슬라이드 카드와 같은 높이로 고정해서 dotsOverlay 의 absolute
  // bottom 기준이 정확히 슬라이드 카드 바닥이 되게 함.
  carousel: { height: CARD_HEIGHT, position: 'relative' },
  dotsOverlay: {
    position: 'absolute', bottom: 10,
    left: H_PAD, right: H_PAD,
    flexDirection: 'row', justifyContent: 'center',
    gap: 5,
  },
  dotBase: {
    height: 5, borderRadius: 2.5,
  },
});

const accent = StyleSheet.create({
  // season — 큰 "01" 숫자
  bigNumber: {
    position: 'absolute', right: 18, top: -10,
    fontSize: 130, fontWeight: '700', lineHeight: 130,
    letterSpacing: -10, opacity: 0.45,
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
  },
  // promo — 50% OFF 도장
  stampWrap: { position: 'absolute', right: 18, top: 18 },
  stamp: {
    width: 86, height: 86, borderRadius: 43, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  stampPercent: { fontSize: 24, fontWeight: '900', letterSpacing: -1, lineHeight: 26 },
  stampOff: { fontSize: 13, fontWeight: '800', letterSpacing: 2, lineHeight: 14 },
  // partner — 와인샵 아이콘
  iconWrap: { position: 'absolute', right: 22, top: 32, opacity: 0.5 },
  // cellar — 막대 차트
  chartWrap: {
    position: 'absolute', right: 22, bottom: 22,
    flexDirection: 'row', alignItems: 'flex-end', gap: 6,
  },
  chartBar: { width: 8, borderRadius: 2 },
});
