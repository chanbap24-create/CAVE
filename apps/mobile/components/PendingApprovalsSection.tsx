import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ApprovalWithDetails } from '@/lib/hooks/useGatheringApprovals';
import { ApprovalCard } from '@/components/ApprovalCard';

interface Props {
  approvals: ApprovalWithDetails[];
  currentUserId: string | null | undefined;
  /** True if the viewer can vote (host or approved member). Pending applicants cannot. */
  canVote: boolean;
  onVote: (approvalId: number, vote: 'approve' | 'reject') => Promise<boolean>;
  onCancel: (approvalId: number) => Promise<boolean>;
}

/**
 * List wrapper for pending gathering approvals (wine changes, no-wine
 * applies). Each row is a self-contained ApprovalCard.
 */
export function PendingApprovalsSection({
  approvals, currentUserId, canVote, onVote, onCancel,
}: Props) {
  if (approvals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pending Votes ({approvals.length})</Text>
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

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16 },
  heading: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 12 },
});
