import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useVideoUpload } from '@/lib/hooks/useVideoUpload';
import { uploadImage } from '@/lib/utils/imageUpload';
import type { WineTag } from '@/lib/hooks/useWineTagSearch';
import type { MediaType } from '@/lib/hooks/useMediaPicker';

interface SubmitInput {
  userId: string;
  mediaType: MediaType;
  imageUri: string | null;
  videoUri: string | null;
  caption: string;
  category: string | null;
  taggedWine: WineTag | null;
}

export function usePostSubmit() {
  const [posting, setPosting] = useState(false);
  const { uploadVideo, uploading: videoUploading, progress: videoProgress } = useVideoUpload();

  async function submit(input: SubmitInput): Promise<boolean> {
    const { userId, mediaType, imageUri, videoUri, caption, category, taggedWine } = input;

    if (!imageUri && !videoUri) {
      Alert.alert('Media required', 'Please select a photo or video');
      return false;
    }

    setPosting(true);
    try {
      let imageUrl = '';
      let videoPlaybackId: string | null = null;

      if (mediaType === 'video' && videoUri) {
        const result = await uploadVideo(videoUri);
        if (!result) throw new Error('Video upload failed');
        videoPlaybackId = result.playbackId;
      } else if (imageUri) {
        const uploaded = await uploadImage(imageUri, userId);
        imageUrl = uploaded || imageUri;
      }

      // Only include `category` when the user actually picked one so posts still
      // succeed on schemas where the column hasn't been added yet.
      const postPayload: Record<string, any> = {
        user_id: userId,
        caption: caption.trim() || null,
        media_type: mediaType,
        video_playback_id: videoPlaybackId,
      };
      if (category) postPayload.category = category;

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert(postPayload)
        .select()
        .single();

      if (postError) throw postError;

      if (imageUrl) {
        await supabase.from('post_images').insert({
          post_id: post.id,
          image_url: imageUrl,
          display_order: 0,
        });
      }

      if (taggedWine) {
        await supabase.from('post_wines').insert({
          post_id: post.id,
          wine_id: taggedWine.id,
        });
      }

      await sendMentionNotifications(caption, post.id, userId);

      return true;
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create post');
      return false;
    } finally {
      setPosting(false);
    }
  }

  return {
    submit,
    posting,
    videoUploading,
    videoProgress,
  };
}

// Cap the number of people one post can notify. Without this, a single
// post with @u1 @u2 … @u100 can flood 100 inboxes; scaled across a bot
// farm it's a spam weapon. 10 is generous for legitimate use.
const MAX_MENTIONS_PER_POST = 10;

async function sendMentionNotifications(caption: string, postId: string | number, actorId: string) {
  const mentions = caption.match(/@([^\s@]+)/g);
  if (!mentions) return;

  // Dedupe + cap.
  const usernames = [...new Set(mentions.map(m => m.replace('@', '')))].slice(0, MAX_MENTIONS_PER_POST);

  const { data: mentionedUsers } = await supabase
    .from('profiles')
    .select('id')
    .in('username', usernames);

  if (!mentionedUsers) return;

  const notifs = mentionedUsers
    .filter(u => u.id !== actorId)
    .map(u => ({
      user_id: u.id,
      type: 'mention' as const,
      actor_id: actorId,
      reference_id: postId.toString(),
      reference_type: 'post',
      body: 'mentioned you in a post',
    }));

  if (notifs.length > 0) await supabase.from('notifications').insert(notifs);
}
