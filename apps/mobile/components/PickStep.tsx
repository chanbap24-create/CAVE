import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

interface Props {
  onTakePhoto: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
}

export function PickStep({ onTakePhoto, onPickImage, onPickVideo }: Props) {
  return (
    <View style={styles.pickContent}>
      <Pressable style={styles.option} onPress={onTakePhoto}>
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

      <Pressable style={styles.option} onPress={onPickImage}>
        <View style={styles.iconWrap}>
          <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
            <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
            <Circle cx={8.5} cy={8.5} r={1.5} />
            <Polyline points="21 15 16 10 5 21" />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optTitle}>Photo from Gallery</Text>
          <Text style={styles.optDesc}>Select a saved photo</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable style={styles.option} onPress={onPickVideo}>
        <View style={styles.iconWrap}>
          <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
            <Path d="M23 7l-7 5 7 5V7z" />
            <Rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optTitle}>Video from Gallery</Text>
          <Text style={styles.optDesc}>Share a video (max 60s)</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
