import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { CategoryPicker } from '@/components/CategoryPicker';
import { GatheringTypeSelector } from '@/components/GatheringTypeSelector';
import { HostTypeSelector } from '@/components/HostTypeSelector';
import { BulletEditor } from '@/components/BulletEditor';
import { GatheringDateTimeRow } from '@/components/GatheringDateTimeRow';
import { HostWineSlots, type HostWineSlot } from '@/components/HostWineSlots';
import { CardTemplatePicker } from '@/components/CardTemplatePicker';
import { GatheringLivePreview } from '@/components/GatheringLivePreview';
import { GatheringCoverImageField } from '@/components/GatheringCoverImageField';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';
import { useIsPartner } from '@/lib/hooks/useIsPartner';
import { DEFAULT_CARD_TEMPLATE } from '@/lib/constants/cardTemplates';
import type { GatheringType } from '@/lib/types/gathering';
import type { GatheringHostType } from '@/lib/hooks/useGatherings';

export interface GatheringFormValue {
  title: string;
  /** 카드 hero 에 제목 아래로 들어갈 한 줄 카피 */
  subtitle: string;
  description: string;
  location: string;
  date: Date;
  maxMembers: string;
  price: string;
  category: string | null;
  gatheringType: GatheringType;
  /** 파트너만 'user' 외 값 사용 가능 (DB trigger 강제) */
  hostType: GatheringHostType;
  /** "이런 분께 추천" 픽업 라인 (최대 8) */
  pitchBullets: string[];
  /** "이 모임의 약속" — 참여 규칙·준비물 */
  agreement: string;
  /** 발견 탭 카드 디자인 템플릿 키 (cardTemplates.ts) */
  cardTemplate: string;
  /** 카드 hero 커버 이미지 — 로컬 URI (submit 시 storage 업로드). 미선택은 null */
  coverImageUri: string | null;
  hostWineSlots: HostWineSlot[];
}

export function emptyGatheringForm(): GatheringFormValue {
  return {
    title: '', subtitle: '', description: '', location: '',
    date: new Date(), maxMembers: '8', price: '', category: null,
    gatheringType: 'cost_share', hostType: 'user',
    pitchBullets: [], agreement: '',
    cardTemplate: DEFAULT_CARD_TEMPLATE,
    coverImageUri: null,
    hostWineSlots: [],
  };
}

// Context-aware label for the host wine slot section. All three types allow
// host-committed wines, but what the slots mean differs — labels should
// reflect the user's mental model instead of being identical everywhere.
function gatheringTypeWineLabel(type: GatheringType): string {
  if (type === 'cost_share') return '준비할 와인 * (블라인드 가능)';
  if (type === 'byob') return '내가 가져갈 와인 *';
  return '제공할 와인 (optional, 블라인드 가능)';
}

