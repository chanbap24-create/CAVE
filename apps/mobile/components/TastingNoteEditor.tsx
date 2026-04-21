import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { timeAgo } from '@/lib/utils/dateUtils';

interface Props {
  initialNote: string | null;
  updatedAt: string | null;
  /** When false (non-owner viewer), render the note read-only. */
  editable: boolean;
  onSave: (note: string) => Promise<boolean>;
}

/**
 * Tasting note block for the wine detail page. Toggles between a compact
 * read view and an editor; saves via the passed callback. Handles the
 * empty state (no note yet) with a CTA that drops the user straight into
 * edit mode.
 */
export function TastingNoteEditor({ initialNote, updatedAt, editable, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNote ?? '');
  const [saving, setSaving] = useState(false);

  // Keep the draft in sync when the parent reloads the note after save
  // (or when a different wine's page reuses this instance).
  useEffect(() => {
    if (!editing) setDraft(initialNote ?? '');
  }, [initialNote, editing]);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setEditing(false);
  }

  function handleCancel() {
    setDraft(initialNote ?? '');
    setEditing(false);
  }

  const hasNote = !!initialNote?.trim();

  // Whole read-state area is the tap target when the user is the owner —
  // lower friction than hunting for a small "+ Add" link.
  const openEditor = () => { if (editable) setEditing(true); };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tasting Note</Text>
        {editable && !editing && hasNote && (
          <Pressable onPress={openEditor} hitSlop={6}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        )}
      </View>

      {editing ? (
        <>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
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
      ) : hasNote ? (
        <Pressable onPress={openEditor} disabled={!editable}>
          <Text style={styles.body}>{initialNote}</Text>
          {updatedAt ? (
            <Text style={styles.meta}>마지막 수정 · {timeAgo(updatedAt)}</Text>
          ) : null}
        </Pressable>
      ) : (
        <Pressable onPress={openEditor} disabled={!editable} style={styles.emptyBox}>
          <Text style={styles.empty}>
            {editable
              ? '박스를 탭하여 노트 작성 시작'
              : '아직 작성된 노트가 없어요.'}
          </Text>
        </Pressable>
      )}
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
