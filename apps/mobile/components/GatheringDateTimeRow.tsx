import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatPickerDate, formatPickerTime } from '@/lib/utils/dateUtils';

interface Props {
  date: Date;
  onChange: (d: Date) => void;
}

/** Date + time picker row, extracted so GatheringForm stays under the
 *  200-line cap. Internal show/hide state for the spinner modals. */
export function GatheringDateTimeRow({ date, onChange }: Props) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  return (
    <>
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>날짜 *</Text>
          <Pressable style={styles.btn} onPress={() => setShowDate(true)}>
            <Text style={styles.text}>{formatPickerDate(date)}</Text>
          </Pressable>
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>시간</Text>
          <Pressable style={styles.btn} onPress={() => setShowTime(true)}>
            <Text style={styles.text}>{formatPickerTime(date)}</Text>
          </Pressable>
        </View>
      </View>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setShowDate(false);
            if (selected) {
              const d = new Date(date);
              d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
              onChange(d);
            }
          }}
        />
      )}

      {showTime && (
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          minuteInterval={15}
          onChange={(_, selected) => {
            setShowTime(false);
            if (selected) {
              const d = new Date(date);
              d.setHours(selected.getHours(), selected.getMinutes());
              onChange(d);
            }
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6, marginTop: 16 },
  btn: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  text: { fontSize: 15, color: '#222' },
});
