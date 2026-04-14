import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Alert } from 'react-native';

export interface GatheringMember {
  user_id: string;
  status: string;
  message: string | null;
  responded_at: string | null;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    collection_count: number;
  };
}

export function useGatheringDetail(gatheringId: number) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GatheringMember[]>([]);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from('gathering_members')
      .select('*')
      .eq('gathering_id', gatheringId);

    if (!data) { setLoading(false); return; }

    // Get profiles
    const userIds = data.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, collection_count')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const enriched = data.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id),
    }));

    setMembers(enriched);

    if (user) {
      const mine = data.find(m => m.user_id === user.id);
      setMyStatus(mine?.status || null);
    }

    setLoading(false);
  }, [gatheringId, user]);

  async function applyToJoin(message: string) {
    if (!user) return false;

    const { error } = await supabase.from('gathering_members').insert({
      gathering_id: gatheringId,
      user_id: user.id,
      status: 'pending',
      message: message.trim() || null,
    });

    if (error) {
      Alert.alert('Error', error.message);
      return false;
    }

    // Notify host
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('host_id, title')
      .eq('id', gatheringId)
      .single();

    if (gathering && gathering.host_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: gathering.host_id,
        type: 'gathering_invite',
        actor_id: user.id,
        reference_id: gatheringId.toString(),
        reference_type: 'gathering',
        body: `wants to join "${gathering.title}"`,
      });
    }

    setMyStatus('pending');
    await loadMembers();
    return true;
  }

  async function respondToApplicant(applicantUserId: string, approve: boolean) {
    if (!user) return;

    const newStatus = approve ? 'approved' : 'rejected';
    await supabase
      .from('gathering_members')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('gathering_id', gatheringId)
      .eq('user_id', applicantUserId);

    // Notify applicant
    const notifType = approve ? 'gathering_approved' : 'gathering_rejected';
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('title')
      .eq('id', gatheringId)
      .single();

    await supabase.from('notifications').insert({
      user_id: applicantUserId,
      type: notifType,
      actor_id: user.id,
      reference_id: gatheringId.toString(),
      reference_type: 'gathering',
      body: approve
        ? `approved your request to join "${gathering?.title}"`
        : `declined your request to join "${gathering?.title}"`,
    });

    await loadMembers();
  }

  async function leaveGathering() {
    if (!user) return;
    await supabase
      .from('gathering_members')
      .delete()
      .eq('gathering_id', gatheringId)
      .eq('user_id', user.id);
    setMyStatus(null);
    await loadMembers();
  }

  return { members, myStatus, loading, loadMembers, applyToJoin, respondToApplicant, leaveGathering };
}
