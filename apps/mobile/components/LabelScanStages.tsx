import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useMediaPicker } from '@/lib/hooks/useMediaPicker';
import { MIN_VISION_CONFIDENCE } from '@/lib/constants/wineVision';
import { LabelReviewForm, type ReviewFormValue } from '@/components/LabelReviewForm';
import type { WineMatchResult } from '@/lib/types/wine';

type Media = ReturnType<typeof useMediaPicker>;

// --- Pick stage ---------------------------------------------------------
export function PickStage({ media }: { media: Media }) {
  return (
    <View style={styles.stage}>
      <Text style={styles.helpText}>Take a clear photo of the wine label</Text>
      <Pressable style={styles.bigBtn} onPress={() => media.takePhoto()}>
        <Text style={styles.bigBtnText}>Take Photo</Text>
      </Pressable>
      <Pressable style={[styles.bigBtn, styles.bigBtnAlt]} onPress={() => media.pickFromGallery('image')}>
        <Text style={[styles.bigBtnText, { color: '#7b2d4e' }]}>Pick from Gallery</Text>
      </Pressable>
    </View>
  );
}

// --- Analyzing stage ----------------------------------------------------
export function AnalyzingStage({ uri }: { uri: string | null }) {
  return (
    <View style={styles.stage}>
      {uri && <Image source={uri} style={styles.preview} contentFit="cover" />}
      <ActivityIndicator color="#7b2d4e" style={{ marginTop: 16 }} />
      <Text style={styles.helpText}>Reading the label…</Text>
    </View>
  );
}

// --- Error stage --------------------------------------------------------
export function ErrorStage({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <View style={styles.stage}>
      <Text style={[styles.helpText, { color: '#ed4956' }]}>{message ?? 'Scan failed'}</Text>
      <Pressable style={[styles.bigBtn, styles.bigBtnAlt]} onPress={onRetry}>
        <Text style={[styles.bigBtnText, { color: '#7b2d4e' }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

// --- Match card (used inside ReviewStage) -------------------------------
function MatchCard({
  match,
  active,
  onToggle,
}: {
  match: Extract<WineMatchResult, { kind: 'match' }>;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={[styles.matchBox, active && styles.matchBoxActive]} onPress={onToggle}>
      <Text style={styles.matchTitle}>
        {active ? '✓ Using existing' : 'Use existing match?'}
      </Text>
      <Text style={styles.matchName}>{match.wine.name}</Text>
      {match.wine.producer ? <Text style={styles.matchMeta}>{match.wine.producer}</Text> : null}
      <Text style={styles.matchScore}>match {(match.score * 100).toFixed(0)}%</Text>
    </Pressable>
  );
}

// --- Review stage -------------------------------------------------------
export interface ReviewStageProps {
  uri: string;
  confidence: number;
  match: WineMatchResult;
  useMatchId: number | null;
  onToggleMatch: () => void;
  form: ReviewFormValue;
  onFormChange: (v: ReviewFormValue) => void;
  onSave: () => void;
  saving: boolean;
}

export function ReviewStage(p: ReviewStageProps) {
  const lowConfidence = p.confidence < MIN_VISION_CONFIDENCE;
  return (
    <ScrollView style={styles.stage} keyboardShouldPersistTaps="handled">
      <Image source={p.uri} style={styles.preview} contentFit="cover" />

      {lowConfidence && (
        <Text style={styles.warn}>Label was hard to read — please double-check the fields below.</Text>
      )}

      {p.match.kind === 'match' && (
        <MatchCard
          match={p.match}
          active={p.useMatchId != null}
          onToggle={p.onToggleMatch}
        />
      )}

      {!p.useMatchId && (
        <View style={{ marginTop: 12 }}>
          <LabelReviewForm value={p.form} onChange={p.onFormChange} />
        </View>
      )}

      <Pressable style={[styles.saveBtn, p.saving && { opacity: 0.5 }]} onPress={p.onSave} disabled={p.saving}>
        <Text style={styles.saveBtnText}>{p.saving ? 'Saving…' : 'Add to Cave'}</Text>
      </Pressable>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stage: { padding: 20 },
  helpText: { fontSize: 13, color: '#999', textAlign: 'center', marginVertical: 16 },
  warn: {
    backgroundColor: '#fff3cd', color: '#8a6d3b',
    padding: 10, borderRadius: 8, fontSize: 12, marginTop: 12,
  },
  preview: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#f5f5f5' },
  bigBtn: {
    backgroundColor: '#7b2d4e', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 12,
  },
  bigBtnAlt: { backgroundColor: '#f7f0f3' },
  bigBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  matchBox: {
    marginTop: 14, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa',
  },
  matchBoxActive: { borderColor: '#7b2d4e', backgroundColor: '#f7f0f3' },
  matchTitle: { fontSize: 12, fontWeight: '700', color: '#7b2d4e', marginBottom: 4 },
  matchName: { fontSize: 15, fontWeight: '600', color: '#222' },
  matchMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  matchScore: { fontSize: 11, color: '#bbb', marginTop: 4 },
  saveBtn: {
    marginTop: 20, backgroundColor: '#7b2d4e',
    paddingVertical: 14, borderRadius: 10, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
