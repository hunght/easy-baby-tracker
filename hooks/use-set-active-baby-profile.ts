import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setActiveBabyProfileId } from '@/database/baby-profile';

/**
 * Hook to set the active baby profile and invalidate all cached queries
 * This ensures all data is refetched for the new active baby profile
 * @returns Mutation object with mutate function to set active baby profile
 */
export function useSetActiveBabyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (babyId: number) => {
      await setActiveBabyProfileId(babyId);
    },
    onSuccess: () => {
      // Invalidate all queries to refetch data for the new active baby profile
      queryClient.invalidateQueries();
    },
  });
}
