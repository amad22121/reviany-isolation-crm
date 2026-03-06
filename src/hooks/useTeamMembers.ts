/**
 * useTeamMembers — fetches team members from the profiles table.
 * Returns TeamMember[] where id = user_id (for repId compatibility).
 * React Query caches the result so multiple components can use this hook efficiently.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbRole } from "@/lib/roles/mapDbRole";

export interface TeamMember {
  id: string;       // user_id — matches repId fields in appointments, hot_calls, etc.
  name: string;
  role: string;
  avatar?: string;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*");

      if (error || !profiles) return [];

      return profiles.map((p: any) => ({
        id: String(p.user_id),
        name: p.full_name || p.display_name || "",
        role: mapDbRole(p.role) ?? "representant",
        avatar: undefined,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Utility: find rep name from a list of team members */
export function getRepNameFromList(members: TeamMember[], id: string | null | undefined): string {
  if (!id) return "—";
  return members.find((m) => m.id === id)?.name || id;
}
