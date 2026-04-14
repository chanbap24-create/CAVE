import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Alert } from 'react-native';

export function useDeletePost(onDeleted?: () => void) {
  const { user } = useAuth();

  async function deletePost(postId: number) {
    if (!user) return;

    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          // Delete related data first (cascade should handle this but being safe)
          await supabase.from('post_wines').delete().eq('post_id', postId);
          await supabase.from('likes').delete().eq('post_id', postId);
          await supabase.from('comments').delete().eq('post_id', postId);
          await supabase.from('post_images').delete().eq('post_id', postId);
          await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
          onDeleted?.();
        },
      },
    ]);
  }

  return { deletePost };
}
