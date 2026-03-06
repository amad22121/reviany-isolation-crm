import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./WorkspaceProvider";

export interface Membership {
  tenant_id: string;
  role: AppRole;
  rep_id: string | null;
  manager_id: string | null;
  display_name: string;
}

/** Map DB role strings (owner|manager|rep or legacy French) to AppRole */
function mapDbRole(dbRole: string | null | undefined): AppRole {
  switch (dbRole) {
    case "owner":
    case "proprietaire":
      return "proprietaire";
    case "manager":
    case "gestionnaire":
      return "gestionnaire";
    case "rep":
    case "representant":
    default:
      return "representant";
  }
}

async function fetchMembership(userId: string): Promise<Membership | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, role, user_id, tenant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) return null;

  const role = mapDbRole(profile.role);
  const tenantId = (profile as any).tenant_id ?? "default";

  return {
    tenant_id: tenantId,
    role,
    rep_id: role === "representant" ? userId : null,
    manager_id: role === "gestionnaire" ? userId : null,
    display_name: profile.display_name ?? "",
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
