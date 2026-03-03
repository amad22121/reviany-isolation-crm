import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./WorkspaceProvider";

export interface Membership {
  workspace_id: string;
  role: AppRole;
  rep_id: string | null;
  manager_id: string | null;
  display_name: string;
}

async function fetchMembership(userId: string): Promise<Membership | null> {
  // First check if team_members entry exists
  const { data: tm } = await supabase
    .from("team_members")
    .select("workspace_id, role, user_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile && !tm) return null;

  const role = (tm?.role ?? profile?.role ?? "representant") as AppRole;
  const workspaceId = tm?.workspace_id ?? "default";

  return {
    workspace_id: workspaceId,
    role,
    rep_id: role === "representant" ? userId : null,
    manager_id: role === "gestionnaire" ? userId : null,
    display_name: profile?.display_name ?? "",
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
