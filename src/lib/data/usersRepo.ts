/**
 * Users Repository — fetches team members from profiles table (single source of truth).
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

/** Map DB role (owner|manager|rep) to French AppRole */
function mapDbRole(dbRole: string): TeamUser["role"] {
  switch (dbRole) {
    case "owner": return "proprietaire";
    case "manager": return "gestionnaire";
    case "rep": return "representant";
    default: return dbRole as TeamUser["role"];
  }
}

export const usersRepo = {
  async listTeamUsers(tenantId: string): Promise<TeamUser[]> {
    // tenant_id is a new column not yet in generated types, use filter
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .filter("tenant_id", "eq", tenantId);

    if (error || !profiles) return [];

    return profiles.map((p) => {
      const hasConfirmed = !p.invited_at || p.updated_at > p.invited_at;
      let status: TeamUser["status"] = "actif";
      if (p.disabled_at) status = "désactivé";
      else if (p.invited_at && !hasConfirmed) status = "invité";

      return {
        id: p.id,
        user_id: p.user_id,
        display_name: p.display_name,
        email: "",
        phone: p.phone,
        role: mapDbRole(p.role),
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
    tenant_id: string;
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
