import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useGatheringDetail } from '@/lib/hooks/useGatheringDetail';
import { getTopBadge } from '@/lib/tierUtils';
import { getGatheringChatRoom } from '@/lib/hooks/useChat';
import { ApplicantRow } from '@/components/ApplicantRow';
import { ApplyGatheringSheet } from '@/components/ApplyGatheringSheet';
import { GatheringWineLineup } from '@/components/GatheringWineLineup';
import { ChangeWineRequestSheet } from '@/components/ChangeWineRequestSheet';
import { PendingApprovalsSection } from '@/components/PendingApprovalsSection';
import { useGatheringApprovals } from '@/lib/hooks/useGatheringApprovals';
import type { LineupEntry } from '@/lib/hooks/useGatheringDetail';
import { UserAvatar } from '@/components/UserAvatar';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { formatDateFull } from '@/lib/utils/dateUtils';
import type { GatheringType } from '@/lib/types/gathering';

export default function GatheringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [gathering, setGathering] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const { members, lineup, myStatus, loadMembers, applyToJoin, respondToApplicant, leaveGathering } = useGatheringDetail(parseInt(id!));
  const { approvals, load: loadApprovals, requestWineChange, castVote, cancelRequest } = useGatheringApprovals(parseInt(id!));
  const [showApply, setShowApply] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [changeTarget, setChangeTarget] = useState<LineupEntry | null>(null);

  useEffect(() => {
    if (id) { loadGathering(); loadMembers(); loadApprovals(); }
  }, [id]);

  async function loadGathering() {
    const { data } = await supabase.from('gatherings').select('*').eq('id', id).single();
    if (data) {
      setGathering(data);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.host_id).single();
      setHost(profile);
    }
  }

  async function handleApply(message: string, collectionId: number | null) {
    const gatheringType = (gathering?.gathering_type ?? 'cost_share') as GatheringType;
    const success = await applyToJoin(message, collectionId, gatheringType);
    if (success) {
      setShowApply(false);
      Alert.alert('Applied!', 'Your request has been sent to the host');
    }
    return success;
  }

  function handleDeleteGathering() {
    const approvedCount = members.filter(m => m.status === 'approved').length;
    const warning = approvedCount > 0
      ? `${approvedCount}명의 참가자가 있습니다.\n모임을 삭제하면 채팅, 변경 요청, 참가자 정보까지 모두 사라집니다. 되돌릴 수 없습니다.`
      : '모임을 삭제하면 되돌릴 수 없습니다.';
    Alert.alert('모임 삭제', warning, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          // SECURITY DEFINER RPC (migration 00030/00031) cascades through
          // every child table without tripping RLS. Error tags from the
          // RPC are re-mapped to actionable alerts.
          const { data, error } = await supabase.rpc('delete_gathering_as_host', {
            p_gathering_id: gathering.id,
          });
          if (error) {
            const msg = error.message;
            const lower = msg.toLowerCase();
            if (lower.includes('no_auth')) {
              Alert.alert('세션 만료', '다시 로그인 후 시도해주세요.');
            } else if (lower.includes('not_found')) {
              // The row is gone server-side already — just refresh the list.
              Alert.alert('이미 삭제됨', '이 모임은 이미 삭제되어 있습니다.');
              router.replace('/(tabs)/gatherings');
            } else if (lower.includes('forbidden_mismatch')) {
              Alert.alert(
                '권한 불일치',
                `로그인한 계정과 모임 호스트 ID가 다릅니다.\n\n${msg}\n\n앱을 로그아웃 후 다시 로그인해보세요.`,
              );
            } else if (
              // PostgREST returns "Could not find the function ... in the
              // schema cache" when the RPC is missing; older wording is
              // "function ... does not exist".
              (lower.includes('could not find the function')) ||
              (lower.includes('function') && lower.includes('does not exist')) ||
              (lower.includes('schema cache'))
            ) {
              Alert.alert(
                '배포 필요',
                'delete_gathering_as_host RPC가 DB에 없습니다.\n\n터미널에서 아래 명령을 실행해주세요:\n\nsupabase db push\n\n그 후 이 앱을 새로 고침하고 다시 시도해주세요.',
              );
            } else {
              Alert.alert('Error', msg);
            }
            return;
          }
          // data contains { deleted: 1, id: N } on success.
          console.log('[delete_gathering_as_host]', data);
          router.replace('/(tabs)/gatherings');
        },
      },
    ]);
  }

  if (!gathering) return <View style={styles.container} />;

  const isHost = user?.id === gathering.host_id;
  const isClosed = gathering.status === 'closed' || gathering.current_members >= gathering.max_members;
  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gathering" left={<BackButton fallbackPath="/(tabs)/gatherings" />} />

      <ScrollView>
        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{gathering.title}</Text>
          {gathering.description && <Text style={styles.desc}>{gathering.description}</Text>}

          <View style={styles.hostRow}>
            <UserAvatar
              uri={host?.avatar_url}
              fallbackChar={host?.display_name?.[0]}
              collectionCount={host?.collection_count || 0}
              size="lg"
            />
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
              <Text style={styles.detailValue}>{formatDateFull(gathering.gathering_date)}</Text>
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

        {/* Wine Lineup — host slots + approved attendees */}
        <GatheringWineLineup
          entries={lineup}
          currentUserId={user?.id}
          pendingChangeIds={
            new Set(approvals
              .filter(a => a.request_type === 'wine_change' && a.target_contribution_id != null)
              .map(a => a.target_contribution_id as number))
          }
          onRequestChange={(entry) => setChangeTarget(entry)}
        />

        <PendingApprovalsSection
          approvals={approvals}
          currentUserId={user?.id}
          canVote={isHost || myStatus === 'approved'}
          onVote={async (aid, v) => {
            const ok = await castVote(aid, v);
            // A unanimous approve mutates the contribution, so reload the
            // lineup too. A reject just resolves the approval.
            if (ok) await loadMembers();
            return ok;
          }}
          onCancel={cancelRequest}
        />

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

      {isHost && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.deleteBtn} onPress={handleDeleteGathering}>
            <Text style={styles.deleteBtnText}>모임 삭제</Text>
          </Pressable>
        </View>
      )}

      <ApplyGatheringSheet
        visible={showApply}
        gatheringType={(gathering.gathering_type ?? 'cost_share') as GatheringType}
        onClose={() => setShowApply(false)}
        onSubmit={handleApply}
      />

      <ChangeWineRequestSheet
        visible={changeTarget != null}
        currentCollectionId={changeTarget?.collection_id ?? null}
        onClose={() => setChangeTarget(null)}
        onSubmit={async (newCollectionId, note) => {
          if (!changeTarget) return false;
          return requestWineChange(changeTarget.id, newCollectionId, note);
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  info: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 8 },
  desc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
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

  deleteBtn: {
    borderWidth: 1, borderColor: '#ed4956', padding: 14, borderRadius: 12,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#ed4956', fontSize: 14, fontWeight: '600' },
});
