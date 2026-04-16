import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Props {
  text: string;
  style?: any;
}

export function MentionText({ text, style }: Props) {
  const router = useRouter();

  const parts = text.split(/(@[^\s@]+)/g);

  async function handleMentionPress(username: string) {
    const cleanUsername = username.replace('@', '');
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .single();
    if (data) router.push(`/user/${data.id}`);
  }

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <Text key={i} style={styles.mention} onPress={() => handleMentionPress(part)}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  mention: { color: '#7b2d4e', fontWeight: '600' },
});
