import { useCommentsTarget } from '@/lib/hooks/useCommentsTarget';

/** Comments on an individual bottle (a row in `collections`). */
export function useCollectionComments(collectionId: number | null) {
  return useCommentsTarget(
    { table: 'collection_comments', targetColumn: 'collection_id' },
    collectionId,
  );
}
