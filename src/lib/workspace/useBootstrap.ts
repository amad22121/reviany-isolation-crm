import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./WorkspaceProvider";
import { mapDbRole } from "@/lib/roles/mapDbRole";

export interface Membership {
  tenant_id: string;
  role: AppRole;
  rep_id: string | null;
  manager_id: string | null;
  display_name: string;
}

async function fetchMembership(userId: string): Promise<Membership | null> {
  // Use select("*") + cast to handle schema drift (full_name vs display_name)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const profile = data as any;

  const role = mapDbRole(profile.role);
  if (!role) {
    console.warn(`[useBootstrap] Unknown DB role "${profile.role}" for user ${userId}`);
    return null;
  }
  const tenantId = profile.tenant_id ?? "default";

  return {
    tenant_id: tenantId,
    role,
    rep_id: role === "representant" ? userId : null,
    manager_id: role === "gestionnaire" ? userId : null,
    display_name: profile.full_name || profile.display_name || "",
  };
}

export function useBootstrap(userId: string | null) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchMembership(userId).then((m) => {
      setMembership(m);
      setLoading(false);
    });
  }, [userId]);

  return { membership, loading };
}
