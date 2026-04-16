import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';
import { useVideoUpload } from '@/lib/hooks/useVideoUpload';
import { useMention } from '@/lib/hooks/useMention';
import { MentionSuggestions } from '@/components/MentionSuggestions';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';

function CreateVideoPreview({ uri }: { uri: string }) {
  return (
    <Video
      source={{ uri }}
      style={{ width: '100%', aspectRatio: 1 }}
      resizeMode={ResizeMode.COVER}
      shouldPlay
      isLooping
      isMuted
    />
  );
}

export default function CreateScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'pick' | 'compose'>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const { uploadVideo, uploading: videoUploading, progress: videoProgress } = useVideoUpload();
  const { suggestions, detectMention, applyMention } = useMention();

  // Wine tagging
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState<any[]>([]);
  const [taggedWine, setTaggedWine] = useState<any>(null);

  async function pickFromGallery(type: 'image' | 'video' = 'image') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo access to share');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video' ? ['videos'] : ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: type === 'image' ? [1, 1] : undefined,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'video') {
        setVideoUri(result.assets[0].uri);
        setImageUri(null);
        setMediaType('video');
      } else {
        setImageUri(result.assets[0].uri);
        setVideoUri(null);
        setMediaType('image');
      }
      setStep('compose');
    }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Allow camera access to take photos');

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setStep('compose');
      }
    } catch {
      Alert.alert('Camera unavailable', 'Use gallery instead');
    }
  }

  async function searchWines(query: string) {
    setTagSearch(query);
    if (query.length < 2) { setTagResults([]); return; }
    const { data } = await supabase
      .from('wines')
      .select('id, name, name_ko, category')
      .or(`name.ilike.%${query}%,name_ko.ilike.%${query}%`)
      .limit(5);
    if (data) setTagResults(data);
  }

  async function submitPost() {
    if (!user) return;
    if (!imageUri && !videoUri) return Alert.alert('Media required', 'Please select a photo or video');
    setPosting(true);

    try {
      let imageUrl = '';
      let videoPlaybackId: string | null = null;

      if (mediaType === 'video' && videoUri) {
        // Upload video to Mux
        const result = await uploadVideo(videoUri);
        if (!result) throw new Error('Video upload failed');
        videoPlaybackId = result.playbackId;
      } else if (imageUri) {
        // Upload image
        const ext = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, arrayBuffer, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: true,
          });

        if (uploadError) {
          imageUrl = imageUri;
        } else {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
          media_type: mediaType,
          video_playback_id: videoPlaybackId,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add image (only for image posts)
      if (imageUrl) {
        await supabase.from('post_images').insert({
          post_id: post.id,
          image_url: imageUrl,
          display_order: 0,
        });
      }

      // Tag wine if selected
      if (taggedWine) {
        await supabase.from('post_wines').insert({
          post_id: post.id,
          wine_id: taggedWine.id,
        });
      }

      // Send mention notifications
      const mentions = caption.match(/@(\w+)/g);
      if (mentions) {
        const usernames = mentions.map(m => m.replace('@', ''));
        const { data: mentionedUsers } = await supabase
          .from('profiles')
          .select('id')
          .in('username', usernames);
        if (mentionedUsers) {
          const notifs = mentionedUsers
            .filter(u => u.id !== user.id)
            .map(u => ({
              user_id: u.id,
              type: 'mention' as const,
              actor_id: user.id,
              reference_id: post.id.toString(),
              reference_type: 'post',
              body: 'mentioned you in a post',
            }));
          if (notifs.length > 0) await supabase.from('notifications').insert(notifs);
        }
      }

      Alert.alert('Posted!', 'Your post has been shared', [
        { text: 'OK', onPress: () => {
          setStep('pick');
          setImageUri(null);
          setVideoUri(null);
          setMediaType('image');
          setCaption('');
          setTaggedWine(null);
          setTagSearch('');
          router.navigate('/(tabs)');
        }}
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  }

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>New Post</Text>
        </View>
        <View style={styles.pickContent}>
          <Pressable style={styles.option} onPress={takePhoto}>
            <View style={styles.iconWrap}>
              <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <Circle cx={12} cy={13} r={4} />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Take Photo</Text>
              <Text style={styles.optDesc}>Capture with camera</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={() => pickFromGallery('image')}>
            <View style={styles.iconWrap}>
              <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
                <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
                <Circle cx={8.5} cy={8.5} r={1.5} />
                <Polyline points="21 15 16 10 5 21" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Photo from Gallery</Text>
              <Text style={styles.optDesc}>Select a saved photo</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={() => pickFromGallery('video')}>
            <View style={styles.iconWrap}>
              <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
                <Path d="M23 7l-7 5 7 5V7z" />
                <Rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Video from Gallery</Text>
              <Text style={styles.optDesc}>Share a video (max 60s)</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Compose step
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => { setStep('pick'); setImageUri(null); setVideoUri(null); setMediaType('image'); }}>
          <Text style={styles.backBtn}>Back</Text>
        </Pressable>
        <Text style={styles.title}>New Post</Text>
        <Pressable onPress={submitPost} disabled={posting || videoUploading}>
          {posting || videoUploading ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#7b2d4e" />
              {videoUploading && <Text style={{ fontSize: 10, color: '#7b2d4e', marginTop: 2 }}>{videoProgress}%</Text>}
            </View>
          ) : (
            <Text style={styles.shareBtn}>Share</Text>
          )}
        </Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        {videoUri && (
          <CreateVideoPreview uri={videoUri} />
        )}

        <MentionSuggestions suggestions={suggestions} onSelect={(user) => {
          setCaption(applyMention(caption, user));
        }} />
        <View style={styles.composeSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption... use @ to tag"
            placeholderTextColor="#bbb"
            value={caption}
            onChangeText={(text) => { setCaption(text); detectMention(text); }}
            multiline
            maxLength={500}
          />
        </View>

        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>Tag a drink</Text>
          {taggedWine ? (
            <View style={styles.taggedRow}>
              <View style={styles.taggedBadge}>
                <Text style={styles.taggedText}>{taggedWine.name}</Text>
              </View>
              <Pressable onPress={() => setTaggedWine(null)}>
                <Text style={styles.tagRemove}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.tagInput}
                placeholder="Search to tag..."
                placeholderTextColor="#bbb"
                value={tagSearch}
                onChangeText={searchWines}
              />
              {tagResults.map(w => (
                <Pressable key={w.id} style={styles.tagResult} onPress={() => {
                  setTaggedWine(w);
                  setTagSearch('');
                  setTagResults([]);
                }}>
                  <Text style={styles.tagResultName}>{w.name}</Text>
                  {w.name_ko && <Text style={styles.tagResultKo}>{w.name_ko}</Text>}
                </Pressable>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
  backBtn: { fontSize: 15, color: '#999' },
  shareBtn: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },

  pickContent: { padding: 24, paddingHorizontal: 20, gap: 1 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#fff', padding: 18, paddingHorizontal: 20,
    borderWidth: 1, borderColor: '#f5f5f5',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f7f0f3',
    alignItems: 'center', justifyContent: 'center',
  },
  optTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  optDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  arrow: { fontSize: 20, color: '#ccc' },

  previewImage: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },

  composeSection: { padding: 16 },
  captionInput: {
    fontSize: 15, color: '#222', lineHeight: 22,
    minHeight: 60, textAlignVertical: 'top',
  },

  tagSection: { paddingHorizontal: 16, paddingBottom: 20 },
  tagLabel: { fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 8 },
  tagInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 10, paddingLeft: 16, fontSize: 14,
  },
  tagResult: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  tagResultName: { fontSize: 14, fontWeight: '500', color: '#222' },
  tagResultKo: { fontSize: 11, color: '#999', marginTop: 2 },
  taggedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taggedBadge: {
    backgroundColor: '#f7f0f3', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  taggedText: { fontSize: 13, fontWeight: '500', color: '#7b2d4e' },
  tagRemove: { fontSize: 12, color: '#ed4956', fontWeight: '500' },
});
