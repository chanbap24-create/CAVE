import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { ApprovalWithDetails, ApprovalWine } from '@/lib/hooks/useGatheringApprovals';

interface Props {
  approvals: ApprovalWithDetails[];
  currentUserId: string | null | undefined;
  /** True if the viewer can vote (host or approved member). Pending applicants cannot. */
  canVote: boolean;
  onVote: (approvalId: number, vote: 'approve' | 'reject') => Promise<boolean>;
  onCancel: (approvalId: number) => Promise<boolean>;
}

export function PendingApprovalsSection({
  approvals, currentUserId, canVote, onVote, onCancel,
}: Props) {
  if (approvals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pending Change Requests ({approvals.length})</Text>
      {approvals.map(a => (
        <ApprovalCard
          key={a.id}
          approval={a}
          currentUserId={currentUserId}
          canVote={canVote}
          onVote={onVote}
          onCancel={onCancel}
        />
      ))}
    </View>
  );
}

function ApprovalCard({
  approval, currentUserId, canVote, onVote, onCancel,
}: {
  approval: ApprovalWithDetails;
  currentUserId: string | null | undefined;
  canVote: boolean;
  onVote: (approvalId: number, vote: 'approve' | 'reject') => Promise<boolean>;
  onCancel: (approvalId: number) => Promise<boolean>;
}) {
  const isRequester = currentUserId === approval.requester_id;
  const myVote = approval.votes.find(v => v.voter_id === currentUserId);
  const approveCount = approval.votes.filter(v => v.vote === 'approve').length;
  const rejectCount = approval.votes.filter(v => v.vote === 'reject').length;

  return (
    <View style={styles.card}>
      <Text style={styles.requester}>
        @{approval.requester_username ?? '—'} 님이 변경 요청
      </Text>

      <View style={styles.swapRow}>
        <WineMini wine={approval.current_wine} label="Current" dimmed />
        <Text style={styles.arrow}>→</Text>
        <WineMini wine={approval.proposed_wine} label="Proposed" />
      </View>

      {approval.note ? (
        <Text style={styles.note}>"{approval.note}"</Text>
      ) : null}

      <View style={styles.tally}>
        <Text style={styles.tallyText}>
          ✓ {approveCount} / {approval.eligible_count}
          {rejectCount > 0 ? `  ✗ ${rejectCount}` : ''}
        </Text>
        {rejectCount === 0 && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (approveCount / Math.max(1, approval.eligible_count)) * 100)}%` },
              ]}
            />
          </View>
        )}
      </View>

      {/* Actions: requester can withdraw; eligible voters see approve/reject
          unless they've already voted. */}
      {isRequester ? (
        <Pressable
          style={[styles.actionBtn, styles.cancelBtn]}
          onPress={() => onCancel(approval.id)}
        >
          <Text style={styles.cancelText}>요청 취소</Text>
        </Pressable>
      ) : canVote ? (
        myVote ? (
          <View style={styles.votedBadge}>
            <Text style={styles.votedText}>
              {myVote.vote === 'approve' ? '✓ 승인함' : '✗ 반대함'}
            </Text>
          </View>
        ) : (
          <View style={styles.voteRow}>
            <Pressable
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onVote(approval.id, 'approve')}
            >
              <Text style={styles.approveText}>승인</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => onVote(approval.id, 'reject')}
            >
              <Text style={styles.rejectText}>반대</Text>
            </Pressable>
          </View>
        )
      ) : (
        <Text style={styles.waiting}>투표 대기중</Text>
      )}
    </View>
  );
}

function WineMini({
  wine, label, dimmed,
}: { wine: ApprovalWine | null; label: string; dimmed?: boolean }) {
  return (
    <View style={[styles.wineMini, dimmed && { opacity: 0.55 }]}>
      {wine?.photo_url || wine?.image_url ? (
        <Image
          source={wine.photo_url ?? wine.image_url!}
          style={styles.miniThumb}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.miniThumb, styles.miniPlaceholder]} />
      )}
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniName} numberOfLines={2}>
        {wine?.name ?? '—'}
      </Text>
      {wine?.producer ? (
        <Text style={styles.miniProducer} numberOfLines={1}>{wine.producer}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16 },
  heading: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 12 },

  card: {
    backgroundColor: '#fffbf4', borderRadius: 14,
    borderWidth: 1, borderColor: '#f0e2c8',
    padding: 14, marginBottom: 12,
  },
  requester: { fontSize: 13, fontWeight: '600', color: '#8a6d3b', marginBottom: 12 },

  swapRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, paddingVertical: 4,
  },
  arrow: { fontSize: 20, color: '#8a6d3b', marginTop: 20 },
  wineMini: { flex: 1, alignItems: 'center' },
  miniThumb: {
    width: 56, height: 56, borderRadius: 8,
    backgroundColor: '#f0f0f0', marginBottom: 6,
  },
  miniPlaceholder: { backgroundColor: '#f0f0f0' },
  miniLabel: { fontSize: 10, fontWeight: '600', color: '#8a6d3b', marginBottom: 2 },
  miniName: {
    fontSize: 12, fontWeight: '600', color: '#222',
    textAlign: 'center', lineHeight: 16,
  },
  miniProducer: { fontSize: 10, color: '#7b2d4e', fontWeight: '500', marginTop: 2, textAlign: 'center' },

  note: {
    fontSize: 12, color: '#555', marginTop: 12,
    backgroundColor: '#fff', padding: 10, borderRadius: 8,
    lineHeight: 17,
  },

  tally: { marginTop: 12 },
  tallyText: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  progressTrack: {
    height: 6, backgroundColor: '#f0e2c8', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#8a6d3b' },

  voteRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: '#7b2d4e' },
  approveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rejectBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  rejectText: { color: '#999', fontSize: 14, fontWeight: '600' },
  cancelBtn: {
    marginTop: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ed4956',
  },
  cancelText: { color: '#ed4956', fontSize: 13, fontWeight: '600' },

  votedBadge: {
    marginTop: 14, paddingVertical: 10,
    backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center',
  },
  votedText: { fontSize: 12, fontWeight: '600', color: '#555' },

  waiting: {
    marginTop: 14, textAlign: 'center',
    fontSize: 11, color: '#999', fontStyle: 'italic',
  },
});
