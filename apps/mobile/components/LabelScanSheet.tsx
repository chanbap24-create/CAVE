import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useMediaPicker } from '@/lib/hooks/useMediaPicker';
import { useWineLabelScan } from '@/lib/hooks/useWineLabelScan';
import { useAddToCave } from '@/lib/hooks/useAddToCave';
import { isAutoMatch } from '@/lib/hooks/useWineMatch';
import { uploadImage } from '@/lib/utils/imageUpload';
import { fromExtracted, type ReviewFormValue } from '@/components/LabelReviewForm';
import { PickStage, AnalyzingStage, ErrorStage, ReviewStage } from '@/components/LabelScanStages';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function LabelScanSheet({ visible, onClose, onAdded }: Props) {
  const { user } = useAuth();
  const media = useMediaPicker();
  const scan = useWineLabelScan();
  const cave = useAddToCave();
  const [form, setForm] = useState<ReviewFormValue | null>(null);
  const [useMatchId, setUseMatchId] = useState<number | null>(null);
  const [share, setShare] = useState(false);
  const [shareCaption, setShareCaption] = useState('');

  useEffect(() => {
    if (media.imageUri) scan.scan(media.imageUri);
  }, [media.imageUri]);

  useEffect(() => {
    if (scan.status !== 'ready' || !scan.result) return;
    setForm(fromExtracted(scan.result.extracted));
    const m = scan.result.match;
    setUseMatchId(m.kind === 'match' && isAutoMatch(m.score) ? m.wine.id : null);
  }, [scan.status]);

  function handleClose() {
    media.reset();
    scan.reset();
    setForm(null);
    setUseMatchId(null);
    setShare(false);
    setShareCaption('');
    onClose();
  }

  function toggleMatch() {
    setUseMatchId(prev => {
      if (scan.result?.match.kind !== 'match') return null;
      return prev ? null : scan.result.match.wine.id;
    });
  }

  // Uploads the scanned label photo to Storage so it can be saved on the
  // collections row. This is the user's personal photo of their bottle —
  // distinct from wines.image_url, which is the shared product image. Upload
  // failure falls through silently; we'd rather save the collection entry
  // without a photo than block the whole flow on a storage hiccup.
  async function uploadScanPhoto(): Promise<string | null> {
    const uri = scan.result?.imageUri;
    if (!uri || !user) return null;
    return (await uploadImage(uri, `${user.id}/cellar`)) ?? null;
  }

  async function handleSave() {
    if (!form || !user) return;

    if (useMatchId) {
      const photoUrl = await uploadScanPhoto();
      const ok = await cave.addExisting({ wineId: useMatchId, source: 'photo', photoUrl });
      if (!ok) return Alert.alert('Error', 'Could not add to cave');
      if (share) await createSharePost(useMatchId, photoUrl, user.id, shareCaption);
      onAdded(); handleClose();
      return;
    }

    if (!form.name.trim()) return Alert.alert('Name required', 'Please enter the name');
    const photoUrl = await uploadScanPhoto();
    const isYear = form.vintageType === 'year';
    const result = await cave.addNew({
      extracted: {
        name: form.name.trim(),
        name_ko: null,
        producer: form.producer.trim() || null,
        region: form.region.trim() || null,
        country: form.country.trim() || null,
        vintage_year: isYear && form.vintage ? Number(form.vintage) : null,
        vintage_type: form.vintageType,
        category: form.category,
        confidence: 1,
      },
      source: 'photo',
      photoUrl,
    });
    if (!result) return Alert.alert('Error', 'Could not save wine');
    if (share) await createSharePost(result.id, photoUrl, user.id, shareCaption);
    onAdded(); handleClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Scan Label</Text>

        {scan.status === 'idle' && !media.imageUri && <PickStage media={media} />}
        {scan.status === 'analyzing' && <AnalyzingStage uri={media.imageUri} />}
        {scan.status === 'ready' && scan.result && form && (
          <ReviewStage
            uri={scan.result.imageUri}
            confidence={scan.result.extracted.confidence}
            match={scan.result.match}
            useMatchId={useMatchId}
            onToggleMatch={toggleMatch}
            form={form}
            onFormChange={setForm}
            onSave={handleSave}
            saving={cave.adding}
            share={share}
            onShareChange={setShare}
            shareCaption={shareCaption}
            onShareCaptionChange={setShareCaption}
          />
        )}
        {scan.status === 'error' && <ErrorStage message={scan.error} onRetry={() => media.reset()} />}
      </View>
    </Modal>
  );
}

/**
 * Creates a community post for a just-added cellar bottle. Failures are
 * logged but non-fatal — the cellar entry is already saved, and a missed
 * post is less bad than blocking the user on a secondary action.
 */
async function createSharePost(
  wineId: number,
  photoUrl: string | null,
  userId: string,
  caption: string,
) {
  const body = caption.trim();
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      caption: body || null,
      media_type: 'image',
    })
    .select('id')
    .single();
  if (postError || !post) {
    console.error('[shareFromScan] post insert failed:', postError?.message);
    return;
  }
  if (photoUrl) {
    await supabase.from('post_images').insert({
      post_id: post.id,
      image_url: photoUrl,
      display_order: 0,
    });
  }
  await supabase.from('post_wines').insert({ post_id: post.id, wine_id: wineId });
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '92%', minHeight: '55%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  title: {
    fontSize: 15, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
});
