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

import { mapDbRole } from "@/lib/roles/mapDbRole";


export const usersRepo = {
  async listTeamUsers(tenantId: string): Promise<TeamUser[]> {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, tenant_id, created_at")
      .filter("tenant_id", "eq", tenantId);

    if (error || !profiles) return [];

    return profiles.map((p: any) => ({
      id: p.user_id,
      user_id: p.user_id,
      display_name: p.full_name ?? "",
      email: "",
      phone: null,
      role: mapDbRole(p.role) ?? "representant",
      status: "actif" as const,
      disabled_at: null,
      invited_at: null,
      created_at: p.created_at,
    }));
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
