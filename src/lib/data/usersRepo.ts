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
      .select("*")
      .filter("tenant_id", "eq", tenantId);

    if (error || !profiles) return [];

    return profiles.map((p: any) => ({
      id: p.user_id,
      user_id: p.user_id,
      display_name: p.full_name || p.display_name || "",
      email: p.email || "",
      phone: p.phone || null,
      role: mapDbRole(p.role) ?? "representant",
      status: (p.disabled_at ? "désactivé" : p.invited_at ? "invité" : "actif") as "actif" | "désactivé" | "invité",
      disabled_at: p.disabled_at ?? null,
      invited_at: p.invited_at ?? null,
      created_at: p.created_at,
    }));
  },

  async inviteUser(payload: {
    email: string;
    display_name: string;
    phone?: string;
    role: string;
    tenant_id: string;
  }): Promise<{ error: string | null; temp_password?: string }> {
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: {
        email: payload.email,
        full_name: payload.display_name,
        phone: payload.phone,
        role: payload.role,
        tenant_id: payload.tenant_id,
      },
    });

    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { error: null, temp_password: data?.temp_password };
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