interface Props {
  value: GatheringFormValue;
  onChange: (next: GatheringFormValue) => void;
  /** Optional submit button rendered at the end of the form. Makes the
   *  create action reachable without scrolling back up to the sheet header,
   *  which users were missing on long forms. */
  onSubmit?: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

/** All form inputs for a new gathering. Caller owns submit + reset. */
export function GatheringForm({ value, onChange, onSubmit, submitting, submitLabel = '모임 만들기' }: Props) {
  const { categories } = useDrinkCategories();
  const { isPartner, partnerLabel } = useIsPartner();

  function set<K extends keyof GatheringFormValue>(key: K, v: GatheringFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
      {/* 라이브 프리뷰 — 입력값/템플릿이 바뀌면 즉시 반영 */}
      <GatheringLivePreview
        templateKey={value.cardTemplate}
        title={value.title}
        subtitle={value.subtitle}
        imageUri={value.coverImageUri}
      />

      <Text style={styles.label}>제목 *</Text>
      <TextInput
        style={styles.input}
        value={value.title}
        onChangeText={t => set('title', t)}
        placeholder="예: 부르고뉴 블라인드 시음회"
        placeholderTextColor="#ccc"
        maxLength={60}
      />

      <Text style={styles.label}>부제 (선택)</Text>
      <TextInput
        style={styles.input}
        value={value.subtitle}
        onChangeText={t => set('subtitle', t)}
        placeholder="예: 1er Cru 4종 블라인드 · 호스트 노트 제공"
        placeholderTextColor="#ccc"
        maxLength={200}
      />

      <Text style={styles.label}>커버 이미지 (선택)</Text>
      <Text style={styles.hint}>1:1 정사각이 가장 깔끔하게 들어가요</Text>
      <GatheringCoverImageField
        value={value.coverImageUri}
        onChange={uri => set('coverImageUri', uri)}
      />

      <Text style={styles.label}>카드 디자인 *</Text>
      <Text style={styles.hint}>발견 탭에 노출될 컬러·번호·배치를 골라요</Text>
      <CardTemplatePicker
        value={value.cardTemplate}
        onChange={k => set('cardTemplate', k)}
      />

      <Text style={styles.label}>설명 (마크다운 가능 — **굵게**, # 제목, - 목록)</Text>
      <TextInput
        style={[styles.input, { height: 180, textAlignVertical: 'top' }]}
        value={value.description}
        onChangeText={t => set('description', t)}
        placeholder={
          '어떤 모임인지 자유롭게 적어주세요.\n\n' +
          '예시:\n## 왜 이 와인인가\n부르고뉴 1er Cru 4종을 블라인드로...\n\n' +
          '- 사전 학습 X, 호스트가 노트 제공\n- 음식 페어링 한식 캐주얼'
        }
        placeholderTextColor="#ccc"
        multiline
        maxLength={5000}
      />

      <Text style={styles.label}>이런 분께 추천해요 (최대 8줄)</Text>
      <BulletEditor
        bullets={value.pitchBullets}
        onChange={b => set('pitchBullets', b)}
        placeholder="예: 부르고뉴를 처음 본격적으로 마셔보고 싶은 분"
      />

      <Text style={styles.label}>이 모임의 약속 (선택)</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        value={value.agreement}
        onChangeText={t => set('agreement', t)}
        placeholder="예: 첫 30분은 휴대폰을 내려놓고, 한 사람씩 첫인상을 나눠요."
        placeholderTextColor="#ccc"
        multiline
        maxLength={2000}
      />

      {isPartner && (
        <>
          <Text style={styles.label}>호스트 (파트너 전용)</Text>
          <HostTypeSelector
            value={value.hostType}
            onChange={v => set('hostType', v)}
            partnerLabel={partnerLabel}
          />
        </>
      )}

      <Text style={styles.label}>유형 *</Text>
      <GatheringTypeSelector
        value={value.gatheringType ?? 'cost_share'}
        onChange={v => set('gatheringType', v)}
      />

      <Text style={styles.label}>
        {gatheringTypeWineLabel(value.gatheringType ?? 'cost_share')}
      </Text>
      <HostWineSlots
        slots={value.hostWineSlots ?? []}
        onChange={s => set('hostWineSlots', s)}
        requireAtLeastOne={(value.gatheringType ?? 'cost_share') !== 'donation'}
        allowBlind={(value.gatheringType ?? 'cost_share') !== 'byob'}
      />

      <Text style={styles.label}>카테고리 (선택)</Text>
      <CategoryPicker
        categories={categories}
        selected={value.category}
        onChange={k => set('category', k)}
      />

      <Text style={styles.label}>장소 *</Text>
      <TextInput
        style={styles.input}
        value={value.location}
        onChangeText={t => set('location', t)}
        placeholder="예: 청담 르 바"
        placeholderTextColor="#ccc"
      />

      <GatheringDateTimeRow date={value.date} onChange={d => set('date', d)} />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>최대 인원</Text>
          <TextInput
            style={styles.input}
            value={value.maxMembers}
            onChangeText={t => set('maxMembers', t)}
            placeholder="8"
            placeholderTextColor="#ccc"
            keyboardType="number-pad"
          />
        </View>
        {value.gatheringType === 'cost_share' && (
          <View style={styles.half}>
            <Text style={styles.label}>가격 (원)</Text>
            <TextInput
              style={styles.input}
              value={value.price}
              onChangeText={t => set('price', t)}
              placeholder="1인당"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
            />
          </View>
        )}
      </View>

      {onSubmit && (
        <Pressable
          style={[styles.submit, submitting && { opacity: 0.5 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? '...' : submitLabel}</Text>
        </Pressable>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6, marginTop: 16 },
  hint: { fontSize: 11, color: '#bbb', marginTop: -2, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  submit: {
    marginTop: 24, backgroundColor: '#7b2d4e',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
