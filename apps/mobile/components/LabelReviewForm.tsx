import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { CategoryPicker } from '@/components/CategoryPicker';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';
import type { DrinkCategory, ExtractedWineInfo, VintageType } from '@/lib/types/wine';

export interface ReviewFormValue {
  name: string;
  producer: string;
  region: string;
  country: string;
  vintage: string; // stored as text to allow "" while editing; parsed on save
  vintageType: VintageType; // 'year' | 'nv' | 'mv' — 'year' pairs with `vintage`
  category: DrinkCategory;
  /** 등록할 보틀 수 (1 이상). text로 보관해 비어있을 때 편집 가능. */
  quantity: string;
}

interface Props {
  value: ReviewFormValue;
  onChange: (next: ReviewFormValue) => void;
}

export function emptyFormValue(): ReviewFormValue {
  return {
    name: '', producer: '', region: '', country: '',
    vintage: '', vintageType: 'year', category: 'wine',
    quantity: '1',
  };
}

export function fromExtracted(e: ExtractedWineInfo): ReviewFormValue {
  // Prefer the model's explicit vintage_type; otherwise infer from whether
  // a year is present.
  const vintageType: VintageType = e.vintage_type ?? (e.vintage_year ? 'year' : 'year');
  return {
    name: e.name ?? '',
    producer: e.producer ?? '',
    region: e.region ?? '',
    country: e.country ?? '',
    vintage: e.vintage_year ? String(e.vintage_year) : '',
    vintageType,
    category: e.category,
    quantity: '1',
  };
}

/** form.quantity 문자열을 1 이상 정수로 변환. 빈/0/음수는 1로 보정. 상한 99. */
export function parseQuantity(q: string | undefined): number {
  const n = parseInt(q || '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 99);
}

export function LabelReviewForm({ value, onChange }: Props) {
  const { categories } = useDrinkCategories();

  function set<K extends keyof ReviewFormValue>(key: K, v: ReviewFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  const qty = parseQuantity(value.quantity);

  return (
    <View>
      <Field label="와인 이름" required>
        <TextInput
          style={styles.input}
          value={value.name}
          onChangeText={t => set('name', t)}
          placeholder="예: Château Margaux"
          placeholderTextColor="#ccc"
        />
      </Field>

      <Field label="생산자">
        <TextInput
          style={styles.input}
          value={value.producer}
          onChangeText={t => set('producer', t)}
          placeholder="와이너리 / 증류소"
          placeholderTextColor="#ccc"
        />
      </Field>

      <View style={styles.row}>
        <Field label="지역" style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={value.region}
            onChangeText={t => set('region', t)}
            placeholder="Bordeaux"
            placeholderTextColor="#ccc"
          />
        </Field>
        <Field label="국가" style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={value.country}
            onChangeText={t => set('country', t)}
            placeholder="France"
            placeholderTextColor="#ccc"
          />
        </Field>
      </View>

      <Field label="빈티지">
        <View style={styles.vintageRow}>
          <VintageTab label="연도" active={value.vintageType === 'year'} onPress={() => set('vintageType', 'year')} />
          <VintageTab label="NV" active={value.vintageType === 'nv'} onPress={() => { set('vintageType', 'nv'); set('vintage', ''); }} />
          <VintageTab label="MV" active={value.vintageType === 'mv'} onPress={() => { set('vintageType', 'mv'); set('vintage', ''); }} />
        </View>
        {value.vintageType === 'year' && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={value.vintage}
            onChangeText={t => set('vintage', t.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="2015"
            placeholderTextColor="#ccc"
            keyboardType="number-pad"
            maxLength={4}
          />
        )}
      </Field>

      <Field label="카테고리">
        <CategoryPicker
          categories={categories}
          selected={value.category}
          onChange={k => set('category', (k ?? 'wine') as DrinkCategory)}
        />
      </Field>

      <Field label="수량 (병)">
        <View style={styles.qtyRow}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => set('quantity', String(Math.max(1, qty - 1)))}
            hitSlop={6}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <TextInput
            style={styles.qtyInput}
            value={value.quantity}
            onChangeText={t => set('quantity', t.replace(/[^0-9]/g, '').slice(0, 2))}
            placeholder="1"
            placeholderTextColor="#ccc"
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
          />
          <Pressable
            style={styles.qtyBtn}
            onPress={() => set('quantity', String(Math.min(99, qty + 1)))}
            hitSlop={6}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>
      </Field>
    </View>
  );
}

function VintageTab({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.vintageTab, active && styles.vintageTabActive]}
    >
      <Text style={[styles.vintageTabText, active && styles.vintageTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  children,
  required,
  style,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  style?: any;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6 },
  required: { color: '#ed4956' },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  vintageRow: { flexDirection: 'row', gap: 8 },
  vintageTab: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  vintageTabActive: { backgroundColor: '#f7f0f3', borderColor: '#7b2d4e' },
  vintageTabText: { fontSize: 13, fontWeight: '500', color: '#999' },
  vintageTabTextActive: { color: '#7b2d4e', fontWeight: '700' },

  // 수량 ± 버튼 (order/new 와 톤 통일)
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 8,
    borderWidth: 1, borderColor: '#eee',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  qtyBtnText: { fontSize: 20, fontWeight: '600', color: '#222' },
  qtyInput: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingVertical: 10, fontSize: 18, fontWeight: '700',
    backgroundColor: '#fafafa', color: '#222',
  },
});
