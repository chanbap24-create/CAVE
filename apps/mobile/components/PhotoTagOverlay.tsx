import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { PhotoTag } from '@/lib/hooks/usePhotoTags';

interface Props {
  tags: PhotoTag[];
  visible: boolean;
}

export function PhotoTagOverlay({ tags, visible }: Props) {
  const router = useRouter();

  if (!visible || tags.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {tags.map(tag => (
        <Pressable
          key={tag.id}
          style={[styles.tag, { left: `${tag.x_position * 100}%`, top: `${tag.y_position * 100}%` }]}
          onPress={() => {
            if (tag.tag_type === 'user' && tag.user_id) router.push(`/user/${tag.user_id}`);
          }}
        >
          <View style={styles.tagBubble}>
            <Text style={styles.tagText}>
              {tag.tag_type === 'user' ? '@' : ''}{tag.label}
            </Text>
          </View>
          <View style={styles.tagArrow} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tag: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -36 }],
  },
  tagBubble: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tagArrow: {
    width: 8, height: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    transform: [{ rotate: '45deg' }],
    alignSelf: 'center',
    marginTop: -4,
  },
});
