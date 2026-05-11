import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '@/lib/utils/dateUtils';
import { StarRating } from '@/components/StarRating';
import { TasteProfile } from '@/components/TasteProfile';
import {
  EMPTY_TASTE_PROFILE, isTasteProfileEmpty,
  type TasteProfileValue,
} from '@/lib/constants/tasteProfile';

/** 별점 1개 타일의 너비 — locationX 기반 좌/우 절반 탭 분기 기준. */
const STAR_TILE_W = 36;

interface Props {
  initialNote: string | null;
  initialRating: number | null;
  initialProfile: TasteProfileValue;
  updatedAt: string | null;
  /** When false (non-owner viewer), render the note read-only. */
  editable: boolean;
  onSave: (
    note: string,
    rating: number | null,
    profile: TasteProfileValue,
  ) => Promise<boolean>;
}

/**
 * Tasting note + rating block for the wine detail page.
 *
 * 별점 5개 + 노트 텍스트 한 묶음. 기존 별도 "마셨다 기록" 시트를 흡수해
 * 단일 진입점으로 통일. 별점만 또는 노트만 입력해도 OK (둘 다 nullable).
 *
 * 저장 시 collections.tasting_note + collections.rating 한 번에 update,
 * touch_collection_tasting_note 트리거로 tasting_note_updated_at 갱신 →
 * useRecentDrinks 가 그 timestamp 기준 desc 로 보여준다 ("최근 마신 와인").
 */
export function TastingNoteEditor({
  initialNote, initialRating, initialProfile, updatedAt, editable, onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(initialNote ?? '');
  const [draftRating, setDraftRating] = useState<number | null>(initialRating);
  const [draftProfile, setDraftProfile] = useState<TasteProfileValue>(initialProfile);
  const [saving, setSaving] = useState(false);

  // Keep drafts in sync when the parent reloads after save (or different wine).
  useEffect(() => {
    if (!editing) {
      setDraftNote(initialNote ?? '');
      setDraftRating(initialRating);
      setDraftProfile(initialProfile);
    }
  }, [initialNote, initialRating, initialProfile, editing]);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(draftNote, draftRating, draftProfile);
    setSaving(false);
    if (ok) setEditing(false);
  }

  function handleCancel() {
    setDraftNote(initialNote ?? '');
    setDraftRating(initialRating);
    setDraftProfile(initialProfile);
    setEditing(false);
  }

  const hasNote = !!initialNote?.trim();
  const hasRating = initialRating != null && initialRating > 0;
  const hasProfile = !isTasteProfileEmpty(initialProfile);
  const hasContent = hasNote || hasRating || hasProfile;

  const openEditor = () => { if (editable) setEditing(true); };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tasting Note</Text>
        {editable && !editing && hasContent && (
          <Pressable onPress={openEditor} hitSlop={6}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        )}
      </View>

      {editing ? (
        <>
          <StarRow value={draftRating} onChange={setDraftRating} />
          <TasteProfile value={draftProfile} onChange={setDraftProfile} />
          <TextInput
            style={styles.input}
            value={draftNote}
            onChangeText={setDraftNote}
            placeholder="아로마, 팔레트, 피니시, 그날의 분위기…"
            placeholderTextColor="#bbb"
            multiline
            maxLength={2000}
            autoFocus
          />
          <View style={styles.actionRow}>
            <Pressable onPress={handleCancel} style={styles.cancelBtn} disabled={saving}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? '저장중...' : '저장'}</Text>
            </Pressable>
          </View>
        </>
      ) : hasContent ? (
        <View>
          {hasRating && (
            <View style={styles.readOnlyStarsWrap}>
              <StarRating rating={initialRating} size={20} gap={2} />
            </View>
          )}
          {hasProfile && <TasteProfile value={initialProfile} />}
          {hasNote && <Text style={styles.body}>{initialNote}</Text>}
          {updatedAt ? (
            <Text style={styles.meta}>마지막 수정 · {timeAgo(updatedAt)}</Text>
          ) : null}
        </View>
      ) : (
        <Pressable onPress={openEditor} disabled={!editable} style={styles.emptyBox}>
          <Text style={styles.empty}>
            {editable
              ? '박스를 탭하여 별점·맛 프로파일·노트 작성'
              : '아직 작성된 노트가 없어요.'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

interface StarRowProps {
  value: number | null;
  onChange: (next: number | null) => void;
}

/**
 * Editable 별점 5개 — 0.5 단위. 각 별 타일을 좌/우 절반으로 나눠 탭:
 *  - 좌측 절반: n - 0.5 (반개)
 *  - 우측 절반: n (한 개)
 * 같은 값을 다시 탭하면 해제. read-only 표시는 StarRating 컴포넌트로 분리됨.
 */
function StarRow({ value, onChange }: StarRowProps) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(n => {
        const v = value ?? 0;
        const variant = v >= n ? 'full' : v >= n - 0.5 ? 'half' : 'empty';
        return (
          <Pressable
            key={n}
            style={styles.starTile}
            onPress={(e) => {
              const half = e.nativeEvent.locationX < STAR_TILE_W / 2;
              const next = n - (half ? 0.5 : 0);
              onChange(value === next ? null : next);
            }}
          >
            <Ionicons
              name={variant === 'full' ? 'star' : variant === 'half' ? 'star-half' : 'star-outline'}
              size={28}
              color={variant === 'empty' ? '#e0e0e0' : '#f5a623'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heading: { fontSize: 13, fontWeight: '700', color: '#222', textTransform: 'uppercase', letterSpacing: 0.6 },
  editLink: { fontSize: 12, fontWeight: '600', color: '#7b2d4e' },

  starRow: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  starTile: { width: STAR_TILE_W, height: 32, alignItems: 'center', justifyContent: 'center' },
  readOnlyStarsWrap: { marginBottom: 8 },

  body: { fontSize: 14, color: '#333', lineHeight: 21 },
  meta: { fontSize: 11, color: '#bbb', marginTop: 10 },
  emptyBox: {
    borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed', borderRadius: 10,
    padding: 16, alignItems: 'center', backgroundColor: '#fafafa',
  },
  empty: { fontSize: 13, color: '#999', fontStyle: 'italic', lineHeight: 19 },

  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: '#fafafa',
    height: 140, textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  cancelText: { fontSize: 13, color: '#999', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#7b2d4e',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8,
  },
  saveText: { fontSize: 13, color: '#fff', fontWeight: '700' },
});
