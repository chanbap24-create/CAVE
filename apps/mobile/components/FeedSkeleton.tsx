import React from 'react';
import { View, StyleSheet } from 'react-native';

function SkeletonPost() {
  return (
    <View style={styles.post}>
      <View style={styles.header}>
        <View style={styles.avatarSk} />
        <View style={styles.nameSk} />
      </View>
      <View style={styles.imageSk} />
      <View style={styles.body}>
        <View style={styles.lineSk} />
        <View style={styles.lineShortSk} />
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View>
      <SkeletonPost />
      <SkeletonPost />
    </View>
  );
}

const styles = StyleSheet.create({
  post: { borderBottomWidth: 1, borderBottomColor: '#efefef' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 16, gap: 10,
  },
  avatarSk: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0',
  },
  nameSk: {
    width: 120, height: 12, borderRadius: 6, backgroundColor: '#f0f0f0',
  },
  imageSk: {
    width: '100%', height: 390, backgroundColor: '#f5f5f5',
  },
  body: { padding: 16, gap: 8 },
  lineSk: {
    width: '60%', height: 10, borderRadius: 5, backgroundColor: '#f0f0f0',
  },
  lineShortSk: {
    width: '40%', height: 10, borderRadius: 5, backgroundColor: '#f0f0f0',
  },
});
