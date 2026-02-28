import { useState, useEffect } from "react";
import type { AppRole } from "./WorkspaceProvider";

export interface Membership {
  workspace_id: string;
  role: AppRole;
  rep_id: string | null;
  manager_id: string | null;
}

/**
 * TODO: Replace with Supabase
 * Fetch the authenticated user's membership (workspace, role, rep assignment).
 * Currently returns placeholder data.
 */
async function fetchMembership(userId: string): Promise<Membership> {
  // TODO: Replace with Supabase
  // const { data, error } = await supabase
  //   .from('workspace_members')
  //   .select('workspace_id, role, rep_id, manager_id')
  //   .eq('user_id', userId)
  //   .single();
  await new Promise((r) => setTimeout(r, 400));

  return {
    workspace_id: "workspace_demo_1",
    role: "proprietaire",
    rep_id: null,
    manager_id: null,
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
