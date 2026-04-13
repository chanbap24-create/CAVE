import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';

export default function CreateScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'pick' | 'compose'>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  // Wine tagging
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState<any[]>([]);
  const [taggedWine, setTaggedWine] = useState<any>(null);

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo access to share');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
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
    if (!user || !imageUri) return;
    setPosting(true);

    try {
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

      let imageUrl = '';
      if (uploadError) {
        console.log('Upload error:', uploadError.message);
        // Fallback: save local URI (won't show for others but post still works)
        imageUrl = imageUri;
      } else {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add image
      await supabase.from('post_images').insert({
        post_id: post.id,
        image_url: imageUrl,
        display_order: 0,
      });

      // Tag wine if selected
      if (taggedWine) {
        await supabase.from('post_wines').insert({
          post_id: post.id,
          wine_id: taggedWine.id,
        });
      }

      Alert.alert('Posted!', 'Your post has been shared', [
        { text: 'OK', onPress: () => {
          setStep('pick');
          setImageUri(null);
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

          <Pressable style={styles.option} onPress={pickFromGallery}>
            <View style={styles.iconWrap}>
              <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
                <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
                <Circle cx={8.5} cy={8.5} r={1.5} />
                <Polyline points="21 15 16 10 5 21" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Choose from Gallery</Text>
              <Text style={styles.optDesc}>Select a saved photo</Text>
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
        <Pressable onPress={() => { setStep('pick'); setImageUri(null); }}>
          <Text style={styles.backBtn}>Back</Text>
        </Pressable>
        <Text style={styles.title}>New Post</Text>
        <Pressable onPress={submitPost} disabled={posting}>
          {posting ? (
            <ActivityIndicator size="small" color="#7b2d4e" />
          ) : (
            <Text style={styles.shareBtn}>Share</Text>
          )}
        </Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}

        <View style={styles.composeSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#bbb"
            value={caption}
            onChangeText={setCaption}
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
