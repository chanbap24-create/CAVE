import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';

interface Props {
  share: boolean;
  caption: string;
  onShareChange: (share: boolean) => void;
  onCaptionChange: (caption: string) => void;
}

/**
 * Opt-in "Share with community" toggle + optional caption. Sits near a
 * primary save button and lets the user turn a cellar action into a post
 * without making auto-posting the default (which would noise up the feed).
 */
export function ShareToggleRow({ share, caption, onShareChange, onCaptionChange }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>커뮤니티에 공유</Text>
          <Text style={styles.hint}>피드에 게시물로 등록 · 선택</Text>
        </View>
        <Switch
          value={share}
          onValueChange={onShareChange}
          trackColor={{ false: '#e0e0e0', true: '#7b2d4e' }}
          thumbColor="#fff"
          ios_backgroundColor="#e0e0e0"
        />
      </View>
      {share && (
        <TextInput
          style={styles.caption}
          value={caption}
          onChangeText={onCaptionChange}
          placeholder="메모 추가 (선택)..."
          placeholderTextColor="#bbb"
          multiline
          maxLength={300}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 16, padding: 14, borderRadius: 12,
    backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 14, fontWeight: '600', color: '#222' },
  hint: { fontSize: 11, color: '#999', marginTop: 2 },
  caption: {
    marginTop: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8,
    padding: 10, fontSize: 14, backgroundColor: '#fff', minHeight: 60,
    textAlignVertical: 'top',
  },
});
