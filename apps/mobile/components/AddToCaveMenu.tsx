import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSearch: () => void;
  onScan: () => void;
}

export function AddToCaveMenu({ visible, onClose, onSearch, onScan }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add to Cave</Text>

          <Pressable style={styles.option} onPress={() => { onClose(); onSearch(); }}>
            <View style={styles.iconWrap}>
              <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
                <Circle cx={11} cy={11} r={8} />
                <Path d="M21 21l-4.35-4.35" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Search Database</Text>
              <Text style={styles.optDesc}>Pick from 130K+ wines, whiskies, spirits</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={() => { onClose(); onScan(); }}>
            <View style={styles.iconWrap}>
              <Svg width={22} height={22} fill="none" stroke="#7b2d4e" strokeWidth={1.8} viewBox="0 0 24 24">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <Circle cx={12} cy={13} r={4} />
                <Rect x={7} y={9} width={10} height={8} rx={1} ry={1} />
                <Polyline points="9 13 11 15 15 11" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Scan Label</Text>
              <Text style={styles.optDesc}>Photograph a bottle to auto-fill details</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  title: {
    fontSize: 15, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef', marginBottom: 6,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 16, paddingHorizontal: 20,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f7f0f3',
    alignItems: 'center', justifyContent: 'center',
  },
  optTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  optDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  arrow: { fontSize: 20, color: '#ccc' },
});
