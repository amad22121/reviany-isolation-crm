/**
 * Users Repository — fetches team members from Supabase.
 */

import { supabase } from "@/integrations/supabase/client";

export interface TeamUser {
  id: string; // profile id
  user_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  role: "proprietaire" | "gestionnaire" | "representant";
  status: "actif" | "désactivé" | "invité";
  disabled_at: string | null;
  invited_at: string | null;
  created_at: string;
}

export const usersRepo = {
  async listTeamUsers(workspaceId: string): Promise<TeamUser[]> {
    // Get team members for this workspace
    const { data: members, error: tmError } = await supabase
      .from("team_members")
      .select("user_id, role, workspace_id, profile_id")
      .eq("workspace_id", workspaceId);

    if (tmError || !members?.length) return [];

    // Get profiles for these users
    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", userIds);

    if (pError || !profiles) return [];

    return profiles.map((p) => {
      const tm = members.find((m) => m.user_id === p.user_id);
      const hasConfirmed = !p.invited_at || p.updated_at > p.invited_at;
      let status: TeamUser["status"] = "actif";
      if (p.disabled_at) status = "désactivé";
      else if (p.invited_at && !hasConfirmed) status = "invité";

      return {
        id: p.id,
        user_id: p.user_id,
        display_name: p.display_name,
        email: "", // email from auth, we'll show what we have
        phone: p.phone,
        role: (tm?.role ?? p.role) as TeamUser["role"],
        status,
        disabled_at: p.disabled_at,
        invited_at: p.invited_at,
        created_at: p.created_at,
      };
    });
  },

  async inviteUser(payload: {
    email: string;
    display_name: string;
    phone?: string;
    role: string;
    workspace_id: string;
  }): Promise<{ error: string | null }> {
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: payload,
    });

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { error: null };
  },

  async updateUserStatus(
    targetUserId: string,
    disabled: boolean
  ): Promise<{ error: string | null }> {
    const { data, error } = await supabase.functions.invoke(
      "update-user-status",
      { body: { target_user_id: targetUserId, disabled } }
    );

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { error: null };
  },
};
