// Types for the gathering host/attendee wine system introduced in
// migration 00029. Imported by hooks + UI; keep aligned with the CHECK
// constraints in the SQL to avoid runtime surprises.

export type GatheringType = 'cost_share' | 'byob' | 'donation';

export type ContributionStatus = 'pending' | 'committed' | 'canceled';

export interface GatheringContribution {
  id: number;
  gathering_id: number;
  user_id: string;
  /** null when is_blind=true (host surprise slot) or when it's a no-wine attendance request. */
  collection_id: number | null;
  is_blind: boolean;
  slot_order: number;
  note: string | null;
  status: ContributionStatus;
  created_at: string;

  // Joined on fetch — shape depends on the query's select clause.
  wine?: {
    id: number;
    name: string;
    category: string;
    region: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
  collection_photo_url?: string | null;
  user?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export type ApprovalRequestType = 'wine_change' | 'no_wine_apply';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'canceled';

export interface GatheringApproval {
  id: number;
  gathering_id: number;
  requester_id: string;
  request_type: ApprovalRequestType;
  target_contribution_id: number | null;
  new_collection_id: number | null;
  note: string | null;
  status: ApprovalStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface ApprovalVote {
  approval_id: number;
  voter_id: string;
  vote: 'approve' | 'reject';
  created_at: string;
}
