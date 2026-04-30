import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useMediaPicker } from '@/lib/hooks/useMediaPicker';
import { useWineTagSearch, type WineTag } from '@/lib/hooks/useWineTagSearch';
import { usePostSubmit } from '@/lib/hooks/usePostSubmit';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';
import { useMention } from '@/lib/hooks/useMention';
import { MentionSuggestions } from '@/components/MentionSuggestions';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CreateVideoPreview } from '@/components/CreateVideoPreview';
import { PickStep } from '@/components/PickStep';
import { CategoryPicker } from '@/components/CategoryPicker';
import { WineTagPicker } from '@/components/WineTagPicker';

export default function CreateScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'pick' | 'compose'>('pick');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const media = useMediaPicker();
  const wineTag = useWineTagSearch();
  const { submit, posting, videoUploading, videoProgress } = usePostSubmit();
  const { categories: drinkCategories } = useDrinkCategories();
  const { suggestions, detectMention, applyMention } = useMention();

  async function handlePick(type: 'image' | 'video', source: 'gallery' | 'camera' = 'gallery') {
    const ok = source === 'camera' ? await media.takePhoto() : await media.pickFromGallery(type);
    if (ok) setStep('compose');
  }

  function handleSelectWine(wine: WineTag) {
    wineTag.selectWine(wine);
    // Auto-set category from the tagged wine unless user already chose one manually.
    if (!category && wine.category) setCategory(wine.category);
  }

  function resetAll() {
    setStep('pick');
    setCaption('');
    setCategory(null);
    media.reset();
    wineTag.reset();
  }

  async function handleSubmit() {
    if (!user) return;
    const ok = await submit({
      userId: user.id,
      mediaType: media.mediaType,
      imageUri: media.imageUri,
      videoUri: media.videoUri,
      caption,
      category,
      taggedWine: wineTag.taggedWine,
    });
    if (ok) {
      resetAll();
      router.navigate('/(tabs)');
    }
  }

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <ScreenHeader variant="centered" title="새 게시물" />
        <PickStep
          onTakePhoto={() => handlePick('image', 'camera')}
          onPickImage={() => handlePick('image')}
          onPickVideo={() => handlePick('video')}
        />
      </View>
    );
  }

  const busy = posting || videoUploading;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="새 게시물"
        left={
          <Pressable
            onPress={() => { setStep('pick'); media.reset(); }}
            hitSlop={8}
          >
            <Text style={styles.backBtn}>뒤로</Text>
          </Pressable>
        }
        right={
          <Pressable onPress={handleSubmit} disabled={busy} hitSlop={8}>
            {busy ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#7b2d4e" />
                {videoUploading && (
                  <Text style={{ fontSize: 10, color: '#7b2d4e', marginTop: 2 }}>
                    {videoProgress}%
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.shareBtn}>공유</Text>
            )}
          </Pressable>
        }
      />

      <ScrollView keyboardShouldPersistTaps="handled">
        {media.imageUri && (
          <Image source={media.imageUri} style={styles.previewImage} contentFit="cover" transition={100} cachePolicy="memory-disk" />
        )}
        {media.videoUri && <CreateVideoPreview uri={media.videoUri} />}

        <MentionSuggestions
          suggestions={suggestions}
          onSelect={(u) => setCaption(applyMention(caption, u))}
        />

        <View style={styles.composeSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="문구 입력... @를 입력해 태그"
            placeholderTextColor="#bbb"
            value={caption}
            onChangeText={(text) => { setCaption(text); detectMention(text); }}
            multiline
            maxLength={500}
          />
        </View>

        <CategoryPicker
          categories={drinkCategories}
          selected={category}
          onChange={setCategory}
        />

        <WineTagPicker
          tagSearch={wineTag.tagSearch}
          tagResults={wineTag.tagResults}
          taggedWine={wineTag.taggedWine}
          onSearch={wineTag.searchWines}
          onSelect={handleSelectWine}
          onClear={wineTag.clearTag}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { fontSize: 15, color: '#999' },
  shareBtn: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },
  previewImage: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  composeSection: { padding: 16 },
  captionInput: {
    fontSize: 15, color: '#222', lineHeight: 22,
    minHeight: 60, textAlignVertical: 'top',
  },
});
