/**
 * useTeamMembers — fetches team members (profiles + team_members) from Supabase.
 * Returns TeamMember[] where id = user_id (for repId compatibility).
 * React Query caches the result so multiple components can use this hook efficiently.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      const { data: members, error: tmErr } = await supabase
        .from("team_members")
        .select("user_id, role, profile_id");

      if (tmErr || !members?.length) return [];

      const profileIds = members.map((m) => m.profile_id);
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url")
        .in("id", profileIds);

      if (pErr || !profiles) return [];

      return profiles.map((p) => {
        const tm = members.find((m) => m.profile_id === p.id);
        return {
          id: String(p.user_id),
          name: p.display_name,
          role: tm?.role || "representant",
          avatar: p.avatar_url || undefined,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/** Utility: find rep name from a list of team members */
export function getRepNameFromList(members: TeamMember[], id: string | null | undefined): string {
  if (!id) return "—";
  return members.find((m) => m.id === id)?.name || id;
}
