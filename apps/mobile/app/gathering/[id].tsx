import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useGatheringDetail } from '@/lib/hooks/useGatheringDetail';
import { getAvatarRingColor, getTopBadge } from '@/lib/tierUtils';
import { getGatheringChatRoom } from '@/lib/hooks/useChat';
import { ApplicantRow } from '@/components/ApplicantRow';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} (${days[d.getDay()]}) ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function GatheringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [gathering, setGathering] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const { members, myStatus, loadMembers, applyToJoin, respondToApplicant, leaveGathering } = useGatheringDetail(parseInt(id!));
  const [showApply, setShowApply] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (id) { loadGathering(); loadMembers(); }
  }, [id]);

  async function loadGathering() {
    const { data } = await supabase.from('gatherings').select('*').eq('id', id).single();
    if (data) {
      setGathering(data);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.host_id).single();
      setHost(profile);
    }
  }

  async function handleApply() {
    setApplying(true);
    const success = await applyToJoin(applyMessage);
    setApplying(false);
    if (success) {
      setShowApply(false);
      setApplyMessage('');
      Alert.alert('Applied!', 'Your request has been sent to the host');
    }
  }

  if (!gathering) return <View style={styles.container} />;

  const isHost = user?.id === gathering.host_id;
  const isClosed = gathering.status === 'closed' || gathering.current_members >= gathering.max_members;
  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/gatherings')} style={styles.backBtn}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Gathering</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{gathering.title}</Text>
          {gathering.description && <Text style={styles.desc}>{gathering.description}</Text>}

          <View style={styles.hostRow}>
            {(() => {
              const rc = getAvatarRingColor(host?.collection_count || 0);
              return host?.avatar_url ? (
                <View style={rc ? [styles.avatarGlow, { shadowColor: rc }] : undefined}>
                  <Image source={{ uri: host.avatar_url }} style={[styles.hostAvatarImg, rc && { borderWidth: 2, borderColor: rc }]} />
                </View>
              ) : (
                <View style={[styles.hostAvatar, rc && { borderWidth: 2, borderColor: rc }]}>
                  <Text style={styles.hostAvatarText}>{host?.display_name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
              );
            })()}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.hostName}>{host?.username}</Text>
                {(() => {
                  const b = getTopBadge(host?.collection_count || 0);
                  return b ? (
                    <View style={{ backgroundColor: b.bg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: b.color }}>{b.name}</Text>
                    </View>
                  ) : null;
                })()}
              </View>
              <Text style={styles.hostLabel}>Host</Text>
            </View>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(gathering.gathering_date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{gathering.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Members</Text>
              <Text style={styles.detailValue}>{gathering.current_members} / {gathering.max_members}</Text>
            </View>
            {gathering.price_per_person && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailPrice}>{gathering.price_per_person.toLocaleString()}won</Text>
              </View>
            )}
          </View>

          {/* Chat button for host and approved members */}
          {(isHost || myStatus === 'approved') && (
            <Pressable
              style={({ pressed }) => [styles.chatBtn, pressed && styles.chatBtnPressed]}
              onPress={async () => {
                if (!user) return;
                setChatLoading(true);
                const roomId = await getGatheringChatRoom(parseInt(id!), user.id);
                setChatLoading(false);
                if (roomId) router.push(`/chat/${roomId}?title=${encodeURIComponent(gathering.title)}`);
                else Alert.alert('Error', 'Could not open chat');
              }}
              disabled={chatLoading}
            >
              <Text style={styles.chatBtnText}>{chatLoading ? 'Opening...' : 'Group Chat'}</Text>
            </Pressable>
          )}
        </View>

        {/* Approved Members */}
        {approvedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Members ({approvedMembers.length})</Text>
            {approvedMembers.map(m => (
              <ApplicantRow key={m.user_id} member={m} />
            ))}
          </View>
        )}

        {/* Host: Pending Applicants */}
        {isHost && pendingMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending ({pendingMembers.length})</Text>
            {pendingMembers.map(m => (
              <ApplicantRow
                key={m.user_id}
                member={m}
                showActions
                onApprove={() => respondToApplicant(m.user_id, true)}
                onReject={() => respondToApplicant(m.user_id, false)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Action */}
      {!isHost && !myStatus && !isClosed && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.applyBtn} onPress={() => setShowApply(true)}>
            <Text style={styles.applyBtnText}>Apply to Join</Text>
          </Pressable>
        </View>
      )}

      {!isHost && (myStatus === 'approved' || myStatus === 'pending') && (
        <View style={styles.bottomBar}>
          <View style={[styles.statusBar, myStatus === 'approved' && { backgroundColor: '#e8f5e9' }]}>
            <Text style={[styles.statusText, myStatus === 'approved' && { color: '#2e7d32' }]}>
              {myStatus === 'approved' ? "You're in!" : 'Request pending...'}
            </Text>
          </View>
          <Pressable style={styles.leaveBtn} onPress={() => {
            Alert.alert('Leave', 'Are you sure you want to leave this gathering?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: leaveGathering },
            ]);
          }}>
            <Text style={styles.leaveText}>Leave</Text>
          </Pressable>
        </View>
      )}

      {/* Apply Modal */}
      <Modal visible={showApply} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowApply(false)} />
        <View style={styles.applySheet}>
          <View style={styles.handle} />
          <Text style={styles.applyTitle}>Apply to Join</Text>
          <Text style={styles.applyDesc}>Send a message to the host</Text>
          <TextInput
            style={styles.applyInput}
            value={applyMessage}
            onChangeText={setApplyMessage}
            placeholder="Introduce yourself..."
            placeholderTextColor="#ccc"
            multiline
            maxLength={200}
          />
          <Pressable
            style={[styles.applySubmitBtn, applying && { opacity: 0.5 }]}
            onPress={handleApply}
            disabled={applying}
          >
            <Text style={styles.applySubmitText}>{applying ? 'Sending...' : 'Send Request'}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#222' },

  info: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 8 },
  desc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  hostAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  hostAvatarText: { fontSize: 16, fontWeight: '600', color: '#999' },
  avatarGlow: {
    borderRadius: 24, padding: 1,
    shadowColor: '#c9a84c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarGoldBorder: { borderWidth: 2, borderColor: '#c9a84c' },
  hostName: { fontSize: 15, fontWeight: '600', color: '#222' },
  hostLabel: { fontSize: 11, color: '#7b2d4e', fontWeight: '500' },

  detailsBox: { backgroundColor: '#fafafa', borderRadius: 12, padding: 16, gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: '#999' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#222' },
  detailPrice: { fontSize: 15, fontWeight: '700', color: '#7b2d4e' },

  section: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 12 },

  chatBtn: {
    backgroundColor: '#222', padding: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 16,
  },
  chatBtnPressed: { opacity: 0.6 },
  chatBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  bottomBar: { padding: 20, paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#efefef' },
  applyBtn: { backgroundColor: '#7b2d4e', padding: 16, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusBar: {
    backgroundColor: '#fafafa', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  statusText: { fontSize: 14, fontWeight: '500', color: '#999' },
  leaveBtn: { alignItems: 'center', marginTop: 10 },
  leaveText: { fontSize: 13, fontWeight: '500', color: '#ed4956' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  applySheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16,
  },
  applyTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4 },
  applyDesc: { fontSize: 13, color: '#999', marginBottom: 16 },
  applyInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
    height: 100, textAlignVertical: 'top',
  },
  applySubmitBtn: {
    backgroundColor: '#7b2d4e', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 16,
  },
  applySubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
