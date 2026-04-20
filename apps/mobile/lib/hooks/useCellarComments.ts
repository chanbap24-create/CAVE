import { useCommentsTarget } from '@/lib/hooks/useCommentsTarget';

/** Comments on a user's whole cellar (one target per profile). */
export function useCellarComments(ownerId: string | null) {
  return useCommentsTarget(
    { table: 'cellar_comments', targetColumn: 'owner_id' },
    ownerId,
  );
}
