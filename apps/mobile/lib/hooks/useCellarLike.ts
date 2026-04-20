import { useLikeTarget } from '@/lib/hooks/useLikeTarget';

/** Like / unlike a user's whole cellar (one target per profile). */
export function useCellarLike(ownerId: string | null) {
  return useLikeTarget(
    { table: 'cellar_likes', targetColumn: 'owner_id' },
    ownerId,
  );
}
