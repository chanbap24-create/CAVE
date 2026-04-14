import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Alert } from 'react-native';

export interface CreateGatheringInput {
  title: string;
  description: string;
  location: string;
  gatheringDate: Date;
  maxMembers: number;
  pricePerPerson: number | null;
}

export function useCreateGathering(onCreated?: () => void) {
  const { user } = useAuth();

  async function createGathering(input: CreateGatheringInput) {
    if (!user) return false;
    if (!input.title.trim()) { Alert.alert('', 'Title is required'); return false; }
    if (!input.location.trim()) { Alert.alert('', 'Location is required'); return false; }

    const { error } = await supabase.from('gatherings').insert({
      host_id: user.id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      location: input.location.trim(),
      gathering_date: input.gatheringDate.toISOString(),
      max_members: input.maxMembers,
      price_per_person: input.pricePerPerson,
      status: 'open',
    });

    if (error) {
      Alert.alert('Error', error.message);
      return false;
    }

    onCreated?.();
    return true;
  }

  return { createGathering };
}
