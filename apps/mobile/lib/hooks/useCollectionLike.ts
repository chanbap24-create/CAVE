import { useLikeTarget } from '@/lib/hooks/useLikeTarget';

/** Like / unlike an individual bottle (a row in `collections`). */
export function useCollectionLike(collectionId: number | null) {
  return useLikeTarget(
    { table: 'collection_likes', targetColumn: 'collection_id' },
    collectionId,
  );
}
