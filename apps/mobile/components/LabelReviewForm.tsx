import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CategoryPicker } from '@/components/CategoryPicker';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';
import type { DrinkCategory, ExtractedWineInfo } from '@/lib/types/wine';

export interface ReviewFormValue {
  name: string;
  producer: string;
  region: string;
  country: string;
  vintage: string; // stored as text to allow "" while editing; parsed on save
  category: DrinkCategory;
}

interface Props {
  value: ReviewFormValue;
  onChange: (next: ReviewFormValue) => void;
}

export function emptyFormValue(): ReviewFormValue {
  return { name: '', producer: '', region: '', country: '', vintage: '', category: 'wine' };
}

export function fromExtracted(e: ExtractedWineInfo): ReviewFormValue {
  return {
    name: e.name ?? '',
    producer: e.producer ?? '',
    region: e.region ?? '',
    country: e.country ?? '',
    vintage: e.vintage_year ? String(e.vintage_year) : '',
    category: e.category,
  };
}

export function LabelReviewForm({ value, onChange }: Props) {
  const { categories } = useDrinkCategories();

  function set<K extends keyof ReviewFormValue>(key: K, v: ReviewFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <View>
      <Field label="Name" required>
        <TextInput
          style={styles.input}
          value={value.name}
          onChangeText={t => set('name', t)}
          placeholder="e.g. Château Margaux"
          placeholderTextColor="#ccc"
        />
      </Field>

      <Field label="Producer">
        <TextInput
          style={styles.input}
          value={value.producer}
          onChangeText={t => set('producer', t)}
          placeholder="Winery / Distillery"
          placeholderTextColor="#ccc"
        />
      </Field>

      <View style={styles.row}>
        <Field label="Region" style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={value.region}
            onChangeText={t => set('region', t)}
            placeholder="Bordeaux"
            placeholderTextColor="#ccc"
          />
        </Field>
        <Field label="Country" style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={value.country}
            onChangeText={t => set('country', t)}
            placeholder="France"
            placeholderTextColor="#ccc"
          />
        </Field>
      </View>

      <Field label="Vintage">
        <TextInput
          style={styles.input}
          value={value.vintage}
          onChangeText={t => set('vintage', t.replace(/[^0-9]/g, '').slice(0, 4))}
          placeholder="2015"
          placeholderTextColor="#ccc"
          keyboardType="number-pad"
          maxLength={4}
        />
      </Field>

      <Field label="Category">
        <CategoryPicker
          categories={categories}
          selected={value.category}
          onChange={k => set('category', (k ?? 'wine') as DrinkCategory)}
        />
      </Field>
    </View>
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
});
