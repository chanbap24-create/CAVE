import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import type { MentionUser } from '@/lib/hooks/useMention';

interface Props {
  suggestions: MentionUser[];
  onSelect: (user: MentionUser) => void;
}

export function MentionSuggestions({ suggestions, onSelect }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      {suggestions.map(user => {
        const initial = user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase();
        return (
          <Pressable key={user.id} style={styles.item} onPress={() => onSelect(user)}>
            {user.avatar_url ? (
              <Image source={user.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" transition={150} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View>
              <Text style={styles.username}>{user.username}</Text>
              {user.display_name && <Text style={styles.displayName}>{user.display_name}</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#efefef',
    maxHeight: 200,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f8f8f8',
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '600', color: '#999' },
  username: { fontSize: 14, fontWeight: '600', color: '#222' },
  displayName: { fontSize: 12, color: '#999' },
});
