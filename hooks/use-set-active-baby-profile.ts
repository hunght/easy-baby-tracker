import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Hook to set the active baby profile
 * Convex is reactive - all queries automatically update when the active profile changes
 * @returns Mutation function to set active baby profile
 */
export function useSetActiveBabyProfile() {
  const setActive = useMutation(api.babyProfiles.setActive);

  return {
    mutateAsync: async (babyId: Id<"babyProfiles">) => {
      await setActive({ babyId });
    },
    mutate: (babyId: Id<"babyProfiles">) => {
      setActive({ babyId });
    },
  };
}
