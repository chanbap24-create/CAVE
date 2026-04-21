import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Dimensions, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';

export interface PhotoPagerSlide {
  id: number | string;
  /** Primary photo. Falsy → placeholder block. */
  uri: string | null;
}

interface Props {
  slides: PhotoPagerSlide[];
  index: number;
  onIndexChange: (next: number) => void;
}

/**
 * Horizontal paging photo carousel with native swipe + Stories-style
 * edge-tap paging. Extracted from CollectionDetailSheet so the
 * gesture-coordination logic isn't tangled with the comments + input
 * layers above/below.
 *
 * - Drag: native pagingEnabled ScrollView (reliable across RN versions)
 * - Tap left/right half: prev/next without committing a drag
 * - Tap inside a single-slide pager: no-op (disabled when total <= 1)
 */
export function PhotoPager({ slides, index, onIndexChange }: Props) {
  const ref = React.useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = React.useState(Dimensions.get('window').width);
  const total = slides.length;

  // Keep the pager in sync when `index` changes externally (e.g. arrow
  // controls in a parent UI or deep-link).
  React.useEffect(() => {
    ref.current?.scrollTo({ x: index * pageWidth, animated: true });
  }, [index, pageWidth]);

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== index) onIndexChange(next);
  }

  return (
    <View onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={total > 1}
        onMomentumScrollEnd={onMomentumEnd}
        style={{ width: '100%' }}
      >
        {slides.map((s) => (
          <Pressable
            key={s.id}
            style={{ width: pageWidth }}
            onPress={(evt) => {
              if (total <= 1) return;
              const x = evt.nativeEvent.locationX;
              if (x < pageWidth / 2) onIndexChange(Math.max(0, index - 1));
              else onIndexChange(Math.min(total - 1, index + 1));
            }}
          >
            {s.uri ? (
              <Image source={s.uri} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.photo, styles.placeholder]} />
            )}
          </Pressable>
        ))}
      </ScrollView>
      {total > 1 && (
        <View style={styles.pill}>
          <Text style={styles.pillText}>{index + 1} / {total}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  placeholder: { backgroundColor: '#f0f0f0' },
  pill: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
